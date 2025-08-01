import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccessPage = () => {
  return (
    <div className="container mx-auto text-center py-20 min-h-screen">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md mx-auto">
        <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">Thank you for your purchase. You can now access your new courses.</p>
        
        {/* --- THE FIX --- */}
        {/* Your App.js uses "/my-courses". This link must match exactly. */}
        <Link 
          to="/my-courses" 
          className="bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
        >
          Go to My Courses
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;