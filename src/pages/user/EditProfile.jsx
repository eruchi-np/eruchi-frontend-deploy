import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../services/api";
import { occupationOptions } from "../../utils/occupation-data";
import {
  TABS,
  EDUCATION_LEVELS,
  MARITAL_STATUSES,
  NATIONALITIES,
  OTHER_LANGUAGE,
  emptyToNull,
  normalizeLanguage,
  normalizeChoice,
} from "./editProfile/editProfileConstants.js";
import EditProfileBasicTab from "./editProfile/EditProfileBasicTab.jsx";
import EditProfileDemographicsTab from "./editProfile/EditProfileDemographicsTab.jsx";

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
  const [nccsGrade, setNccsGrade] = useState(null);

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
          nationality: normalizeChoice(u.nationality, NATIONALITIES),
          firstLanguage: normalizeLanguage(u.firstLanguage),
          educationLevel: normalizeChoice(u.educationLevel, EDUCATION_LEVELS),
          maritalStatus: normalizeChoice(u.maritalStatus, MARITAL_STATUSES, {
            Single: "Unmarried",
          }),
          occupation: normalizeChoice(
            u.occupation,
            occupationOptions.map((option) => option.label)
          ),
          mainIncomeSource: u.mainIncomeSource || "",
          mainIncomeSourceEducation: u.mainIncomeSourceEducation || "",
          householdDurables: u.householdDurables || [],
          address: {
            municipality: u.address?.municipality || "",
            wardNumber: u.address?.wardNumber || "",
          },
        });
        setNccsGrade(u.nccs_grade?.class ? u.nccs_grade : null);
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
        nationality: emptyToNull(demo.nationality),
        firstLanguage:
          demo.firstLanguage === OTHER_LANGUAGE ? null : emptyToNull(demo.firstLanguage),
        educationLevel: emptyToNull(demo.educationLevel),
        maritalStatus: emptyToNull(demo.maritalStatus),
        occupation: emptyToNull(demo.occupation),
        mainIncomeSource: emptyToNull(demo.mainIncomeSource),
        mainIncomeSourceEducation:
          demo.mainIncomeSource === "Me" ? null : emptyToNull(demo.mainIncomeSourceEducation),
        address:
          demo.address.municipality && demo.address.wardNumber
            ? {
                municipality: demo.address.municipality,
                wardNumber: Number(demo.address.wardNumber),
              }
            : undefined,
      };
      const res = await userAPI.updateDemographics(payload);
      const grade = res?.data?.data?.nccs_grade;
      setNccsGrade(grade?.class ? grade : null);
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
      <div className="bg-white border-b border-[#EDF2F7] py-5 sm:py-6 px-4 sm:px-6">
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
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`py-3.5 px-3 sm:px-4 text-xs font-semibold tracking-[0.4px] border-b-2 transition-colors whitespace-nowrap shrink-0 ${
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
        {activeTab === 0 && (
          <EditProfileBasicTab
            basic={basic}
            setBasic={setBasic}
            saving={saving}
            onSave={handleSaveBasic}
          />
        )}

        {activeTab === 1 && (
          <EditProfileDemographicsTab
            demo={demo}
            setDemo={setDemo}
            nccsGrade={nccsGrade}
            saving={saving}
            onSave={handleSaveDemographics}
            toggleDurable={toggleDurable}
          />
        )}
      </div>
    </div>
  );
};

export default EditProfile;
