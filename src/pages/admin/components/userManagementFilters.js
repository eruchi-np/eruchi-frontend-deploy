import { Users, Clock } from "lucide-react";

export const ACTIVITY_OPTIONS = [
  { value: "", label: "All users", sub: "No activity filter", icon: Users },
  { value: "today", label: "Online today", sub: "Active since midnight (Nepal)", icon: Clock },
  { value: "7d", label: "Last 7 days", sub: "Seen within a week", icon: Clock },
  { value: "inactive_7d", label: "Inactive 7+ days", sub: "Quieter than a week", icon: Clock },
  { value: "inactive_30d", label: "Inactive 30+ days", sub: "Long idle", icon: Clock },
];

export const BOOL_OPTIONS = [
  { value: "", label: "Any" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

export const EMAIL_EXPORT_TYPES = [
  {
    value: "notifications",
    label: "In-app notification emails",
    sub: "Delivery updates, survey invites",
  },
  {
    value: "reminders",
    label: "Reminder emails",
    sub: "Survey nudges, expiry, win-back",
  },
  {
    value: "promotional",
    label: "Promotional emails",
    sub: "Marketing and announcements",
  },
];

export const LIFECYCLE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "onboarding", label: "Onboarding" },
  { value: "stalled", label: "Stalled" },
  { value: "active", label: "Active" },
  { value: "atRisk", label: "At risk" },
  { value: "dormant", label: "Dormant" },
  { value: "none", label: "Not tagged yet" },
];

export const EMPTY_ADVANCED = {
  lifecycleState: "",
  isVerified: "",
  isProfileComplete: "",
  isAdditionalProfileComplete: "",
  unsubscribedFromEmails: "",
  creditsMin: "",
  creditsMax: "",
  createdAtFrom: "",
  createdAtTo: "",
  dateOfBirthFrom: "",
  dateOfBirthTo: "",
  lastSurveyCompletedAtFrom: "",
  lastSurveyCompletedAtTo: "",
  addresses: [],
};

export const NEPAL_TZ = "Asia/Kathmandu";

/** Format lastActiveAt in Nepal time; never invent activity from createdAt. */
export const formatLastOnline = (user) => {
  if (!user.lastActiveAt) return "Never";
  const date = new Date(user.lastActiveAt);
  if (Number.isNaN(date.getTime())) return "Never";

  return date.toLocaleString("en-GB", {
    timeZone: NEPAL_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const countActiveAdvanced = (filters) =>
  Object.values(filters).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value != null;
  }).length;
