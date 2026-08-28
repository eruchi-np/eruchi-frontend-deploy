import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { businessAPI } from '../../services/api';
import { BUSINESS_CATEGORIES, DAYS_OF_WEEK, inputCls } from './businessFormConstants';

const emptyForm = {
  name: '',
  brandName: '',
  phone: '',
  address: '',
  category: '',
  description: '',
  instagram: '',
  website: '',
  operatingDays: [],
  openingTime: '',
  closingTime: '',
};

export default function BusinessProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await businessAPI.getProfile();
        const biz = data.data;
        setProfile(biz);
        setForm({
          name: biz.name || '',
          brandName: biz.brandName || '',
          phone: biz.phone || '',
          address: biz.address || '',
          category: biz.category || '',
          description: biz.description || '',
          instagram: biz.instagram || '',
          website: biz.website || '',
          operatingDays: biz.operatingDays || [],
          openingTime: biz.operatingHours?.open || '',
          closingTime: biz.operatingHours?.close || '',
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter((d) => d !== day)
        : [...prev.operatingDays, day],
    }));
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    try {
      setLogoUploading(true);
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await businessAPI.uploadLogo(formData);
      setProfile(data.data);
      toast.success('Logo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await businessAPI.updateProfile({
        name: form.name,
        brandName: form.brandName,
        phone: form.phone,
        address: form.address,
        category: form.category,
        description: form.description,
        instagram: form.instagram,
        website: form.website,
        operatingDays: form.operatingDays,
        operatingHours: { open: form.openingTime, close: form.closingTime },
      });
      setProfile(data.data);
      localStorage.setItem('business_name', data.data.brandName || data.data.name);
      window.dispatchEvent(new Event('authChange'));
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate('/business/dashboard')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store profile</h1>
            <p className="text-sm text-gray-500 mt-1">This is what customers see on eRuchi.</p>
          </div>
          {profile?._id && (
            <button
              type="button"
              onClick={() => navigate(`/shop/merchant/${profile._id}`)}
              className="flex items-center gap-1 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              <ExternalLink size={14} /> Preview
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
              {profile?.logo ? (
                <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-300 text-xs">Logo</span>
              )}
            </div>
            <label
              htmlFor="profile-logo-upload"
              className="absolute -bottom-1 -right-1 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm cursor-pointer hover:bg-gray-50"
            >
              <Upload className="h-3.5 w-3.5 text-gray-600" />
            </label>
            <input
              id="profile-logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={logoUploading}
              onChange={(e) => handleLogoUpload(e.target.files?.[0])}
            />
          </div>
          <p className="text-xs text-gray-400">Tap the icon to upload a logo</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Business name *</label>
            <input required value={form.name} onChange={setField('name')} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Brand name</label>
            <input
              value={form.brandName}
              onChange={setField('brandName')}
              placeholder="Shown to customers"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Category</label>
            <select value={form.category} onChange={setField('category')} className={inputCls}>
              <option value="">Select category</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Short description ({form.description.length}/120)
            </label>
            <textarea
              maxLength={120}
              rows={3}
              value={form.description}
              onChange={setField('description')}
              placeholder="What should customers know?"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Address</label>
            <input value={form.address} onChange={setField('address')} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Phone</label>
            <input value={form.phone} onChange={setField('phone')} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Open days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const active = form.operatingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Opens</label>
              <input type="time" value={form.openingTime} onChange={setField('openingTime')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Closes</label>
              <input type="time" value={form.closingTime} onChange={setField('closingTime')} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Instagram</label>
            <input value={form.instagram} onChange={setField('instagram')} placeholder="@yourbrand" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Website</label>
            <input value={form.website} onChange={setField('website')} placeholder="https://" className={inputCls} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
