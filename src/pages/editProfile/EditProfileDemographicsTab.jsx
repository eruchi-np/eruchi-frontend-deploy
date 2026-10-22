import React from "react";
import { Loader2 } from "lucide-react";
import SearchableSelect from "../../components/demographics/ui/SearchableSelect";
import { occupationOptions } from "../../utils/occupation-data";
import {
  EDUCATION_LEVELS,
  MARITAL_STATUSES,
  INCOME_SOURCES,
  LANGUAGES,
  NATIONALITIES,
  HOUSEHOLD_DURABLES,
} from "./editProfileConstants.js";
import { Label, Input, Select, SectionCard } from "./editProfileFields.jsx";

export default function EditProfileDemographicsTab({
  demo,
  setDemo,
  nccsGrade,
  saving,
  onSave,
  toggleDurable,
}) {
  return (
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
                <option key={n} value={n}>
                  {n}
                </option>
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
              {LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
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
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Occupation</Label>
            <SearchableSelect
              options={occupationOptions}
              value={demo.occupation}
              onChange={(occupation) =>
                setDemo((p) => ({ ...p, occupation }))
              }
              placeholder="Select occupation"
              label="Occupation"
            />
          </div>
          <div>
            <Label>Main Income Source of your household</Label>
            <Select
              value={demo.mainIncomeSource}
              onChange={(e) => {
                const value = e.target.value;
                setDemo((p) => ({
                  ...p,
                  mainIncomeSource: value,
                  // Clear earner education when "Me" (same as onboarding)
                  ...(value === "Me" ? { mainIncomeSourceEducation: "" } : {}),
                }));
              }}
            >
              <option value="">Select source</option>
              {INCOME_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          {demo.mainIncomeSource && demo.mainIncomeSource !== "Me" && (
            <div className="sm:col-span-2">
              <Label>Education Level of {demo.mainIncomeSource}</Label>
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

      <SectionCard title="NCCS grade">
        <p className="text-[12px] text-[#6B7A8A] mb-3">
          Calculated from durables and chief earner education. Updates when you save demographics.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Class</Label>
            <p className="text-sm font-semibold text-[#0F1A14]">
              {nccsGrade?.class || "—"}
            </p>
          </div>
          <div>
            <Label>Sub-class</Label>
            <p className="text-sm font-semibold text-[#0F1A14]">
              {nccsGrade?.subClass ?? "—"}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button
          onClick={onSave}
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
  );
}
