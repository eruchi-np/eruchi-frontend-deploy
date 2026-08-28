import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { businessAPI } from '../../services/api';
import { inputCls } from './businessFormConstants';

const EMPTY = {
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  approxValue: '',
  creditsRequired: '',
  expiryDays: '',
  perUserMonthlyLimit: '5',
  totalStock: '',
  validUntil: '',
  imageUrl: '',
  status: 'active',
};

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

export default function BusinessVoucherForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const { data } = await businessAPI.getVoucherOffers();
        const offer = (data.data || []).find((o) => o._id === id);
        if (!offer) {
          toast.error('Voucher not found');
          navigate('/business/dashboard');
          return;
        }
        setForm({
          title: offer.title || '',
          description: offer.description || '',
          discountType: offer.discountType || 'percentage',
          discountValue: offer.discountValue ?? '',
          approxValue: offer.approxValue ?? '',
          creditsRequired: offer.creditsRequired ?? '',
          expiryDays: offer.expiryDays ?? '',
          perUserMonthlyLimit: offer.perUserMonthlyLimit ?? '',
          totalStock: offer.totalStock ?? '',
          validUntil: toDateInput(offer.validUntil),
          imageUrl: offer.imageUrl || '',
          status: offer.status || 'active',
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load voucher');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.validUntil) {
      toast.error('A calendar deadline is required');
      return;
    }
    if (!isEdit && new Date(form.validUntil) <= new Date()) {
      toast.error('Deadline must be a future date');
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      discountType: form.discountType,
      discountValue:
        form.discountType === 'percentage' || form.discountType === 'flat'
          ? Number(form.discountValue)
          : form.discountType === 'free_item'
            ? form.discountValue || undefined
            : undefined,
      approxValue: form.approxValue !== '' ? Number(form.approxValue) : null,
      creditsRequired: Number(form.creditsRequired),
      expiryDays: Number(form.expiryDays),
      validUntil: new Date(form.validUntil).toISOString(),
      perUserMonthlyLimit: form.perUserMonthlyLimit !== '' ? Number(form.perUserMonthlyLimit) : null,
      totalStock: form.totalStock !== '' ? Number(form.totalStock) : null,
      imageUrl: form.imageUrl,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await businessAPI.updateVoucherOffer(id, payload);
        toast.success('Voucher updated');
      } else {
        await businessAPI.createVoucherOffer(payload);
        toast.success('Voucher created');
      }
      navigate('/business/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save voucher');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{isEdit ? 'Edit voucher' : 'New voucher'}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {isEdit ? 'Update this offer. Customers see it in the shop when it is active.' : 'Create an offer customers can redeem with credits.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Title *</label>
            <input required value={form.title} onChange={setField('title')} placeholder="e.g. 20% off mains" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Description</label>
            <input value={form.description} onChange={setField('description')} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Discount type *</label>
              <select value={form.discountType} onChange={setField('discountType')} className={inputCls}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (Rs.)</option>
                <option value="free_item">Free item</option>
                <option value="value_combo">Value combo</option>
              </select>
            </div>
            {form.discountType !== 'value_combo' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                  {form.discountType === 'free_item' ? 'Item name' : 'Value *'}
                </label>
                <input
                  type={form.discountType === 'free_item' ? 'text' : 'number'}
                  required={form.discountType !== 'free_item'}
                  min="0"
                  value={form.discountValue}
                  onChange={setField('discountValue')}
                  className={inputCls}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Approx. value (Rs.)</label>
            <input type="number" min="0" value={form.approxValue} onChange={setField('approxValue')} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Credits cost *</label>
              <input type="number" required min="0" value={form.creditsRequired} onChange={setField('creditsRequired')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Valid days after claim *</label>
              <input type="number" required min="1" value={form.expiryDays} onChange={setField('expiryDays')} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Offer ends *</label>
            <input type="date" required value={form.validUntil} onChange={setField('validUntil')} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Per user / month</label>
              <input type="number" min="1" value={form.perUserMonthlyLimit} onChange={setField('perUserMonthlyLimit')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Total stock</label>
              <input type="number" min="1" value={form.totalStock} onChange={setField('totalStock')} placeholder="Unlimited" className={inputCls} />
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Status</label>
              <select value={form.status} onChange={setField('status')} className={inputCls}>
                <option value="active">Active (visible in shop)</option>
                <option value="inactive">Inactive (hidden)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create voucher'}
          </button>
        </form>
      </div>
    </div>
  );
}
