const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const User = require('../models/User');
const Course = require('../models/Course');
const Cart = require('../models/Cart');

// --- Helper Functions ---

exports.getMyPurchasedCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'purchasedCourses',
      model: 'Course', // Explicitly specify the model name
      select: 'title description image instructor',
      populate: { path: 'instructor', model: 'User', select: 'name' },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: user.purchasedCourses });
  } catch (error) {
    console.error('Error fetching purchased courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchased courses.' });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items provided.' });

    const courseIds = items.map(item => item.courseId);
    const coursesFromDB = await Course.find({ _id: { $in: courseIds } });
    if (coursesFromDB.length !== items.length) return res.status(400).json({ message: 'One or more courses not found.' });

    const line_items = coursesFromDB.map(course => {
      const item = items.find(i => i.courseId === course._id.toString());
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: course.title, images: [course.image], description: course.shortDescription || 'Online Course' },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        userId: userId,
        // The metadata value must be a string.
        items: JSON.stringify(items),
      },
    });
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ message: 'Failed to create Stripe session' });
  }
};

// @desc    Handle Stripe webhook for successful payments
// @route   POST /api/orders/stripe-webhook
// @access  Public (protected by Stripe signature)
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // --- START: THE FIX ---
  // We only care about the 'checkout.session.completed' event.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Processing checkout.session.completed for session ID:', session.id);

    // This is the function that will perform all our database operations.
    const fulfillOrder = async (session) => {
      try {
        console.log('--- FULFILLING ORDER ---');
        
        // 1. Extract metadata
        const userId = session.metadata.userId;
        const purchasedItems = JSON.parse(session.metadata.items);
        const courseIds = purchasedItems.map(item => item.courseId);

        console.log(`[1/4] Metadata: UserID=${userId}, CourseIDs=${courseIds.join(', ')}`);

        // 2. Create the Order document
        await Order.create({
          user: userId,
          courses: courseIds,
          totalAmount: session.amount_total / 100,
          stripePaymentIntentId: session.payment_intent,
        });
        console.log('[2/4] Order document created.');

        // 3. Update the User document to grant access to courses
        const userUpdateResult = await User.updateOne(
          { _id: userId },
          { $addToSet: { purchasedCourses: { $each: courseIds } } }
        );
        console.log(`[3/4] User document updated. Matched: ${userUpdateResult.matchedCount}, Modified: ${userUpdateResult.modifiedCount}`);
        
        // 4. Update the Cart document to remove purchased items
        const cartUpdateResult = await Cart.updateOne(
          { user: userId },
          { $pull: { items: { course: { $in: courseIds } } } }
        );
        console.log(`[4/4] Cart document updated. Matched: ${cartUpdateResult.matchedCount}, Modified: ${cartUpdateResult.modifiedCount}`);
        
        console.log('--- ORDER FULFILLED SUCCESSFULLY ---');

      } catch (err) {
        // This will catch any error during the fulfillment process
        console.error('❌ Error during order fulfillment:', err);
        throw err; // Re-throw the error to be caught by the outer block
      }
    };

    try {
      await fulfillOrder(session);
    } catch(err) {
      // If fulfillOrder throws an error, we send a 500 status.
      // This tells Stripe that the webhook failed and it should try again later.
      return res.status(500).send({ error: 'Failed to fulfill order.' });
    }
  }
  // --- END: THE FIX ---

  // Acknowledge receipt of the event to Stripe with a 200 status
  res.status(200).send();
};