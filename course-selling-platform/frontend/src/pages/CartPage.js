import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCart, removeFromCart, clearCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { cart, loading, error } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // Prevent infinite loops with useState
  const [hasInitialized, setHasInitialized] = useState(false);

  const renderInstructorName = (instructor) => {
    return instructor?.name || 'Smart LMS';
  };

  useEffect(() => {
    console.log('🛒 CartPage useEffect triggered', {
      isAuthenticated,
      hasInitialized,
      cart: !!cart,
      loading
    });

    if (!isAuthenticated) {
      toast.info("Please login to view your cart.");
      navigate('/login');
      return;
    }

    // Only fetch if we haven't initialized and user is authenticated
    if (isAuthenticated && !hasInitialized) {
      console.log('🛒 Dispatching getCart for first time');
      setHasInitialized(true);
      dispatch(getCart());
    }
  }, [isAuthenticated, navigate, dispatch, hasInitialized]);

  // Reset initialization when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setHasInitialized(false);
    }
  }, [isAuthenticated]);

  const handleRemoveItem = async (courseId) => {
    if (!courseId) return;
    try {
      await dispatch(removeFromCart(courseId)).unwrap();
      toast.success('Item removed from cart');
    } catch (err) {
      const errorMessage = err || 'Failed to remove item';
      toast.error(errorMessage);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      try {
        await dispatch(clearCart()).unwrap();
        toast.success('Cart cleared');
      } catch (err) {
        const errorMessage = err || 'Failed to clear cart';
        toast.error(errorMessage);
      }
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleRetry = () => {
    console.log('🛒 Manual retry triggered');
    dispatch(getCart());
  };

  // Debug info (remove in production)
  console.log('🛒 CartPage render:', {
    loading,
    error,
    cart: cart ? 'exists' : 'null',
    cartItems: cart?.items?.length || 0
  });

  // Safeguard: ensure cart and cart.items exist
  const cartItems = cart?.items || [];
  const total = cartItems.reduce((accumulator, item) => {
    return accumulator + (item.course?.price || 0);
  }, 0);

  // Show loading only when there's no cart data and loading is true
  if (loading && !cart) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading your cart...</p>
        <button 
          onClick={handleRetry}
          className="mt-4 text-blue-500 hover:text-blue-700 underline"
        >
          Taking too long? Click to retry
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <p><strong>Error:</strong> {error}</p>
          <button 
            onClick={handleRetry}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen py-10">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="mt-4 text-xl font-medium text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-500">Looks like you haven't added any courses yet.</p>
            <Link to="/courses" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Cart Items ({cartItems.length})</h2>
                {cartItems.length > 0 && (
                  <button onClick={handleClearCart} className="text-sm font-medium text-red-600 hover:text-red-800">
                    Clear Cart
                  </button>
                )}
              </div>
              
              {cartItems.map((item, index) => (
                <div key={item.course?._id || item._id || index} className="p-6 border-b last:border-b-0 flex">
                  <img 
                    src={item.course?.image || item.course?.thumbnail || 'https://via.placeholder.com/150'} 
                    alt={item.course?.title || 'Course'} 
                    className="w-32 h-24 object-cover rounded mr-6"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                  <div className="flex-grow flex flex-col">
                    <div>
                      <h3 className="text-lg font-semibold hover:text-blue-600">
                        {item.course?._id ? (
                          <Link to={`/courses/${item.course._id}`}>{item.course?.title || 'Course not found'}</Link>
                        ) : (
                          <span>{item.course?.title || 'Course not found'}</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">By {renderInstructorName(item.course?.instructor)}</p>
                    </div>
                    <div className="mt-auto flex justify-end items-center">
                      <button 
                        onClick={() => handleRemoveItem(item.course?._id)} 
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        {loading ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-800 ml-6">
                    ${(item.course?.price || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              <div className="space-y-4">
                <div className="border-t pt-4 mt-4 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={handleCheckout} 
                className="mt-6 w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50"
                disabled={cartItems.length === 0 || loading}
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;