// controllers/order.controller.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const User = require('../models/User');
const Course = require('../models/Course');
const Cart = require('../models/Cart');

// --- FUNCTION 1: CREATE CHECKOUT SESSION (Enhanced with better metadata) ---
exports.createCheckoutSession = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;
    
    console.log('🛒 Creating checkout session for user:', userId);
    console.log('🛒 Items requested:', items);
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided.' });
    }
    
    const courseIds = items.map(item => item.courseId);
    const coursesFromDB = await Course.find({ _id: { $in: courseIds } });
    
    console.log('🛒 Courses found in DB:', coursesFromDB.length);
    
    if (coursesFromDB.length !== items.length) {
      return res.status(400).json({ message: 'One or more courses not found.' });
    }
    
    const line_items = coursesFromDB.map(course => ({
      price_data: {
        currency: 'usd',
        product_data: { 
          name: course.title, 
          images: course.image ? [course.image] : [] 
        },
        unit_amount: Math.round(course.price * 100),
      },
      quantity: 1,
    }));
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        userId: userId.toString(), // Ensure it's a string
        courseIds: JSON.stringify(courseIds), // Store course IDs directly
        userEmail: req.user.email, // Add email for extra validation
      },
    });
    
    console.log('🛒 Checkout session created:', session.id);
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('❌ Stripe Session Error:', error);
    res.status(500).json({ message: 'Failed to create Stripe session' });
  }
};

// --- FUNCTION 2: HANDLE STRIPE WEBHOOK (Enhanced with better error handling) ---
exports.handleStripeWebhook = async (req, res) => {
  console.log('🎯 === STRIPE WEBHOOK ENDPOINT HIT ===');
  console.log('🎯 Headers:', JSON.stringify(req.headers, null, 2));
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook signature verified successfully.');
    console.log('🎯 Event type:', event.type);
  } catch (err) {
    console.error('❌ WEBHOOK SIGNATURE VERIFICATION FAILED:', err.message);
    console.error('❌ Raw body type:', typeof req.body);
    console.error('❌ Raw body length:', req.body ? req.body.length : 'undefined');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('🎯 Processing payment for session ID:', session.id);
    console.log('🎯 Session metadata:', JSON.stringify(session.metadata, null, 2));
    console.log('🎯 Session amount:', session.amount_total);

    try {
      console.log('🎯 === STARTING ORDER FULFILLMENT ===');
      
      const { userId, courseIds, userEmail } = session.metadata;
      
      // Enhanced validation
      if (!userId) {
        throw new Error('Critical Error: Missing userId in session metadata');
      }
      
      if (!courseIds) {
        throw new Error('Critical Error: Missing courseIds in session metadata');
      }
      
      let parsedCourseIds;
      try {
        parsedCourseIds = JSON.parse(courseIds);
      } catch (parseError) {
        throw new Error('Critical Error: Invalid courseIds format in metadata');
      }
      
      console.log(`🎯 [DATA] UserID: ${userId}`);
      console.log(`🎯 [DATA] User Email: ${userEmail}`);
      console.log(`🎯 [DATA] CourseIDs: ${parsedCourseIds.join(', ')}`);

      if (!Array.isArray(parsedCourseIds) || parsedCourseIds.length === 0) {
        throw new Error('Critical Error: CourseIDs array is empty or invalid');
      }

      // Verify user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        throw new Error(`Critical Error: User ${userId} not found in database`);
      }
      console.log(`🎯 [OK] User ${userId} verified in database`);

      // Verify courses exist
      const coursesFromDB = await Course.find({ _id: { $in: parsedCourseIds } });
      if (coursesFromDB.length !== parsedCourseIds.length) {
        throw new Error(`Critical Error: Some courses not found. Expected: ${parsedCourseIds.length}, Found: ${coursesFromDB.length}`);
      }
      console.log(`🎯 [OK] All ${coursesFromDB.length} courses verified in database`);

      // 1. CREATE THE ORDER
      const itemsForOrder = coursesFromDB.map(course => ({ 
        course: course._id, 
        price: course.price 
      }));
      
      const newOrder = await Order.create({
        user: userId,
        items: itemsForOrder,
        totalAmount: session.amount_total / 100,
        status: 'completed',
        paymentId: session.payment_intent,
        stripeSessionId: session.id, // Add this for tracking
        createdAt: new Date()
      });
      
      console.log(`🎯 [OK] Step 1/3: Order created with ID ${newOrder._id}`);

      // 2. UPDATE THE USER - Add courses to purchasedCourses array
      const userUpdateResult = await User.updateOne(
        { _id: userId },
        { 
          $addToSet: { 
            purchasedCourses: { $each: parsedCourseIds } 
          }
        }
      );
      
      console.log(`🎯 [OK] Step 2/3: User update result:`, userUpdateResult);
      
      // Verify the update worked
      const updatedUser = await User.findById(userId).select('purchasedCourses');
      console.log(`🎯 [VERIFY] User now has ${updatedUser.purchasedCourses.length} purchased courses`);
      console.log(`🎯 [VERIFY] Purchased courses:`, updatedUser.purchasedCourses);

      // 3. CLEAR THE CART
      const cartUpdateResult = await Cart.updateOne(
        { user: userId },
        { $pull: { items: { course: { $in: parsedCourseIds } } } }
      );
      
      console.log(`🎯 [OK] Step 3/3: Cart update result:`, cartUpdateResult);
      
      // Verify cart was cleared
      const updatedCart = await Cart.findOne({ user: userId });
      console.log(`🎯 [VERIFY] Cart now has ${updatedCart?.items?.length || 0} items`);
      
      console.log('🎯 === ✅ ORDER FULFILLED SUCCESSFULLY ===');

    } catch (err) {
      console.error('🎯 === ❌ CRITICAL ERROR FULFILLING ORDER ===');
      console.error('🎯 Error details:', err.message);
      console.error('🎯 Error stack:', err.stack);
      
      // Still return 200 to Stripe to prevent retries, but log the error
      // You might want to implement a notification system here
      console.error('🎯 ⚠️  MANUAL INTERVENTION REQUIRED - Order may need manual processing');
      
      // Optionally, you could create a failed order record here for manual review
      try {
        await Order.create({
          user: session.metadata.userId || 'unknown',
          items: [],
          totalAmount: session.amount_total / 100,
          status: 'failed',
          paymentId: session.payment_intent,
          stripeSessionId: session.id,
          errorMessage: err.message,
          createdAt: new Date()
        });
        console.log('🎯 Failed order record created for manual review');
      } catch (orderError) {
        console.error('🎯 Could not create failed order record:', orderError.message);
      }
    }
  } else {
    console.log(`🎯 Unhandled event type: ${event.type}`);
  }

  // Always return 200 to Stripe
  res.status(200).json({ received: true });
};

// --- FUNCTION 3: GET MY COURSES (Enhanced with better debugging) ---
exports.getMyCourses = async (req, res) => {
  try {
    console.log('📚 getMyCourses called for user:', req.user.id);
    
    // Method 1: Get courses from orders
    const orders = await Order.find({ 
      user: req.user.id, 
      status: 'completed' 
    }).populate('items.course');
    
    console.log('📚 Found orders:', orders.length);
    
    if (!orders || orders.length === 0) {
      console.log('📚 No completed orders found, checking user.purchasedCourses...');
      
      // Method 2: Get courses from user.purchasedCourses (fallback)
      const user = await User.findById(req.user.id).populate('purchasedCourses');
      
      if (user && user.purchasedCourses && user.purchasedCourses.length > 0) {
        console.log('📚 Found courses in user.purchasedCourses:', user.purchasedCourses.length);
        
        const coursesWithInstructor = await Course.find({ 
          '_id': { $in: user.purchasedCourses } 
        }).populate('instructor', 'name');
        
        return res.status(200).json({ 
          success: true, 
          data: coursesWithInstructor,
          source: 'user.purchasedCourses'
        });
      }
      
      console.log('📚 No purchased courses found anywhere');
      return res.status(200).json({ success: true, data: [], source: 'none' });
    }
    
    // Extract courses from orders
    const courseIds = orders.flatMap(order => 
      order.items.map(item => item.course._id || item.course)
    );
    
    const uniqueCourseIds = [...new Set(courseIds.map(id => id.toString()))];
    console.log('📚 Unique course IDs from orders:', uniqueCourseIds);
    
    const courses = await Course.find({ 
      '_id': { $in: uniqueCourseIds } 
    }).populate('instructor', 'name');
    
    console.log('📚 Final courses to return:', courses.length);
    
    res.status(200).json({ 
      success: true, 
      data: courses,
      source: 'orders'
    });
    
  } catch (error) {
    console.error('❌ Error in getMyCourses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching courses.',
      error: error.message 
    });
  }
};

// --- FUNCTION 4: MANUAL ORDER VERIFICATION (New debugging function) ---
exports.debugUserPurchases = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 === DEBUGGING USER PURCHASES ===');
    console.log('🔍 User ID:', userId);
    
    // Check user's purchasedCourses array
    const user = await User.findById(userId).populate('purchasedCourses');
    console.log('🔍 User purchasedCourses:', user?.purchasedCourses?.length || 0);
    
    // Check orders
    const orders = await Order.find({ user: userId });
    console.log('🔍 Total orders:', orders.length);
    console.log('🔍 Completed orders:', orders.filter(o => o.status === 'completed').length);
    
    // Check cart
    const cart = await Cart.findOne({ user: userId });
    console.log('🔍 Cart items:', cart?.items?.length || 0);
    
    // Recent Stripe sessions (if you want to check)
    // This would require storing session IDs or querying Stripe API
    
    res.json({
      userId,
      purchasedCoursesCount: user?.purchasedCourses?.length || 0,
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      cartItems: cart?.items?.length || 0,
      purchasedCourses: user?.purchasedCourses || [],
      orders: orders.map(o => ({
        id: o._id,
        status: o.status,
        totalAmount: o.totalAmount,
        itemCount: o.items.length,
        createdAt: o.createdAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Error in debugUserPurchases:', error);
    res.status(500).json({ error: error.message });
  }
};