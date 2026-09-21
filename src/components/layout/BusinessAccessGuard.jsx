import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const USER_APP_PREFIXES = [
  '/profile',
  '/edit-profile',
  '/vouchers',
  '/campaigns',
  '/campaign-history',
  '/survey',
  '/standalone-surveys',
  '/standalone-survey',
  '/survey-complete',
  '/survey-history',
  '/complete-basic-info',
  '/complete-profile',
  '/additional-profile',
  '/email-verification',
];

const BusinessAccessGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isBusiness = localStorage.getItem('is_business') === 'true';
    const onBusinessRoute = location.pathname.startsWith('/business');
    const onUserApp = USER_APP_PREFIXES.some(
      (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
    );

    if (isBusiness && !onBusinessRoute && onUserApp) {
      navigate('/business/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default BusinessAccessGuard;
