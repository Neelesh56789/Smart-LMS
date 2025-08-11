// controllers/order.controller.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const User = require('../models/User');
const Course = require('../models/Course');
const Cart = require('../models/Cart');

// --- FUNCTION 1: CREATE CHECKOUT SESSION (Enhanced with better metadata)
exports.createCheckoutSession = async (req, res) => {
  try {
    const { userId, cartItems } = req.body;

    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: { userId: userId, cart: JSON.stringify(cartItems) },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// --- FUNCTION 2: STRIPE WEBHOOK HANDLER
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const cartItems = JSON.parse(session.metadata.cart);

    try {
      const order = await Order.create({
        user: userId,
        items: cartItems,
        total: session.amount_total / 100,
        status: 'paid',
      });

      // DEBUG LOG: Show all orders after new order creation
      const orders = await Order.find({}).lean();
      console.log(
        '📦 Current Orders:',
        orders.map((o) => ({ id: o._id, user: o.user, status: o.status }))
      );

      await Cart.deleteMany({ user: userId });

      for (const item of cartItems) {
        await Course.findByIdAndUpdate(item.courseId, {
          $addToSet: { students: userId },
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  res.json({ received: true });
};

// --- FUNCTION 3: GET ALL ORDERS
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // DEBUG LOG: Show all orders when fetched
    console.log(
      '📦 Fetched Orders:',
      orders.map((o) => ({ id: o._id, user: o.user, status: o.status }))
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
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