import React, { useEffect, useState } from "react";
import { businessAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { ScanLine } from "lucide-react";

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

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchVoucherOffers();
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
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Business Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/business/scan')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              <ScanLine size={16} />
              Scan Voucher
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Total Scans</p>
            <p className="text-3xl font-bold">{stats.totalScans}</p>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Successful Scans</p>
            <p className="text-3xl font-bold">{stats.successfulScans}</p>
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
                      className="p-4 border-b last:border-b-0 flex items-center justify-between"
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
              {vouchersLoading ? (
                <div className="p-4 text-gray-400 text-sm">Loading...</div>
              ) : vouchers.length === 0 ? (
                <div className="p-4 text-gray-500">No voucher offers yet.</div>
              ) : (
                <div>
                  {vouchers.map((offer) => (
                    <div key={offer._id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{offer.title}</p>
                        <p className="text-sm text-gray-500">
                          {offer.discountType === 'percentage' ? `${offer.discountValue}% off` : `Rs. ${offer.discountValue} off`}
                          {' · '}{offer.creditsRequired} credits · {offer.expiryDays}d expiry
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        offer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {offer.status}
                      </span>
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