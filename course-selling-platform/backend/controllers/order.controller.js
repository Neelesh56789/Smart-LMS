// controllers/order.controller.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const User = require('../models/User');
const Course = require('../models/Course');
const Cart = require('../models/Cart');

// --- FUNCTION 1: CREATE CHECKOUT SESSION (No changes needed here) ---
exports.createCheckoutSession = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items provided.' });
    const courseIds = items.map(item => item.courseId);
    const coursesFromDB = await Course.find({ _id: { $in: courseIds } });
    if (coursesFromDB.length !== items.length) return res.status(400).json({ message: 'One or more courses not found.' });
    const line_items = coursesFromDB.map(course => ({
      price_data: {
        currency: 'usd',
        product_data: { name: course.title, images: [course.image] },
        unit_amount: Math.round(course.price * 100),
      },
      quantity: 1,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        userId: userId,
        items: JSON.stringify(items.map(item => ({ courseId: item.courseId }))),
      },
    });
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ message: 'Failed to create Stripe session' });
  }
};


// --- FUNCTION 2: HANDLE STRIPE WEBHOOK (THE REAL FIX WITH LOGGING) ---
exports.handleStripeWebhook = async (req, res) => {
  console.log('--- STRIPE WEBHOOK ENDPOINT HIT ---'); // Log 1: Check if endpoint is reached
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook signature verified successfully.'); // Log 2
  } catch (err) {
    console.error('❌ WEBHOOK SIGNATURE VERIFICATION FAILED:', err.message); // Important Error Log
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Processing payment for session ID:', session.id); // Log 3

    try {
      console.log('--- STARTING ORDER FULFILLMENT ---'); // Log 4
      const userId = session.metadata.userId;
      const purchasedItems = JSON.parse(session.metadata.items);
      const courseIds = purchasedItems.map(item => item.courseId);
      console.log(`[DATA] UserID: ${userId}, CourseIDs: ${courseIds.join(', ')}`); // Log 5

      if (!userId || !courseIds || courseIds.length === 0) {
          throw new Error('Critical Error: Metadata from Stripe is missing UserID or CourseIDs.');
      }

      // 1. CREATE THE ORDER
      const coursesFromDB = await Course.find({ _id: { $in: courseIds } });
      const itemsForOrder = coursesFromDB.map(c => ({ course: c._id, price: c.price }));
      await Order.create({
        user: userId,
        items: itemsForOrder,
        totalAmount: session.amount_total / 100,
        status: 'completed',
        paymentId: session.payment_intent,
      });
      console.log(`[OK] Step 1/3: Order created for user ${userId}.`); // Log 6

      // 2. UPDATE THE USER
      await User.updateOne(
        { _id: userId },
        { $addToSet: { purchasedCourses: { $each: courseIds } } }
      );
      console.log(`[OK] Step 2/3: User ${userId} granted access to courses.`); // Log 7

      // 3. CLEAR THE CART
      await Cart.updateOne(
        { user: userId },
        { $pull: { items: { course: { $in: courseIds } } } }
      );
      console.log(`[OK] Step 3/3: Cart cleared for user ${userId}.`); // Log 8
      console.log('--- ✅ ORDER FULFILLED SUCCESSFULLY ---');

    } catch (err) {
      // This is the most important log. It will show any error during the 3 steps.
      console.error('--- ❌ CRITICAL ERROR FULFILLING ORDER ---', err);
      return res.status(500).json({ error: 'Failed to fulfill order.' });
    }
  }

  res.status(200).json({ received: true });
};


// --- FUNCTION 3: GET MY COURSES (No changes needed here) ---
exports.getMyCourses = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id });
    if (!orders || orders.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    const courseIds = orders.flatMap(order => order.items.map(item => item.course));
    const courses = await Course.find({ '_id': { $in: courseIds } }).populate('instructor', 'name');
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('Error in getMyCourses:', error);
    res.status(500).json({ success: false, message: 'Server error fetching courses.' });
  }
};