import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
// Layout & Components
import Navbar from './components/homepage/Navbar';
import BottomNavigation from './components/layout/BottomNavigation';
import ProtectedRoute from './components/layout/ProtectedRoute'; 
import ProfileCompletionGuard from './components/layout/ProfileCompletionGuard';

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
import EmailVerificationPending from './pages/EmailVerificationPending'; // NEW
import VerifyEmail from './pages/VerifyEmail'; // NEW

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateCampaign from './pages/admin/CreateCampaign';

// Optional: Public pages (terms, etc.)
import ResetPassword from './pages/ResetPassword';
import ResetPasswordToken from './pages/ResetPasswordToken';

function App() {
  return (
    <Router>
       <Toaster position="top-center" reverseOrder={false} />
        <Navbar />
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/success" element={<LoginSuccess />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPasswordToken />} />
          <Route path="/" element={<Homepage />} />
          <Route path="/for-business" element={<ForBusiness />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/email-verification" element={<EmailVerificationPending />} /> {/* NEW */}
          <Route path="/verify-email/:token" element={<VerifyEmail />} /> {/* NEW */}

          {/* ==================== PROFILE COMPLETION ROUTE ==================== */}
          {/* Only logged-in users can access this, but they CANNOT leave until done */}
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

          {/* ==================== PROTECTED ROUTES (Require Login + Profile Complete) ==================== */}
        
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireProfileComplete={true}>
                <Profile />
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

          {/* ==================== ADMIN ROUTES ==================== */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/create-campaign" element={<CreateCampaign />} />

          {/* 404 */}
          <Route path="*" element={<div className="text-center py-20 text-2xl">404 - Page Not Found</div>} />
        </Routes>
        <BottomNavigation />
    </Router>
  );
}

export default App;