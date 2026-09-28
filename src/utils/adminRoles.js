export const STAFF_ROLES = [
  'admin',
  'superadmin', // legacy alias of admin
  'business_admin',
  'customer_admin',
];

/** Map legacy `superadmin` → canonical `admin` for permission checks. */
export const normalizeStaffRole = (role) =>
  role === 'superadmin' ? 'admin' : role;

/**
 * Full access = admin (legacy superadmin treated the same).
 * Scoped: business_admin, customer_admin.
 */
export const PERMISSIONS = {
  stats: ['admin', 'business_admin', 'customer_admin'],
  users: ['admin', 'customer_admin'],
  credits_view: ['admin', 'customer_admin'],
  credits_adjust: ['admin'],
  surveys: ['admin', 'customer_admin'],
  surveys_catalog: ['admin', 'business_admin', 'customer_admin'],
  clusters: ['admin', 'customer_admin'],
  businesses: ['admin', 'business_admin'],
  vouchers: ['admin', 'business_admin'],
  scans: ['admin', 'business_admin'],
  faqs: ['admin'],
  analytics: ['admin'],
  admins: ['admin'],
};

export const TAB_PERMISSIONS = {
  users: 'users',
  staff: 'admins',
  clusters: 'clusters',
  surveys: 'surveys',
  metrics: 'surveys',
  calendar: 'surveys',
  vouchers: 'vouchers',
  scans: 'scans',
  survey_exports: 'surveys',
};

export const isStaffAdmin = (role) => STAFF_ROLES.includes(role);

/** Owner admins who may adjust credits / manage full-admin roles. */
export const PROTECTED_ADMIN_EMAILS = [
  'ryanshr02@gmail.com',
  'shravaktuladhar@gmail.com',
];

const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

export const isProtectedAdminEmail = (email) =>
  PROTECTED_ADMIN_EMAILS.includes(normalizeEmail(email));

export const hasPermission = (role, permission) => {
  const allowed = PERMISSIONS[permission];
  const normalized = normalizeStaffRole(role);
  return Boolean(normalized && allowed && allowed.includes(normalized));
};

/** Credit grant/deduct UI + API — role admin AND owner email allowlist. */
export const canAdjustCredits = (user) =>
  Boolean(user && hasPermission(user.role, 'credits_adjust') && isProtectedAdminEmail(user.email));

export const adminHomePath = (role) => {
  if (role === 'business_admin') return '/admin/businesses';
  return '/admin';
};

export const defaultAdminTab = (role) => {
  if (role === 'business_admin') return 'vouchers';
  return 'users';
};

export const roleLabel = (role) => {
  switch (normalizeStaffRole(role)) {
    case 'admin':
      return 'Admin';
    case 'business_admin':
      return 'Business admin';
    case 'customer_admin':
      return 'Customer admin';
    default:
      return role || 'User';
  }
};
