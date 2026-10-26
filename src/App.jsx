import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";

// Layout & Components
import HomeNav from './components/homepage/HomeNav';
import BottomNavigation from './components/layout/BottomNavigation';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import OnboardingGate from './components/layout/OnboardingGate';
import AdminRoute from './components/layout/AdminRoute';
import ProfileCompletionGuard from './components/layout/ProfileCompletionGuard';
import BusinessProtectedRoute from './pages/business/BusinessProtectedRoutes';
import MerchantLayout from './components/business/MerchantLayout';
import ScrollToTop from './components/layout/ScrollToTop';
import BusinessAccessGuard from './components/layout/BusinessAccessGuard';
import RouteFallback from './components/ui/RouteFallback';
import { RouteErrorBoundary } from './components/layout/ErrorBoundary';
import usePageMeta from './hooks/usePageMeta';
import { getRouteMeta } from './utils/routeMeta';
import { rememberAcquisition } from './utils/acquisition';
import { rememberLandingVisit, rememberMailClick } from './utils/healthEvents';
import { identifyClarity, installClarity } from './utils/clarity';
import { useAuth } from './context/AuthContext';
import { isProfileOnboardingLocked } from './utils/onboardingGate';

const Homepage = lazy(() => import('./pages/public/Homepage'));
const ForBusiness = lazy(() => import('./pages/public/ForBusiness.jsx'));
const FAQs = lazy(() => import('./pages/public/FAQs.jsx'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const Login = lazy(() => import('./pages/auth/Login'));
const LoginSuccess = lazy(() => import('./pages/auth/LoginSuccess'));
const Profile = lazy(() => import('./pages/user/Profile'));
const CompleteProfile = lazy(() => import('./pages/user/CompleteProfile'));
const CompleteBasicInfo = lazy(() => import('./pages/user/CompleteBasicInfo'));
const EmailVerificationPending = lazy(() => import('./pages/auth/EmailVerificationPending'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const StandaloneSurvey = lazy(() => import('./pages/survey/StandaloneSurvey.jsx'));
const StandaloneSurveys = lazy(() => import('./pages/survey/StandaloneSurveys.jsx'));
const SurveyComplete = lazy(() => import('./pages/survey/SurveyComplete.jsx'));
const SurveyHistory = lazy(() => import('./pages/user/SurveyHistory.jsx'));
const Shop = lazy(() => import('./pages/user/Shop.jsx'));
const Vouchers = lazy(() => import('./pages/user/Vouchers'));
const VoucherDetail = lazy(() => import('./pages/user/VoucherDetail'));
const EditProfile = lazy(() => import('./pages/user/EditProfile'));
const Terms = lazy(() => import('./pages/public/Terms'));
const PrivacyPolicy = lazy(() => import('./pages/public/LegalNotice'));
const CompleteAdditionalProfile = lazy(() => import('./pages/user/CompleteAdditionalProfile'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CreateSepSurvey = lazy(() => import('./pages/admin/sep-survey/CreateSepSurvey.jsx'));
const FifteenDaySurveyAdmin = lazy(() => import('./pages/admin/FifteenDaySurveyAdmin.jsx'));
const AdminBusinessManagement = lazy(() => import('./pages/admin/admin-business/AdminBusinessManagement.jsx'));
const AdminFaqManagement = lazy(() => import('./pages/admin/AdminFaqManagement.jsx'));
const AdminHealth = lazy(() => import('./pages/admin/admin-health/AdminHealth.jsx'));
const AdminBrandTracker = lazy(() => import('./pages/admin/AdminBrandTracker.jsx'));
const BusinessScan = lazy(() => import('./pages/business/BusinessScan'));
const BusinessDashboard = lazy(() => import('./pages/business/BusinessDashboard'));
const BrandLogin = lazy(() => import('./pages/brand/BrandLogin'));
const BrandSignup = lazy(() => import('./pages/brand/BrandSignup'));
const BrandForgotPassword = lazy(() => import('./pages/brand/BrandForgotPassword'));
const BrandResetPassword = lazy(() => import('./pages/brand/BrandResetPassword'));
const BrandAccount = lazy(() => import('./pages/brand/BrandAccount'));
const BrandDashboard = lazy(() => import('./pages/brand/BrandDashboard'));
const BrandProtectedRoute = lazy(() => import('./pages/brand/BrandProtectedRoute'));
const BusinessProfile = lazy(() => import('./pages/business/BusinessProfile'));
const BusinessVouchers = lazy(() => import('./pages/business/BusinessVouchers'));
const MerchantPublicProfile = lazy(() => import('./pages/public/MerchantPublicProfile'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ResetPasswordToken = lazy(() => import('./pages/auth/ResetPasswordToken'));
const Unsubscribe = lazy(() => import('./pages/user/Unsubscribe'));
const NotFound = lazy(() => import('./pages/public/NotFound'));

import { AnimationProvider } from './components/animations/AnimationContext';
import PageTransition from './components/animations/PageTransition';

function AppChrome({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isHome = pathname === '/';
  const isProfile = pathname === '/profile';
  const isShop = pathname === '/shop';
  const isSurveys = pathname === '/standalone-surveys';
  const isSurveyTake = pathname.startsWith('/standalone-survey/');
  const isSurveyComplete = pathname === '/survey-complete';
  const isBusiness = pathname.startsWith('/business');
  const isBrand = pathname.startsWith('/brand');
  const isProfileCompletion =
    pathname === '/complete-basic-info' ||
    pathname === '/complete-profile' ||
    pathname === '/additional-profile' ||
    pathname === '/refresh-profile' ||
    pathname === '/refresh-additional-profile';
  const isOnboarding =
    isProfileCompletion ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/email-verification';
  const hideNav =
    isProfileCompletion ||
    isProfileOnboardingLocked(user) ||
    isSurveyTake;
  const overlayNav =
    isHome ||
    isProfile ||
    isShop ||
    isSurveys ||
    isSurveyComplete ||
    isOnboarding;
  const navVariant = overlayNav ? 'overlay' : 'page';

  return (
    <>
      {!isBusiness && !isBrand && !hideNav && <HomeNav variant={navVariant} />}
      <BusinessAccessGuard />
      <div className={`min-w-0 max-w-full ${overlayNav ? 'overflow-x-clip' : 'overflow-x-hidden'}`}>
        {children}
        {!isHome && !isProfile && !isShop && !isSurveys && !isSurveyTake && !isSurveyComplete && !isBusiness && !isBrand && !isOnboarding && <Footer />}
      </div>
    </>
  );
}

function RouteChangeHandler() {
  const location = useLocation();
  const { user } = useAuth();
  const isFirstLoad = useRef(true);
  const isMerchantPage = location.pathname.startsWith('/shop/merchant/');
  usePageMeta({
    ...getRouteMeta(location.pathname, location.search),
    skip: isMerchantPage,
  });

  useEffect(() => {
    installClarity();
    if (user?._id) identifyClarity(user._id);
  }, [user?._id]);

  useEffect(() => {
    rememberAcquisition(location.search);
    rememberMailClick(location.search);
    rememberLandingVisit(location.pathname);
    toast.dismiss();
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, location.search]);
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
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <RouteChangeHandler />
        <ScrollToTop />
        <AppChrome>
        <OnboardingGate />
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
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/" element={<Homepage />} />
            <Route path="/for-business" element={<ForBusiness />} />
           <Route path="/faqs" element={<FAQs />} />
           <Route path="/email-verification" element={<EmailVerificationPending />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
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

            <Route
              path="/refresh-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile mode="refresh" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/refresh-additional-profile"
              element={
                <ProtectedRoute>
                  <CompleteAdditionalProfile mode="refresh" />
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
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/15-day-survey"
              element={
                <AdminRoute permission="surveys">
                  <FifteenDaySurveyAdmin />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/create-sep-survey"
              element={
                <AdminRoute permission="surveys">
                  <CreateSepSurvey />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/edit-sep-survey/:surveyId"
              element={
                <AdminRoute permission="surveys">
                  <CreateSepSurvey />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/businesses"
              element={
                <AdminRoute permission="businesses">
                  <AdminBusinessManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/faqs"
              element={
                <AdminRoute permission="faqs">
                  <AdminFaqManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/health"
              element={
                <AdminRoute permission="analytics">
                  <AdminHealth />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/brands"
              element={
                <AdminRoute permission="analytics">
                  <AdminBrandTracker />
                </AdminRoute>
              }
            />

            {/* ==================== BRAND CLIENT ROUTES ==================== */}

            <Route path="/brand/login" element={<BrandLogin />} />
            <Route path="/brand/signup" element={<BrandSignup />} />
            <Route path="/brand/forgot-password" element={<BrandForgotPassword />} />
            <Route path="/brand/reset-password/:resetToken" element={<BrandResetPassword />} />
            <Route
              path="/brand/account"
              element={
                <BrandProtectedRoute>
                  <BrandAccount />
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/brand/dashboard"
              element={
                <BrandProtectedRoute>
                  <BrandDashboard />
                </BrandProtectedRoute>
              }
            />

            {/* ==================== BUSINESS ROUTES ==================== */}

            <Route
              path="/business/scan"
              element={
                <BusinessProtectedRoute>
                  <MerchantLayout>
                    <BusinessScan />
                  </MerchantLayout>
                </BusinessProtectedRoute>
              }
            />

            <Route
              path="/business/dashboard"
              element={
                <BusinessProtectedRoute>
                  <MerchantLayout>
                    <BusinessDashboard />
                  </MerchantLayout>
                </BusinessProtectedRoute>
              }
            />

            <Route
              path="/business/vouchers"
              element={
                <BusinessProtectedRoute>
                  <MerchantLayout>
                    <BusinessVouchers />
                  </MerchantLayout>
                </BusinessProtectedRoute>
              }
            />

            <Route
              path="/business/profile"
              element={
                <BusinessProtectedRoute>
                  <MerchantLayout>
                    <BusinessProfile />
                  </MerchantLayout>
                </BusinessProtectedRoute>
              }
            />

            <Route path="/business/vouchers/new" element={<Navigate to="/business/vouchers" replace />} />
            <Route path="/business/vouchers/:id/edit" element={<Navigate to="/business/vouchers" replace />} />

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

        </AppChrome>
        <BottomNavigation />
      </Router>
    </AnimationProvider>
    </>
  );
}

export default App;