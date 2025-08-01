import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancelPage = () => {
  return (
    <div className="container mx-auto text-center py-20 min-h-screen">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Payment Canceled</h1>
      <p className="text-lg mb-6">Your payment was not processed. Your cart has been saved.</p>
      <Link to="/cart" className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700">
        Return to Cart
      </Link>
    </div>
  );
};

export default PaymentCancelPage;