export const STAFF_ROLES = [
  'admin',
  'superadmin',
  'business_admin',
  'customer_admin',
];

export const PERMISSIONS = {
  stats: ['admin', 'superadmin', 'business_admin', 'customer_admin'],
  users: ['admin', 'superadmin', 'customer_admin'],
  credits_view: ['admin', 'superadmin', 'customer_admin'],
  credits_adjust: ['admin', 'superadmin'],
  surveys: ['admin', 'superadmin', 'customer_admin'],
  surveys_catalog: ['admin', 'superadmin', 'business_admin', 'customer_admin'],
  clusters: ['admin', 'superadmin', 'customer_admin'],
  businesses: ['admin', 'superadmin', 'business_admin'],
  vouchers: ['admin', 'superadmin', 'business_admin'],
  scans: ['admin', 'superadmin', 'business_admin'],
  faqs: ['admin', 'superadmin'],
  analytics: ['admin', 'superadmin'],
  admins: ['admin', 'superadmin'],
};

export const TAB_PERMISSIONS = {
  users: 'users',
  clusters: 'clusters',
  surveys: 'surveys',
  calendar: 'surveys',
  vouchers: 'vouchers',
  scans: 'scans',
  survey_exports: 'surveys',
};

export const isStaffAdmin = (role) => STAFF_ROLES.includes(role);

export const hasPermission = (role, permission) => {
  const allowed = PERMISSIONS[permission];
  return Boolean(role && allowed && allowed.includes(role));
};

export const adminHomePath = (role) => {
  if (role === 'business_admin') return '/admin/businesses';
  return '/admin';
};

export const defaultAdminTab = (role) => {
  if (role === 'business_admin') return 'vouchers';
  return 'users';
};

export const roleLabel = (role) => {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return 'Superadmin';
    case 'business_admin':
      return 'Business admin';
    case 'customer_admin':
      return 'Customer admin';
    default:
      return role || 'User';
  }
};
