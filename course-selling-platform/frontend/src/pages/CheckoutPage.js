import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import { getCart } from '../redux/slices/cartSlice';
import { useStripe } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import api from '../api';

const CheckoutPage = () => {
  const stripe = useStripe();
  const dispatch = useDispatch();
  const location = useLocation();

  const buyNowItems = location.state?.items;
  const cartFromRedux = useSelector(state => state.cart.cart);
  const cartLoading = useSelector(state => state.cart.loading);

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (buyNowItems) {
      setCheckoutItems(buyNowItems);
      const buyNowTotal = buyNowItems.reduce((sum, item) => sum + item.price, 0);
      setTotal(buyNowTotal);
    } else {
      dispatch(getCart());
    }
  }, [buyNowItems, dispatch]);

  useEffect(() => {
    if (!buyNowItems && cartFromRedux) {
      setCheckoutItems(cartFromRedux.items);
      const cartTotal = cartFromRedux.items.reduce((sum, item) => sum + item.price, 0);
      setTotal(cartTotal);
    }
  }, [cartFromRedux, buyNowItems]);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!stripe || checkoutItems.length === 0) {
      toast.error('Stripe is not loaded or there are no items to check out.');
      return;
    }

    setIsProcessing(true);

    try {
      const itemsForBackend = checkoutItems.map(item => ({
        courseId: item.course._id,
        quantity: 1, 
      }));

      const { data } = await api.post('/orders/create-checkout-session', {
        items: itemsForBackend,
      });

      const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
      if (error) throw new Error(error.message);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed. Please try again.';
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  if (cartLoading && !buyNowItems) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 border-b pb-4">Order Summary</h2>
        {checkoutItems.length > 0 ? (
          checkoutItems.map(item => (
            <div key={item.course._id} className="flex justify-between items-center py-3">
              <div className="flex items-center">
                  <img src={item.course.image} alt={item.course.title} className="w-16 h-12 object-cover rounded mr-4" />
                  <div>
                      <p className="font-semibold">{item.course.title}</p>
                      {/* Quantity is always 1, so no need to display it */}
                  </div>
              </div>
              <span className="font-semibold">${(item.price).toFixed(2)}</span>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p>Your order is empty.</p>
            <Link to="/courses" className="text-blue-600 hover:underline mt-2 inline-block">Browse Courses</Link>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg mt-6 border-t pt-4">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
        </div>
        <button
          onClick={handlePayment}
          disabled={isProcessing || !stripe || checkoutItems.length === 0}
          className="mt-8 w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Proceed to Payment`}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;