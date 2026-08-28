import React, { useEffect, useState } from "react";
import { businessAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { ScanLine, Upload, Plus, Pencil, Store } from "lucide-react";

export default function BusinessDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    successfulScans: 0,
    recentScans: [],
  });

  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scans");
  const [profile, setProfile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchVoucherOffers();
    fetchProfile();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await businessAPI.getDashboard();

      setStats({
        totalScans: data.data.totalScans || 0,
        successfulScans: data.data.successfulScans || 0,
        recentScans: data.data.recentScans || [],
      });
    } catch (error) {
      console.error("Failed to load dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherOffers = async () => {
    try {
      const { data } = await businessAPI.getVoucherOffers();
      setVouchers(data.data || []);
    } catch (error) {
      console.error('Failed to load voucher offers', error);
    } finally {
      setVouchersLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await businessAPI.getProfile();
      setProfile(data.data || null);
    } catch (error) {
      console.error('Failed to load business profile', error);
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    try {
      setLogoUploading(true);
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await businessAPI.uploadLogo(formData);
      setProfile(data.data);
    } catch (error) {
      console.error('Failed to upload logo', error);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await businessAPI.logout();
      localStorage.removeItem('is_business');
      localStorage.removeItem('business_name');
      window.dispatchEvent(new Event('authChange'));
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 pb-28">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                {profile?.logo ? (
                  <img src={profile.logo} alt="Business logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-gray-300 text-[10px]">Logo</span>
                )}
              </div>
              <label
                htmlFor="business-logo-upload"
                className="absolute -bottom-1 -right-1 p-1 bg-white border border-gray-200 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                title="Upload logo"
              >
                <Upload className="h-3 w-3 text-gray-600" />
              </label>
              <input
                id="business-logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={logoUploading}
                onChange={(e) => handleLogoUpload(e.target.files?.[0])}
              />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold leading-tight min-w-0">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => navigate('/business/profile')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
            >
              <Store size={16} />
              Profile
            </button>
            <button
              onClick={() => navigate('/business/scan')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              <ScanLine size={16} />
              Scan Voucher
            </button>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 rounded-lg bg-black text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Total Scans</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats.totalScans}</p>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Successful Scans</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats.successfulScans}</p>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("scans")}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "scans"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Recent Scans
            </button>
            <button
              onClick={() => setActiveTab("offers")}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "offers"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Voucher Offers
            </button>
          </div>

          {activeTab === "scans" && (
            <>
              {stats.recentScans.length === 0 ? (
                <div className="p-4 text-gray-500">No scan activity yet.</div>
              ) : (
                <div>
                  {stats.recentScans.map((scan, index) => (
                    <div
                      key={index}
                      className="p-4 border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium">{scan.outcome || "Unknown"}</p>
                        <p className="text-sm text-gray-500">
                          {scan.attemptedAt
                            ? new Date(scan.attemptedAt).toLocaleString()
                            : "-"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          scan.outcome === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {scan.outcome}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "offers" && (
            <>
              <div className="p-4 border-b flex justify-end">
                <button
                  onClick={() => navigate('/business/vouchers/new')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700"
                >
                  <Plus size={16} />
                  Add voucher
                </button>
              </div>
              {vouchersLoading ? (
                <div className="p-4 text-gray-400 text-sm">Loading...</div>
              ) : vouchers.length === 0 ? (
                <div className="p-4 text-gray-500">No voucher offers yet. Add one to show it in the shop.</div>
              ) : (
                <div>
                  {vouchers.map((offer) => (
                    <div key={offer._id} className="p-4 border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 break-words">{offer.title}</p>
                        <p className="text-sm text-gray-500">
                          {offer.discountType === 'percentage' ? `${offer.discountValue}% off`
                            : offer.discountType === 'free_item' ? (offer.discountValue ? `Free ${offer.discountValue}` : 'Free item')
                            : offer.discountType === 'value_combo' ? 'Value combo'
                            : `Rs. ${offer.discountValue} off`}
                          {' · '}{offer.creditsRequired} credits · {offer.expiryDays}d expiry
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          offer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {offer.status}
                        </span>
                        <button
                          onClick={() => navigate(`/business/vouchers/${offer._id}/edit`)}
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                          title="Edit voucher"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}