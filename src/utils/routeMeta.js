const DEFAULT_DESCRIPTION =
  'Earn Ruchi Credits by sharing feedback through surveys, then redeem them at partner cafes, gyms, and shops in Nepal.';

const PUBLIC_PAGES = [
  {
    test: (path) => path === '/',
    title: 'Earn credits for sharing your opinion',
    description: DEFAULT_DESCRIPTION,
    index: true,
  },
  {
    test: (path) => path === '/shop',
    title: 'Rewards Shop',
    description: 'Redeem eRuchi credits for vouchers at partner businesses across Nepal.',
    index: true,
  },
  {
    test: (path) => path.startsWith('/shop/merchant/'),
    title: 'Partner store',
    description: 'View this eRuchi partner store and redeem credit rewards.',
    index: true,
  },
  {
    test: (path) => path === '/for-business',
    title: 'For businesses',
    description: 'Become an eRuchi merchant and reach customers who share real product feedback.',
    index: true,
  },
  {
    test: (path) => path === '/faqs',
    title: 'FAQs',
    description: 'Answers to common questions about eRuchi surveys, credits, and rewards.',
    index: true,
  },
  {
    test: (path) => path === '/terms',
    title: 'Terms of Use',
    description: 'eRuchi terms of use.',
    index: true,
  },
  {
    test: (path) => path === '/privacy-policy',
    title: 'Privacy Policy',
    description: 'How eRuchi collects and uses your information.',
    index: true,
  },
];

const PRIVATE_TITLES = [
  { test: (path) => path === '/login', title: 'Log in' },
  { test: (path) => path === '/signup', title: 'Sign up' },
  { test: (path) => path.startsWith('/reset-password'), title: 'Reset password' },
  { test: (path) => path === '/profile', title: 'Profile' },
  { test: (path) => path === '/vouchers', title: 'My vouchers' },
  { test: (path) => path.startsWith('/vouchers/'), title: 'Voucher' },
  { test: (path) => path === '/standalone-surveys', title: 'Surveys' },
  { test: (path) => path.startsWith('/standalone-survey/'), title: 'Survey' },
  { test: (path) => path === '/survey-complete', title: 'Survey complete' },
  { test: (path) => path === '/survey-history', title: 'Survey history' },
  { test: (path) => path === '/campaigns', title: 'Campaigns' },
  { test: (path) => path.startsWith('/survey/'), title: 'Campaign survey' },
  { test: (path) => path === '/campaign-history', title: 'Campaign history' },
  { test: (path) => path.startsWith('/admin'), title: 'Admin' },
  { test: (path) => path.startsWith('/business'), title: 'Business' },
  { test: (path) => path.startsWith('/complete-'), title: 'Complete profile' },
  { test: (path) => path === '/edit-profile', title: 'Edit profile' },
];

function canonicalSearch(pathname, params) {
  if (pathname !== '/shop') return pathname;
  const page = params.get('page');
  if (page && page !== '1') return `/shop?page=${page}`;
  return '/shop';
}

export function getRouteMeta(pathname, searchParams) {
  const params = searchParams instanceof URLSearchParams
    ? searchParams
    : new URLSearchParams(searchParams || '');

  if (pathname === '/shop' && params.get('q')) {
    const page = params.get('page');
    return {
      title: page && page !== '1' ? `Search results · Page ${page}` : 'Search results',
      description: 'Search rewards on the eRuchi shop.',
      index: false,
      canonicalPath: canonicalSearch(pathname, params),
    };
  }

  const publicPage = PUBLIC_PAGES.find((entry) => entry.test(pathname));
  if (publicPage) {
    const page = pathname === '/shop' ? params.get('page') : null;
    return {
      title: page && page !== '1' ? `${publicPage.title} · Page ${page}` : publicPage.title,
      description: publicPage.description,
      index: publicPage.index,
      canonicalPath: canonicalSearch(pathname, params),
    };
  }

  const privatePage = PRIVATE_TITLES.find((entry) => entry.test(pathname));
  return {
    title: privatePage?.title || 'Page not found',
    description: DEFAULT_DESCRIPTION,
    index: false,
    canonicalPath: pathname,
  };
}

export { DEFAULT_DESCRIPTION };
