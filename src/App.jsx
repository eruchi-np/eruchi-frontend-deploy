import React, { useEffect, useRef, lazy, Suspense } from 'react';
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
import RouteFallback from './components/ui/RouteFallback';
import { RouteErrorBoundary } from './components/layout/ErrorBoundary';
import usePageMeta from './hooks/usePageMeta';
import { getRouteMeta } from './utils/routeMeta';

const Homepage = lazy(() => import('./pages/Homepage'));
const ForBusiness = lazy(() => import('./pages/ForBusiness.jsx'));
const FAQs = lazy(() => import('./pages/FAQs.jsx'));
const Signup = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login'));
const LoginSuccess = lazy(() => import('./pages/LoginSuccess'));
const Profile = lazy(() => import('./pages/Profile'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Survey = lazy(() => import('./pages/Survey'));
const CampaignHistory = lazy(() => import('./pages/CampaignHistory'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const CompleteBasicInfo = lazy(() => import('./pages/CompleteBasicInfo'));
const EmailVerificationPending = lazy(() => import('./pages/EmailVerificationPending'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const StandaloneSurvey = lazy(() => import('./pages/StandaloneSurvey.jsx'));
const StandaloneSurveys = lazy(() => import('./pages/StandaloneSurveys.jsx'));
const SurveyComplete = lazy(() => import('./pages/SurveyComplete.jsx'));
const SurveyHistory = lazy(() => import('./pages/SurveyHistory.jsx'));
const Shop = lazy(() => import('./pages/Shop.jsx'));
const Vouchers = lazy(() => import('./pages/Vouchers'));
const VoucherDetail = lazy(() => import('./pages/VoucherDetail'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Terms = lazy(() => import('./pages/Terms'));
const PrivacyPolicy = lazy(() => import('./pages/LegalNotice'));
const CompleteAdditionalProfile = lazy(() => import('./pages/CompleteAdditionalProfile'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CreateCampaign = lazy(() => import('./pages/admin/CreateCampaign'));
const CreateSepSurvey = lazy(() => import('./pages/admin/CreateSepSurvey.jsx'));
const AdminBusinessManagement = lazy(() => import('./pages/admin/AdminBusinessManagement'));
const BusinessScan = lazy(() => import('./pages/business/BusinessScan'));
const BusinessDashboard = lazy(() => import('./pages/business/BusinessDashboard'));
const BusinessProfile = lazy(() => import('./pages/business/BusinessProfile'));
const BusinessVoucherForm = lazy(() => import('./pages/business/BusinessVoucherForm'));
const MerchantPublicProfile = lazy(() => import('./pages/MerchantPublicProfile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ResetPasswordToken = lazy(() => import('./pages/ResetPasswordToken'));
const NotFound = lazy(() => import('./pages/NotFound'));

import { AnimationProvider } from './components/animations/AnimationContext';
import PageTransition from './components/animations/PageTransition';

function RouteChangeHandler() {
  const location = useLocation();
  const isFirstLoad = useRef(true);
  const isMerchantPage = location.pathname.startsWith('/shop/merchant/');
  usePageMeta({
    ...getRouteMeta(location.pathname, location.search),
    skip: isMerchantPage,
  });

  useEffect(() => {
    toast.dismiss();
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
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

        <div className="min-w-0 max-w-full overflow-x-hidden">
        <RouteErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
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

            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/merchant/:id" element={<MerchantPublicProfile />} />

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
              path="/survey-complete"
              element={
                <ProtectedRoute requireProfileComplete={true}>
                  <SurveyComplete />
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

            <Route
             path="/admin/edit-sep-survey/:id"
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

            <Route
              path="/business/profile"
              element={
                <BusinessProtectedRoute>
                  <BusinessProfile />
                </BusinessProtectedRoute>
              }
            />

            <Route
              path="/business/vouchers/new"
              element={
                <BusinessProtectedRoute>
                  <BusinessVoucherForm />
                </BusinessProtectedRoute>
              }
            />

            <Route
              path="/business/vouchers/:id/edit"
              element={
                <BusinessProtectedRoute>
                  <BusinessVoucherForm />
                </BusinessProtectedRoute>
              }
            />

            <Route path="/business/login" element={<Navigate to="/login" replace />} />

            <Route path="*" element={<NotFound />} />
          </Route>
          
          <Route
            path="/additional-profile"
            element={
              <ProtectedRoute>
                <CompleteAdditionalProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
        </RouteErrorBoundary>

        <Footer />
        </div>
        <BottomNavigation />
      </Router>
    </AnimationProvider>
    </>
  );
}

export default App;