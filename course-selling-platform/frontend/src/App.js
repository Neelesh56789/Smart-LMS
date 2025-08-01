import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LearnCoursePage from './pages/LearnCoursePage';

// Stripe Imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Layout and Common Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/common/PrivateRoute';
import InstructorRoute from './components/common/InstructorRoute';

// Page Components
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage'; 
import PaymentSuccessPage from './pages/PaymentSuccessPage'; 
import PaymentCancelPage from './pages/PaymentCancelPage';
import ProfilePage from './pages/ProfilePage';
import PurchasedCoursesPage from './pages/PurchasedCoursesPage';
import InstructorDashboardPage from './pages/InstructorDashboardPage';
import CreateCoursePage from './pages/CreateCoursePage';
import CourseContentPage from './pages/CourseContentPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// Load Stripe with your publishable key. This should be done outside of the component render.
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <Elements stripe={stripePromise}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            
            {/* Payment Flow Routes */}
            <Route path="/checkout" element={<CheckoutPage />} /> 
            <Route path="/payment-success" element={<PaymentSuccessPage />} /> 
            <Route path="/payment-cancel" element={<PaymentCancelPage />} /> 
            
            {/* User Protected Routes */}
            <Route path="/cart" element={
              <PrivateRoute>
                <CartPage />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />
            <Route path="/my-courses" element={
              <PrivateRoute>
                <PurchasedCoursesPage />
              </PrivateRoute>
            } />
            <Route path="/courses/:courseId/learn" element={
              <PrivateRoute>
                <LearnCoursePage />
              </PrivateRoute>
            } />
            

            {/* Instructor Protected Routes */}
            <Route path="/instructor/dashboard" element={
              <InstructorRoute>
                <InstructorDashboardPage />
              </InstructorRoute>
            } />
            <Route path="/instructor/create-course" element={
              <InstructorRoute>
                <CreateCoursePage />
              </InstructorRoute>  // <--- THIS IS THE FIX
            } />
            <Route path="/instructor/courses/:id/content" element={
              <InstructorRoute>
                <CourseContentPage />
              </InstructorRoute>
            } />

            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </Elements>
  );
}

export default App;