import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, userAPI } from '../../services/api';
import {
  ArrowLeft, Plus, Trash2, Pencil, ChevronUp, ChevronDown,
  Eye, EyeOff, HelpCircle, X, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAVY = '#1B2A4A';

const EMPTY_FORM = {
  category: '',
  question: '',
  answer: '',
  isPublished: true,
};

const groupFaqs = (faqs) => {
  const map = new Map();
  for (const faq of faqs) {
    const key = faq.category || 'Uncategorized';
    if (!map.has(key)) {
      map.set(key, {
        category: key,
        categoryOrder: faq.categoryOrder ?? 0,
        faqs: [],
      });
    }
    map.get(key).faqs.push(faq);
  }
  return [...map.values()]
    .sort((a, b) => a.categoryOrder - b.categoryOrder || a.category.localeCompare(b.category))
    .map((group) => ({
      ...group,
      faqs: [...group.faqs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }));
};

export default function AdminFaqManagement() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  const categories = useMemo(
    () => [...new Set(faqs.map((faq) => faq.category).filter(Boolean))],
    [faqs]
  );
  const grouped = useMemo(() => groupFaqs(faqs), [faqs]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const userResponse = await userAPI.getProfile({ skipErrorToast: true });
        const userData = userResponse.data.data.user;
        if (userData.role !== 'admin') {
          navigate('/profile');
          return;
        }
        await fetchFaqs();
      } catch (err) {
        console.error('Error checking admin access:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/profile');
        } else {
          setError('Failed to load FAQs');
        }
      } finally {
        setLoading(false);
      }
    };
    checkAdminAccess();
  }, [navigate]);

  const fetchFaqs = async () => {
    const response = await adminAPI.getFaqs({ skipErrorToast: true });
    setFaqs(response.data.data || []);
  };

  const openCreateModal = () => {
    setEditingFaq(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setForm({
      category: faq.category || '',
      question: faq.question || '',
      answer: faq.answer || '',
      isPublished: faq.isPublished !== false,
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingFaq(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const category = form.category.trim();
    const question = form.question.trim();
    const answer = form.answer.trim();
    if (!category || !question || !answer) {
      setFormError('Category, question, and answer are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = { category, question, answer, isPublished: form.isPublished };
      if (editingFaq) {
        await adminAPI.updateFaq(editingFaq._id, payload, { skipErrorToast: true });
        toast.success('FAQ updated');
      } else {
        await adminAPI.createFaq(payload, { skipErrorToast: true });
        toast.success('FAQ created');
      }
      setShowModal(false);
      setEditingFaq(null);
      setForm(EMPTY_FORM);
      await fetchFaqs();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (faq) => {
    const confirmed = window.confirm(`Delete "${faq.question}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(faq._id);
    try {
      await adminAPI.deleteFaq(faq._id, { skipErrorToast: true });
      toast.success('FAQ deleted');
      await fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete FAQ');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublished = async (faq) => {
    try {
      await adminAPI.updateFaq(
        faq._id,
        { isPublished: !faq.isPublished },
        { skipErrorToast: true }
      );
      toast.success(faq.isPublished ? 'FAQ hidden from the public page' : 'FAQ published');
      await fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update visibility');
    }
  };

  const handleReorder = async (faq, direction) => {
    setReorderingId(faq._id);
    try {
      await adminAPI.reorderFaq(faq._id, direction, { skipErrorToast: true });
      await fetchFaqs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reorder FAQ');
    } finally {
      setReorderingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-gray-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: NAVY }} />
          <p className="mt-4 text-gray-500 font-medium">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-12 max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-8">{error}</p>
          <button onClick={() => navigate('/admin')} className="text-white px-8 py-3 rounded-xl font-medium" style={{ backgroundColor: NAVY }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-28" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">FAQ Management</h1>
              <p className="text-sm text-gray-500">{faqs.length} question{faqs.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/faqs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              View page
            </a>
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: NAVY }}
            >
              <Plus className="h-4 w-4" />
              Add FAQ
            </button>
          </div>
        </div>

        {faqs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 shadow-sm">
            <HelpCircle className="h-8 w-8 mx-auto mb-3 text-gray-300" />
            <p>No FAQs yet. Add the first question to show it on the public FAQ page.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
              <section key={group.category} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">{group.category}</h2>
                  <span className="text-xs text-gray-500">{group.faqs.length} item{group.faqs.length === 1 ? '' : 's'}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {group.faqs.map((faq, index) => (
                    <div key={faq._id} className="px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              faq.isPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {faq.isPublished ? 'Published' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          onClick={() => handleReorder(faq, 'up')}
                          disabled={index === 0 || reorderingId === faq._id}
                          title="Move up"
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReorder(faq, 'down')}
                          disabled={index === group.faqs.length - 1 || reorderingId === faq._id}
                          title="Move down"
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublished(faq)}
                          title={faq.isPublished ? 'Hide from public page' : 'Publish'}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          {faq.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {faq.isPublished ? 'Hide' : 'Publish'}
                        </button>
                        <button
                          onClick={() => openEditModal(faq)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border"
                          style={{ borderColor: NAVY, color: NAVY }}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(faq)}
                          disabled={deletingId === faq._id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  list="faq-categories"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g. Getting Started"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-900"
                  maxLength={80}
                />
                <datalist id="faq-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  value={form.question}
                  onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                  placeholder="What is eRuchi?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-900"
                  maxLength={300}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
                  rows={7}
                  placeholder="Write the answer visitors should see."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-900 resize-y min-h-[140px]"
                  maxLength={5000}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Use {'{{SUPPORT_EMAIL}}'} to insert the current support email automatically.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Published on the public FAQ page
              </label>
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{formError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: NAVY }}
                >
                  {submitting ? 'Saving...' : editingFaq ? 'Save changes' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
