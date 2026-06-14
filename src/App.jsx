import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";

// Layout & Components
import Navbar from './components/homepage/Navbar';
import ProfileCompletionBar from './components/layout/ProfileCompletionBar';
import BottomNavigation from './components/layout/BottomNavigation';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ProfileCompletionGuard from './components/layout/ProfileCompletionGuard';
import BusinessProtectedRoute from './pages/business/BusinessProtectedRoutes';
import ScrollToTop from './components/layout/ScrollToTop';
import BusinessAccessGuard from './components/layout/BusinessAccessGuard';

// Pages
import Homepage from './pages/Homepage';
import ForBusiness from './pages/ForBusiness.jsx';
import FAQs from './pages/FAQs.jsx';
import Signup from './pages/Signup';
import Login from './pages/Login';
import LoginSuccess from './pages/LoginSuccess';
import Profile from './pages/Profile';
import Campaigns from './pages/Campaigns';
import Survey from './pages/Survey';
import CampaignHistory from './pages/CampaignHistory';
import CompleteProfile from './pages/CompleteProfile';
import CompleteBasicInfo from './pages/CompleteBasicInfo';
import EmailVerificationPending from './pages/EmailVerificationPending';
import VerifyEmail from './pages/VerifyEmail';
import StandaloneSurvey from './pages/StandaloneSurvey.jsx';
import StandaloneSurveys from './pages/StandaloneSurveys.jsx';
import SurveyHistory from './pages/SurveyHistory.jsx';
import Shop from './pages/Shop.jsx';
import Vouchers from './pages/Vouchers';
import VoucherDetail from './pages/VoucherDetail';
import EditProfile from './pages/EditProfile';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateCampaign from './pages/admin/CreateCampaign';
import CreateSepSurvey from './pages/admin/CreateSepSurvey.jsx';
import AdminBusinessManagement from './pages/admin/AdminBusinessManagement';

// Business
import BusinessScan from './pages/business/BusinessScan';
import BusinessDashboard from './pages/business/BusinessDashboard';

// Public / auth pages
import ResetPassword from './pages/ResetPassword';
import ResetPasswordToken from './pages/ResetPasswordToken';

import { AnimationProvider } from './components/animations/AnimationContext';
import PageTransition from './components/animations/PageTransition';

function RouteChangeHandler() {
  const location = useLocation();
  useEffect(() => {
    toast.dismiss();
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <>
    {createPortal(
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          loading: {
            duration: Infinity,
          },
        }}
      />,
      document.body
    )}
    <AnimationProvider>
      <Router>
        <RouteChangeHandler />
        <ScrollToTop />

        <div className="sticky top-0 z-50">
          <Navbar />
          <ProfileCompletionBar />
        </div>
        
        <BusinessAccessGuard />

        <Routes>
          <Route element={<PageTransition />}>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/signup" element={<Signup />} />
           <Route path="/login" element={<Login />} />
            <Route path="/login/success" element={<LoginSuccess />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPasswordToken />} />
            <Route path="/" element={<Homepage />} />
            <Route path="/for-business" element={<ForBusiness />} />
           <Route path="/faqs" element={<FAQs />} />
           <Route path="/email-verification" element={<EmailVerificationPending />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* ==================== BASIC INFO COMPLETION (Tier 1) ==================== */}
           <Route
              path="/complete-basic-info"
              element={
                <ProtectedRoute>
                  <CompleteBasicInfo />
                </ProtectedRoute>
              }
            />

            {/* ==================== DEMOGRAPHICS COMPLETION (Tier 2) ==================== */}
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <ProfileCompletionGuard>
                    <CompleteProfile />
                  </ProfileCompletionGuard>
                </ProtectedRoute>
              }
            />

            {/* ==================== PROTECTED ROUTES ==================== */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/shop"
              element={
                <ProtectedRoute>
                  <Shop />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vouchers"
              element={
                <ProtectedRoute>
                  <Vouchers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vouchers/:id"
              element={
                <ProtectedRoute>
                  <VoucherDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns"
              element={
                <ProtectedRoute requireProfileComplete={true}>
                  <Campaigns />
                </ProtectedRoute>
              }
            />

            <Route
              path="/survey/:campaignId"
              element={
                <ProtectedRoute requireProfileComplete={true}>
                  <Survey />
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaign-history"
              element={
                <ProtectedRoute requireProfileComplete={true}>
                  <CampaignHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/standalone-surveys"
              element={
                <ProtectedRoute requireProfileComplete={true}>
                  <StandaloneSurveys />
                </ProtectedRoute>
              }
            />

            <Route
              path="/standalone-survey/:surveyId"
              element={
                <ProtectedRoute requireProfileComplete={true}>
                  <StandaloneSurvey />
                </ProtectedRoute>
              }
            />

            <Route
              path="/survey-history"
              element={
                <ProtectedRoute requireProfileComplete={true}>
                  <SurveyHistory />
                </ProtectedRoute>
              }
            />

            {/* ==================== ADMIN ROUTES ==================== */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/create-campaign" element={<CreateCampaign />} />

            <Route
              path="/admin/create-sep-survey"
              element={
                <ProtectedRoute>
                  <CreateSepSurvey />
                </ProtectedRoute>
              }
            />

            <Route path="/admin/businesses" element={<AdminBusinessManagement />} />

            {/* ==================== BUSINESS ROUTES ==================== */}

            <Route
              path="/business/scan"
              element={
                <BusinessProtectedRoute>
                  <BusinessScan />
                </BusinessProtectedRoute>
              }
            />

            <Route
              path="/business/dashboard"
              element={
                <BusinessProtectedRoute>
                  <BusinessDashboard />
                </BusinessProtectedRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="text-center py-20 text-2xl">
                  404 - Page Not Found
                </div>
              }
            />
          </Route>
        </Routes>

        <Footer />
        <BottomNavigation />
      </Router>
    </AnimationProvider>
    </>
  );
}

export default App;