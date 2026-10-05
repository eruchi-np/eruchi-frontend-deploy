import { isStaffAdmin } from "./adminRoles";

const ALLOWED_PREFIXES = [
  "/login",
  "/signup",
  "/complete-basic-info",
  "/complete-profile",
  "/email-verification",
  "/verify-email",
  "/reset-password",
  "/unsubscribe",
  "/terms",
  "/privacy-policy",
];

export const isOnboardingEscapePath = (pathname = "") =>
  ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export const isProfileOnboardingLocked = (user) =>
  Boolean(user) &&
  !isStaffAdmin(user.role) &&
  (!user.isProfileComplete || !user.isAdditionalProfileComplete);

export const getOnboardingRedirectPath = (user, pathname = "") => {
  if (!user || isStaffAdmin(user.role)) return null;
  if (pathname.startsWith("/business")) return null;
  if (isOnboardingEscapePath(pathname)) return null;

  if (!user.isRegistrationComplete) return "/complete-basic-info";
  if (!user.isProfileComplete) return "/complete-profile";
  if (!user.isAdditionalProfileComplete && pathname !== "/additional-profile") {
    return "/additional-profile";
  }
  return null;
};
