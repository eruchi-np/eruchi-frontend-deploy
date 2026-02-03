import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Package, 
  History, 
  AlertCircle, 
  Settings, 
  Loader2,
  Award,
  Trash2,
  Info,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import Logout from "../components/Logout";
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [firstLetter, setFirstLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCreditsInfoModal, setShowCreditsInfoModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await userAPI.getProfile();
        const userData = response?.data?.data?.user;

        if (!userData) {
          throw new Error("Invalid user data received");
        }

        setUser(userData);
        setFirstLetter(userData.firstName?.charAt(0)?.toUpperCase() || "U");
      } catch (err) {
        console.error("Error fetching profile:", err);

        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message || 
          "Failed to load profile. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const getActiveCampaignStatus = () => {
    if (!user?.activeCampaign?.status) return "No active campaign";

    const statusMap = {
      joined: "Campaign Joined",
      dispatched: "Sample Dispatched",
      delivered: "Sample Delivered",
    };
    return statusMap[user.activeCampaign.status] || user.activeCampaign.status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      joined: "bg-blue-50 text-blue-700 border-blue-200",
      dispatched: "bg-yellow-50 text-yellow-700 border-yellow-200",
      delivered: "bg-green-50 text-green-700 border-green-200",
    };
    return colorMap[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const handleAdminPanel = () => {
    navigate("/admin");
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // 1. Delete/anonymize account
      await userAPI.deleteAccount();
      toast.success("Your account has been permanently deleted.");

      // 2. Immediately log out via backend (clears cookie)
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );

      // 3. Set strong lock (blocks auth checks for 15 min)
      localStorage.setItem('logout_lock', Date.now().toString());

      // 4. Clear frontend state
      localStorage.clear();

      // 5. Hard redirect to HOME (no auth bounce)
      window.location.href = '/';

    } catch (err) {
      console.error("Delete account failed:", err);
      toast.error(
        err.response?.data?.message || 
        "Failed to delete account. Please try again or contact support."
      );
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Helper function to display user's full name
  const getDisplayName = () => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    
    if (lastName.toLowerCase() === "user") {
      return firstName;
    }
    
    return `${firstName} ${lastName}`.trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Loading Failed</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-100 font-medium transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* User Info Section */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {getDisplayName()}
                  </h1>
                  {user.role === "admin" && (
                    <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 text-xs sm:text-sm font-medium rounded-full border border-purple-200">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-gray-600 break-all">{user.email}</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Phone: {user.phone || "Not provided"}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {user.role === "admin" && (
                <button
                  onClick={handleAdminPanel}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full hover:bg-purple-700 transition-colors font-medium shadow-md text-sm sm:text-base"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  Admin Panel
                </button>
              )}
              <Logout />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Active Campaign Status */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                Current Campaign Status
              </h2>

              <div className="min-h-[140px] flex flex-col justify-center">
                {user.activeCampaign?.status ? (
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4 border ${getStatusColor(
                        user.activeCampaign.status
                      )}`}
                    >
                      {getActiveCampaignStatus()}
                    </div>
                    <p className="text-gray-600 mb-4 sm:mb-5 text-sm sm:text-base px-4">
                      {user.activeCampaign.status === "joined" && "Campaign joined! Waiting for sample dispatch..."}
                      {user.activeCampaign.status === "dispatched" && "Sample dispatched! Your product is on the way."}
                      {user.activeCampaign.status === "delivered" && "Sample delivered! You can now take the survey."}
                    </p>

                    {user.activeCampaign.status === "delivered" ? (
                      <Link
                        to={`/survey/${user.activeCampaign.campaign}`}
                        className="inline-block bg-green-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-green-600 transition-colors shadow-lg"
                      >
                        Take Survey & Earn Credits
                      </Link>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-500 mt-3 px-4">
                        Survey will be available when status changes to "Delivered"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-600 mb-4 sm:mb-5 text-sm sm:text-base font-medium">No active campaign</p>
                    <Link
                      to="/campaigns"
                      className="inline-block bg-blue-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-blue-600 transition-colors shadow-lg"
                    >
                      Browse Campaigns
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Credits Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 lg:p-10 text-white relative">
              <button
                onClick={() => setShowCreditsInfoModal(true)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Credits information"
              >
                <Info className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <div className="text-center">
                <div className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-2 sm:mb-3">{user.credits || 0}</div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Credits</h2>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Complete surveys to earn more credits</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Link
                  to="/campaigns"
                  className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 text-center">Browse Campaigns</span>
                </Link>

                <Link
                  to="/campaign-history"
                  className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <History className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 text-center">Campaign History</span>
                </Link>

                <Link
                  to="/standalone-surveys"
                  className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <Award className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 text-center">Surveys</span>
                </Link>

                <Link
                  to="/survey-history"
                  className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <History className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 text-center">Survey History</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Notifications */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8 lg:sticky lg:top-8">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                Notifications
              </h2>
              <div className="space-y-3 sm:space-y-4 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-blue-300 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Welcome to eRuchi!</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700">Start exploring campaigns and earn credits.</p>
                </div>

                {user.activeCampaign?.status === "delivered" && (
                  <div className="bg-green-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-1 text-sm sm:text-base">Sample Delivered!</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Today</p>
                    <p className="text-xs sm:text-sm text-gray-700">Your sample has been delivered. Complete the survey to earn credits!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

       {/* Danger Zone - Delete Account */}
        <div className="mt-8 sm:mt-12 mb-12 sm:mb-16 lg:mb-20">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8 border-2 border-red-100">
            <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Credits Info Modal */}
      {showCreditsInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 lg:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">eRuchi Credits</h2>
              </div>
              <button
                onClick={() => setShowCreditsInfoModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                <span className="font-semibold text-blue-600">eRuchi Credits</span> are our way of rewarding engaged users and increasing their chances of receiving premium samples.
              </p>
              
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                You earn Credits by accepting and reviewing samples and completing surveys. The more active you are, the more Credits you accumulate—boosting your priority in future sampling campaigns.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 font-medium">
                Pro Tip: Stay active and complete surveys promptly to maximize your Credits!
                </p>
              </div>

              <button
                onClick={() => setShowCreditsInfoModal(false)}
                className="w-full mt-6 py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 lg:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" />
              <span>Delete Your Account</span>
            </h2>

            <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
              This action is <strong>permanent and irreversible</strong>. 
              Your personal information will be anonymized, your credits and campaigns will be lost, 
              and you will lose access to your account forever.
            </p>

            <p className="text-red-600 font-medium mb-6 sm:mb-8 text-sm sm:text-base">
              Are you sure you want to delete your account?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Yes, Delete My Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;