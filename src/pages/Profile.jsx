import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Package, 
  History, 
  AlertCircle, 
  Settings, 
  Loader2,
  Award
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import Logout from "../components/Logout";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [firstLetter, setFirstLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  {user.role === "admin" && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full border border-purple-200">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-base text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Phone: {user.phone || "Not provided"}
                </p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {user.role === "admin" && (
                <button
                  onClick={handleAdminPanel}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors font-medium shadow-md"
                >
                  <Settings className="h-5 w-5" />
                  Admin Panel
                </button>
              )}
              <Logout />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Campaign Status */}
            <div className="bg-white rounded-3xl shadow-sm p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
                <Package className="h-6 w-6 text-blue-500" />
                Current Campaign Status
              </h2>

              <div className="min-h-[140px] flex flex-col justify-center">
                {user.activeCampaign?.status ? (
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-4 border ${getStatusColor(
                        user.activeCampaign.status
                      )}`}
                    >
                      {getActiveCampaignStatus()}
                    </div>
                    <p className="text-gray-600 mb-5 text-base">
                      {user.activeCampaign.status === "joined" && "Campaign joined! Waiting for sample dispatch..."}
                      {user.activeCampaign.status === "dispatched" && "Sample dispatched! Your product is on the way."}
                      {user.activeCampaign.status === "delivered" && "Sample delivered! You can now take the survey."}
                    </p>

                    {user.activeCampaign.status === "delivered" ? (
                      <Link
                        to={`/survey/${user.activeCampaign.campaign}`}
                        className="inline-block bg-green-500 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-green-600 transition-colors shadow-lg"
                      >
                        Take Survey & Earn Credits
                      </Link>
                    ) : (
                      <p className="text-sm text-gray-500 mt-3">
                        Survey will be available when status changes to "Delivered"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-5 text-base font-medium">No active campaign</p>
                    <Link
                      to="/campaigns"
                      className="bg-blue-500 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-blue-600 transition-colors shadow-lg"
                    >
                      Browse Campaigns
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Credits Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-lg p-10 text-white">
              <div className="text-center">
                <div className="text-8xl font-bold mb-3">{user.credits || 0}</div>
                <h2 className="text-3xl font-bold mb-2">Credits</h2>
                <p className="text-blue-100 text-lg">Complete surveys to earn more credits</p>
              </div>
            </div>

            {/* Quick Actions – Now with Survey History */}
            <div className="bg-white rounded-3xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  to="/campaigns"
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <Package className="h-10 w-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-semibold text-gray-900">Browse Campaigns</span>
                </Link>

                <Link
                  to="/campaign-history"
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <History className="h-10 w-10 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-semibold text-gray-900">Campaign History</span>
                </Link>

                <Link
                  to="/standalone-surveys"
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <Award className="h-10 w-10 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-semibold text-gray-900">Standalone Surveys</span>
                </Link>

                {/* NEW: Survey History Button */}
                <Link
                  to="/survey-history"
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <History className="h-10 w-10 text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-base font-semibold text-gray-900">Survey History</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm p-8 sticky top-8 pb-12 lg:pb-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
                <Bell className="h-6 w-6 text-blue-500" />
                Notifications
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-blue-300 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-1">Welcome to eRuchi!</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-sm text-gray-700">Start exploring campaigns and earn credits.</p>
                </div>

                {user.activeCampaign?.status === "delivered" && (
                  <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-1">Sample Delivered!</h3>
                    <p className="text-sm text-gray-600 mb-2">Today</p>
                    <p className="text-sm text-gray-700">Your sample has been delivered. Complete the survey to earn credits!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;