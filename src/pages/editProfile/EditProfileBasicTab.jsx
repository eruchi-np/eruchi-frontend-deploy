import React from "react";
import { Loader2 } from "lucide-react";
import { GENDER_OPTIONS } from "./editProfileConstants.js";
import { Label, Input, SectionCard } from "./editProfileFields.jsx";

export default function EditProfileBasicTab({ basic, setBasic, saving, onSave }) {
  return (
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
