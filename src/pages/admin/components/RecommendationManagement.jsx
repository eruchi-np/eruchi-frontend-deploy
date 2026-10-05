import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../../services/api";
import { municipalityData } from "../../../utils/municipalityData";

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const MAX_OFFERS = 6;

const EMPTY_FORM = {
  name: "",
  active: true,
  offerIds: [],
  ageMin: "",
  ageMax: "",
  genders: [],
  municipalities: [],
};

const offerIdOf = (offer) => String(offer?._id || offer || "");

const filterSummary = (filters = {}) => {
  const bits = [];
  if (filters.ageMin != null || filters.ageMax != null) {
    if (filters.ageMin != null && filters.ageMax != null) bits.push(`Ages ${filters.ageMin}–${filters.ageMax}`);
    else if (filters.ageMin != null) bits.push(`Age ${filters.ageMin}+`);
    else bits.push(`Up to age ${filters.ageMax}`);
  }
  if (filters.genders?.length) bits.push(filters.genders.join(", "));
  if (filters.municipalities?.length) {
    const names = filters.municipalities;
    bits.push(names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", "));
  }
  return bits.length ? bits.join(" · ") : "Everyone";
};

const RecommendationManagement = ({ NAVY }) => {
  const [rows, setRows] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [offerQuery, setOfferQuery] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [recommendationRes, offerLists] = await Promise.all([
        adminAPI.getVoucherRecommendations({ skipErrorToast: true }),
        loadOffers(),
      ]);
      setRows(recommendationRes.data?.data || []);
      setOffers(offerLists);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredOffers = useMemo(() => {
    const query = offerQuery.trim().toLowerCase();
    if (!query) return offers;
    return offers.filter((offer) => {
      const business = offer.business?.brandName || offer.business?.name || "";
      return `${offer.title || ""} ${business}`.toLowerCase().includes(query);
    });
  }, [offers, offerQuery]);

  const placeMatches = useMemo(() => {
    const query = placeQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    return municipalityData
      .filter((place) => place.name.toLowerCase().includes(query))
      .filter((place) => !form.municipalities.includes(place.name))
      .slice(0, 8);
  }, [placeQuery, form.municipalities]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOfferQuery("");
    setPlaceQuery("");
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id);
    setForm({
      name: row.name || "",
      active: row.active !== false,
      offerIds: (row.offers || []).map(offerIdOf).filter(Boolean),
      ageMin: row.filters?.ageMin ?? "",
      ageMax: row.filters?.ageMax ?? "",
      genders: row.filters?.genders || [],
      municipalities: row.filters?.municipalities || [],
    });
    setOfferQuery("");
    setPlaceQuery("");
    setShowForm(true);
  };

  const toggleOffer = (id) => {
    setForm((current) => {
      if (current.offerIds.includes(id)) {
        return { ...current, offerIds: current.offerIds.filter((item) => item !== id) };
      }
      if (current.offerIds.length >= MAX_OFFERS) return current;
      return { ...current, offerIds: [...current.offerIds, id] };
    });
  };

  const toggleGender = (gender) => {
    setForm((current) => ({
      ...current,
      genders: current.genders.includes(gender)
        ? current.genders.filter((item) => item !== gender)
        : [...current.genders, gender],
    }));
  };

  const save = async () => {
    const ageMin = form.ageMin === "" ? null : Number(form.ageMin);
    const ageMax = form.ageMax === "" ? null : Number(form.ageMax);
    if (form.ageMin !== "" && !Number.isInteger(ageMin)) {
      toast.error("Minimum age must be a whole number");
      return;
    }
    if (form.ageMax !== "" && !Number.isInteger(ageMax)) {
      toast.error("Maximum age must be a whole number");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      active: form.active,
      offers: form.offerIds,
      filters: {
        ageMin,
        ageMax,
        genders: form.genders,
        municipalities: form.municipalities,
      },
    };
    try {
      if (editingId) {
        await adminAPI.updateVoucherRecommendation(editingId, payload);
        toast.success("Recommendation updated");
      } else {
        await adminAPI.createVoucherRecommendation(payload);
        toast.success("Recommendation created");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save recommendation");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete “${row.name}”?`)) return;
    try {
      await adminAPI.deleteVoucherRecommendation(row._id);
      toast.success("Recommendation deleted");
      if (editingId === row._id) setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete recommendation");
    }
  };

  if (loading && rows.length === 0 && !showForm) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: NAVY }} />
        Loading recommendations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Voucher recommendations</h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Each recommendation holds up to 6 vouchers and optional age, gender, and location filters.
            People who match see up to 4 of those vouchers at the top of the shop, and 2 of them after a survey. The list changes on their next visit after Tuesday, and a purchase replaces that spot.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: NAVY }}
        >
          <Plus className="h-4 w-4" /> Create recommendation
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit recommendation" : "New recommendation"}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              maxLength={80}
              placeholder="Young women in Kathmandu"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
            Active
          </label>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-medium text-gray-600">Vouchers ({form.offerIds.length}/{MAX_OFFERS})</p>
              <input
                value={offerQuery}
                onChange={(event) => setOfferQuery(event.target.value)}
                placeholder="Search vouchers"
                className="w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
              {filteredOffers.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500">No vouchers match.</p>
              ) : (
                filteredOffers.map((offer) => {
                  const id = offerIdOf(offer);
                  const selected = form.offerIds.includes(id);
                  const business = offer.business?.brandName || offer.business?.name || "Merchant";
                  const locked = !selected && form.offerIds.length >= MAX_OFFERS;
                  return (
                    <label key={id} className={`flex items-start gap-3 px-3 py-2 text-sm ${locked ? "opacity-50" : ""}`}>
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected}
                        disabled={locked}
                        onChange={() => toggleOffer(id)}
                      />
                      <span>
                        <span className="font-medium text-gray-900">{offer.title}</span>
                        <span className="text-gray-500"> · {business} · {offer.creditsRequired || 0} credits</span>
                        {offer.status === "inactive" ? (
                          <span className="ml-2 text-xs text-amber-700">Inactive</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Minimum age</span>
              <input
                type="number"
                min="13"
                max="120"
                value={form.ageMin}
                onChange={(event) => setForm((current) => ({ ...current, ageMin: event.target.value }))}
                placeholder="Any"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Maximum age</span>
              <input
                type="number"
                min="13"
                max="120"
                value={form.ageMax}
                onChange={(event) => setForm((current) => ({ ...current, ageMax: event.target.value }))}
                placeholder="Any"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </label>
          </div>
          <p className="text-xs text-gray-400 -mt-3">Leave age blank to include every age. Someone without a birthday only matches when age is blank.</p>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Gender</p>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((gender) => {
                const selected = form.genders.includes(gender);
                return (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => toggleGender(gender)}
                    className="px-3 py-1.5 rounded-full text-sm border"
                    style={selected
                      ? { backgroundColor: NAVY, color: "white", borderColor: NAVY }
                      : { backgroundColor: "white", color: "#374151", borderColor: "#e5e7eb" }}
                  >
                    {gender}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400">Leave every gender off to include all genders.</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Location</p>
            <input
              value={placeQuery}
              onChange={(event) => setPlaceQuery(event.target.value)}
              placeholder="Search municipality"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            {placeMatches.length > 0 && (
              <div className="mt-1 rounded-lg border border-gray-200 bg-white shadow-sm">
                {placeMatches.map((place) => (
                  <button
                    key={place.name}
                    type="button"
                    onClick={() => {
                      setForm((current) => ({
                        ...current,
                        municipalities: [...current.municipalities, place.name],
                      }));
                      setPlaceQuery("");
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    {place.name}
                    <span className="ml-2 text-xs text-gray-500">{place.type}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {form.municipalities.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setForm((current) => ({
                    ...current,
                    municipalities: current.municipalities.filter((item) => item !== name),
                  }))}
                  className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  {name} ×
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">Leave location empty to include every place.</p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: NAVY }}
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Create recommendation"}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
          <Sparkles className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          No recommendations yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row._id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between gap-4">
              <button type="button" onClick={() => openEdit(row)} className="text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{row.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${row.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {row.active ? "Active" : "Off"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{filterSummary(row.filters)}</p>
                <p className="mt-2 text-sm text-gray-700">
                  {(row.offers || []).map((offer) => offer.title).filter(Boolean).join(" · ") || "No vouchers"}
                </p>
              </button>
              <button
                type="button"
                onClick={() => remove(row)}
                className="text-gray-400 hover:text-red-600 shrink-0"
                aria-label={`Delete ${row.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

async function loadOffers() {
  const all = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 20) {
    const res = await adminAPI.getVoucherOffers({ page, limit: 100, skipErrorToast: true });
    all.push(...(res.data?.data || []));
    totalPages = res.data?.pagination?.totalPages || 1;
    page += 1;
  }
  return all;
}

export default RecommendationManagement;
