import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Instagram, Globe, MapPin, Phone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { businessAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VoucherRedeemModal from '../components/widgets/VoucherRedeemModal';

const formatHours = (hours) => {
  if (!hours?.open && !hours?.close) return null;
  return [hours.open, hours.close].filter(Boolean).join(' – ');
};

const discountLabel = (offer) => {
  if (offer.discountType === 'percentage') return `${offer.discountValue}% off`;
  if (offer.discountType === 'free_item') return offer.discountValue ? `Free ${offer.discountValue}` : 'Free item';
  if (offer.discountType === 'value_combo') return 'Value combo';
  return `Rs. ${offer.discountValue} off`;
};

export default function MerchantPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await businessAPI.getPublicProfile(id);
        setBusiness(data.data.business);
        setOffers(data.data.offers || []);
        const token = localStorage.getItem('access_token');
        if (token) {
          try {
            const profileRes = await userAPI.getProfile({ skipAuthRedirect: true });
            setUserCredits(
              profileRes.data?.data?.user?.credits ??
                profileRes.data?.user?.credits ??
                0
            );
          } catch {
            setUserCredits(user?.credits || 0);
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Store not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleRedeem = (offer) => {
    if (!user) {
      toast.error('Please log in to redeem vouchers.');
      navigate('/login');
      return;
    }
    if (!user.isProfileComplete) {
      toast.error('Complete your profile to redeem vouchers.');
      return;
    }
    setSelectedOffer({
      ...offer,
      business,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-white p-6">
        <button onClick={() => navigate('/shop')} className="flex items-center gap-1 text-sm text-gray-500 mb-6">
          <ArrowLeft size={16} /> Back to shop
        </button>
        <p className="text-gray-600">This store is not available.</p>
      </div>
    );
  }

  const displayName = business.brandName || business.name;
  const hours = formatHours(business.operatingHours);

  return (
    <div className="min-h-screen bg-white pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-2xl mx-auto p-4">
        <button onClick={() => navigate('/shop')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} /> Shop
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
            {business.logo ? (
              <img src={business.logo} alt={displayName} className="w-full h-full object-contain" />
            ) : (
              <span className="text-3xl font-semibold text-gray-400">{displayName.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-gray-400">{business.category || 'Merchant'}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 break-words">{displayName}</h1>
          </div>
        </div>

        {business.description ? (
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
            {business.description}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 text-sm text-gray-600 mb-8">
          {business.address && (
            <p className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {business.address}</p>
          )}
          {business.phone && (
            <p className="flex items-center gap-2"><Phone size={16} className="text-gray-400" /> {business.phone}</p>
          )}
          {hours && (
            <p className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> {hours}</p>
          )}
          {business.operatingDays?.length > 0 && (
            <p className="text-xs text-gray-400 pl-6">{business.operatingDays.join(', ')}</p>
          )}
          {business.instagram && (
            <p className="flex items-center gap-2"><Instagram size={16} className="text-gray-400" /> {business.instagram}</p>
          )}
          {business.website && (
            <a href={business.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-900 break-all">
              <Globe size={16} className="text-gray-400" /> {business.website}
            </a>
          )}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">Offers</h2>
        {offers.length === 0 ? (
          <p className="text-sm text-gray-500">No offers available right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {offers.map((offer) => (
              <button
                key={offer._id}
                type="button"
                onClick={() => handleRedeem(offer)}
                className="text-left border border-gray-200 rounded-2xl p-4 hover:border-gray-400 transition-colors"
              >
                <p className="font-medium text-gray-900">{offer.title}</p>
                {offer.description && <p className="text-sm text-gray-500 mt-1">{offer.description}</p>}
                <p className="text-sm text-gray-600 mt-2">
                  {discountLabel(offer)} · {offer.creditsRequired} credits
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedOffer && (
        <VoucherRedeemModal
          offer={selectedOffer}
          userCredits={userCredits}
          onClose={() => setSelectedOffer(null)}
          onSuccess={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
}
