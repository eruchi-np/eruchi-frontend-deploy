import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";

const TABS = ["Basic Info", "Demographics"];

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

// Mirror your backend enums — expand as needed from userValidationLists.js
const EDUCATION_LEVELS = [
  "No formal education",
  "Primary",
  "Lower Secondary",
  "Secondary",
  "Higher Secondary",
  "Bachelor's",
  "Master's",
  "PhD or above",
];

const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed", "Separated"];

const INCOME_SOURCES = [
  "Employment",
  "Self-employment",
  "Business",
  "Agriculture",
  "Remittance",
  "Pension",
  "Other",
];

const OCCUPATIONS = [
  "Student",
  "Government Employee",
  "Private Employee",
  "Self-employed",
  "Business Owner",
  "Farmer",
  "Homemaker",
  "Unemployed",
  "Other",
];

const LANGUAGES = ["Nepali", "Maithili", "Bhojpuri", "Tharu", "Tamang", "English", "Other"];

const NATIONALITIES = ["Nepali", "Indian", "Chinese", "Other"];

const HOUSEHOLD_DURABLES = [
  "Television",
  "Refrigerator",
  "Washing Machine",
  "Air Conditioner",
  "Car",
  "Motorcycle",
  "Computer / Laptop",
  "Internet Connection",
];

// ─── Reusable field components ────────────────────────────────────────────────

const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold tracking-[0.5px] text-[#6B7A8A] uppercase mb-1.5">
    {children}
  </label>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full border border-[#D8E8F5] rounded-xl px-4 py-2.5 text-sm text-[#0F1A14] bg-white outline-none focus:border-[#3399FF] transition-colors"
    style={{ fontFamily: "inherit" }}
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full border border-[#D8E8F5] rounded-xl px-4 py-2.5 text-sm text-[#0F1A14] bg-white outline-none focus:border-[#3399FF] transition-colors appearance-none"
    style={{ fontFamily: "inherit" }}
  >
    {children}
  </select>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white border border-[#EDF2F7] rounded-2xl p-6 mb-5">
    {title && (
      <h3 className="text-[13px] font-bold text-[#0F1A14] tracking-[0.3px] uppercase mb-4 pb-3 border-b border-[#EDF2F7]">
        {title}
      </h3>
    )}
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const EditProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  // Basic profile state
  const [basic, setBasic] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  // Demographics state
  const [demo, setDemo] = useState({
    nationality: "",
    firstLanguage: "",
    educationLevel: "",
    maritalStatus: "",
    occupation: "",
    mainIncomeSource: "",
    mainIncomeSourceEducation: "",
    householdDurables: [],
    address: { municipality: "", wardNumber: "" },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await userAPI.getProfile();
        const u = res?.data?.data?.user;
        if (!u) return;
        setBasic({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phone: u.phone || "",
          dateOfBirth: u.dateOfBirth
            ? new Date(u.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: u.gender || "",
        });
        setDemo({
          nationality: u.nationality || "",
          firstLanguage: u.firstLanguage || "",
          educationLevel: u.educationLevel || "",
          maritalStatus: u.maritalStatus || "",
          occupation: u.occupation || "",
          mainIncomeSource: u.mainIncomeSource || "",
          mainIncomeSourceEducation: u.mainIncomeSourceEducation || "",
          householdDurables: u.householdDurables || [],
          address: {
            municipality: u.address?.municipality || "",
            wardNumber: u.address?.wardNumber || "",
          },
        });
      } catch {
        showToast("error", "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveBasic = async () => {
    setSaving(true);
    try {
      await userAPI.updateBasicProfile({
        ...basic,
        dateOfBirth: basic.dateOfBirth || null,
        gender: basic.gender || null,
      });
      showToast("success", "Basic info updated successfully.");
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Failed to update basic info."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDemographics = async () => {
    setSaving(true);
    try {
      const payload = {
        ...demo,
        address:
          demo.address.municipality && demo.address.wardNumber
            ? {
                municipality: demo.address.municipality,
                wardNumber: Number(demo.address.wardNumber),
              }
            : undefined,
      };
      await userAPI.updateDemographics(payload);
      showToast("success", "Demographics updated successfully.");
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Failed to update demographics."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleDurable = (item) => {
    setDemo((prev) => ({
      ...prev,
      householdDurables: prev.householdDurables.includes(item)
        ? prev.householdDurables.filter((d) => d !== item)
        : [...prev.householdDurables, item],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="w-10 h-10 mx-auto mb-4 text-[#3399FF]"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p className="text-[#6B7A8A] text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F4F7FB] text-[#0F1A14] text-sm"
      style={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}
    >
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-[#0F1A14] text-white"
              : "bg-[#E8472A] text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#EDF2F7] py-6 px-6">
        <div className="max-w-[860px] mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full border border-[#D8E8F5] flex items-center justify-center hover:bg-[#F4F7FB] transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#0F1A14]" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-[#0F1A14] tracking-tight">
              Edit Profile
            </h1>
            <p className="text-[12px] text-[#6B7A8A]">
              Update your personal information
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#EDF2F7]">
        <div className="max-w-[860px] mx-auto px-6 flex gap-1">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`py-3.5 px-4 text-xs font-semibold tracking-[0.4px] border-b-2 transition-colors ${
                activeTab === i
                  ? "border-[#3399FF] text-[#3399FF]"
                  : "border-transparent text-[#6B7A8A] hover:text-[#0F1A14]"
              }`}
              style={{ fontFamily: "inherit" }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[860px] mx-auto px-4 lg:px-6 pt-7 pb-24">
        {/* ── TAB 0: Basic Info ── */}
        {activeTab === 0 && (
          <>
            <SectionCard title="Personal Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={basic.firstName}
                    onChange={(e) =>
                      setBasic((p) => ({ ...p, firstName: e.target.value }))
                    }
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={basic.lastName}
                    onChange={(e) =>
                      setBasic((p) => ({ ...p, lastName: e.target.value }))
                    }
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={basic.phone}
                    onChange={(e) =>
                      setBasic((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+977 98XXXXXXXX"
                    type="tel"
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    value={basic.dateOfBirth}
                    onChange={(e) =>
                      setBasic((p) => ({ ...p, dateOfBirth: e.target.value }))
                    }
                    type="date"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Gender</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g}
                        onClick={() =>
                          setBasic((p) => ({
                            ...p,
                            gender: p.gender === g ? "" : g,
                          }))
                        }
                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                          basic.gender === g
                            ? "bg-[#0F1A14] text-white border-[#0F1A14]"
                            : "bg-white text-[#6B7A8A] border-[#D8E8F5] hover:border-[#0F1A14] hover:text-[#0F1A14]"
                        }`}
                        style={{ fontFamily: "inherit" }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="flex justify-end">
              <button
                onClick={handleSaveBasic}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-full text-xs font-semibold tracking-[0.4px] bg-[#0F1A14] text-white border-none cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                style={{ fontFamily: "inherit" }}
              >
                {saving && (
                  <Loader2
                    className="w-3.5 h-3.5"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
                SAVE CHANGES
              </button>
            </div>
          </>
        )}

        {/* ── TAB 1: Demographics ── */}
        {activeTab === 1 && (
          <>
            <SectionCard title="Background">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nationality</Label>
                  <Select
                    value={demo.nationality}
                    onChange={(e) =>
                      setDemo((p) => ({ ...p, nationality: e.target.value }))
                    }
                  >
                    <option value="">Select nationality</option>
                    {NATIONALITIES.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>First Language</Label>
                  <Select
                    value={demo.firstLanguage}
                    onChange={(e) =>
                      setDemo((p) => ({
                        ...p,
                        firstLanguage: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select language</option>
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Education Level</Label>
                  <Select
                    value={demo.educationLevel}
                    onChange={(e) =>
                      setDemo((p) => ({
                        ...p,
                        educationLevel: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select level</option>
                    {EDUCATION_LEVELS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <Select
                    value={demo.maritalStatus}
                    onChange={(e) =>
                      setDemo((p) => ({
                        ...p,
                        maritalStatus: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select status</option>
                    {MARITAL_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Occupation</Label>
                  <Select
                    value={demo.occupation}
                    onChange={(e) =>
                      setDemo((p) => ({ ...p, occupation: e.target.value }))
                    }
                  >
                    <option value="">Select occupation</option>
                    {OCCUPATIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Main Income Source</Label>
                  <Select
                    value={demo.mainIncomeSource}
                    onChange={(e) =>
                      setDemo((p) => ({
                        ...p,
                        mainIncomeSource: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select source</option>
                    {INCOME_SOURCES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                {demo.mainIncomeSource === "Employment" && (
                  <div className="sm:col-span-2">
                    <Label>Education Level of Income Source</Label>
                    <Select
                      value={demo.mainIncomeSourceEducation}
                      onChange={(e) =>
                        setDemo((p) => ({
                          ...p,
                          mainIncomeSourceEducation: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select level</option>
                      {EDUCATION_LEVELS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Address">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Municipality</Label>
                  <Input
                    value={demo.address.municipality}
                    onChange={(e) =>
                      setDemo((p) => ({
                        ...p,
                        address: { ...p.address, municipality: e.target.value },
                      }))
                    }
                    placeholder="e.g. Kathmandu Metropolitan City"
                  />
                </div>
                <div>
                  <Label>Ward Number</Label>
                  <Input
                    value={demo.address.wardNumber}
                    onChange={(e) =>
                      setDemo((p) => ({
                        ...p,
                        address: { ...p.address, wardNumber: e.target.value },
                      }))
                    }
                    placeholder="e.g. 4"
                    type="number"
                    min="1"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Household Durables">
              <p className="text-[12px] text-[#6B7A8A] mb-3">
                Select all items your household owns.
              </p>
              <div className="flex flex-wrap gap-2">
                {HOUSEHOLD_DURABLES.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleDurable(item)}
                    className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                      demo.householdDurables.includes(item)
                        ? "bg-[#0F1A14] text-white border-[#0F1A14]"
                        : "bg-white text-[#6B7A8A] border-[#D8E8F5] hover:border-[#0F1A14] hover:text-[#0F1A14]"
                    }`}
                    style={{ fontFamily: "inherit" }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </SectionCard>

            <div className="flex justify-end">
              <button
                onClick={handleSaveDemographics}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-full text-xs font-semibold tracking-[0.4px] bg-[#0F1A14] text-white border-none cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                style={{ fontFamily: "inherit" }}
              >
                {saving && (
                  <Loader2
                    className="w-3.5 h-3.5"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
                SAVE CHANGES
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditProfile;