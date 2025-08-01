const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Course = require('../models/Course');

const populateCart = (cartId) => {
  return Cart.findById(cartId).populate({
    path: 'items.course',
    select: 'title price image instructor published',
    populate: {
      path: 'instructor',
      select: 'name',
    },
  });
};

exports.getCart = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    const populatedCart = await populateCart(cart._id);
    
    const originalItemCount = populatedCart.items.length;
    populatedCart.items = populatedCart.items.filter(item => item.course && item.course.published);
    
    if (populatedCart.items.length !== originalItemCount) {
      await populatedCart.save();
    }

    return res.status(200).json({ success: true, data: populatedCart });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve cart.' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'A valid course ID is required' });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.published) {
      return res.status(404).json({ success: false, message: 'Course not found or is unavailable' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.course.equals(courseId));

    if (itemIndex > -1) {
      return res.status(400).json({ success: false, message: 'Course is already in your cart' });
    }
    
    // Add the new item. Quantity is no longer a concept here.
    cart.items.push({ course: courseId, price: course.price });
    cart.updatedAt = Date.now();
    await cart.save();
    
    const updatedCart = await populateCart(cart._id);
    return res.status(200).json({ success: true, data: updatedCart, message: 'Course added to cart' });

  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { course: courseId } } },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const updatedCart = await populateCart(cart._id);
    return res.status(200).json({ success: true, data: updatedCart, message: 'Item removed successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      cart.items = [];
      cart.updatedAt = Date.now();
      await cart.save();
    } else {
      cart = { items: [] };
    }
    
    return res.status(200).json({ success: true, data: cart, message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
};