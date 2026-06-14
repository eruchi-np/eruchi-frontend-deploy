import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Drop this inside <Router> in App.jsx.
 * If a business session is active and the user navigates to any non-business
 * route, they get sent straight back to /business/dashboard.
 */
const BusinessAccessGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isBusiness = localStorage.getItem('is_business') === 'true';
    const onBusinessRoute = location.pathname.startsWith('/business');

    if (isBusiness && !onBusinessRoute) {
      navigate('/business/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default BusinessAccessGuard;