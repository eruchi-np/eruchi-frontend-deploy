export const TABS = ["Basic Info", "Demographics"];

export const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

// Mirror your backend enums — expand as needed from userValidationLists.js
export const EDUCATION_LEVELS = [
  "Illiterate",
  "Literate without formal schooling / Grade 4",
  "Grade 9",
  "Grade 12",
  "Bachelors / Diploma",
  "Masters",
  "PhD",
];

export const MARITAL_STATUSES = ["Unmarried", "Married", "Divorced", "Widowed", "Separated"];

export const INCOME_SOURCES = [
  "Me",
  "Father",
  "Mother",
  "Spouse/partner",
  "Sibling",
  "Other guardian or relative",
];

export const OTHER_LANGUAGE = "__other__";

export const LANGUAGES = [
  { value: "nepali", label: "Nepali" },
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "maithili", label: "Maithili" },
  { value: "bhojpuri", label: "Bhojpuri" },
  { value: "newari", label: "Newari" },
  { value: "tamang", label: "Tamang" },
  { value: OTHER_LANGUAGE, label: "Other" },
];

export const NATIONALITIES = ["Nepali", "Other"];

export const HOUSEHOLD_DURABLES = [
  "Electricity Connection",
  "Ceiling Fan",
  "Gas Stove",
  "Refrigerator",
  "Land in Rural Area",
  "Television",
  "Computer / Laptop",
  "Two-wheeler Vehicle",
  "Four-wheeler Vehicle",
  "Air Conditioner",
];

export const emptyToNull = (value) => (value === "" || value === undefined ? null : value);

export const normalizeLanguage = (raw) => {
  if (raw === undefined || raw === "") return "";
  // Backend stores "Other" as null.
  if (raw === null || String(raw).toLowerCase() === "other") return OTHER_LANGUAGE;
  const known = LANGUAGES.find((language) => language.value === raw);
  if (known) return known.value;
  const byLabel = LANGUAGES.find(
    (language) => language.label.toLowerCase() === String(raw).toLowerCase()
  );
  return byLabel ? byLabel.value : "";
};

export const normalizeChoice = (raw, allowed, aliases = {}) => {
  if (raw == null || raw === "") return "";
  const aliasKey = Object.keys(aliases).find(
    (key) => key.toLowerCase() === String(raw).toLowerCase()
  );
  if (aliasKey) return aliases[aliasKey];
  const match = allowed.find((item) => item.toLowerCase() === String(raw).toLowerCase());
  return match || "";
};
