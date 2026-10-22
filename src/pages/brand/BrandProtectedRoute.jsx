import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { brandAPI } from '../../services/api';

export default function BrandProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading');
  const [client, setClient] = useState(null);
  const location = useLocation();

  useEffect(() => {
    brandAPI.me({ skipErrorToast: true, skipAuthRedirect: true })
      .then(({ data }) => {
        setClient(data.client);
        setStatus('authed');
      })
      .catch(() => setStatus('unauthed'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (status === 'unauthed') {
    return <Navigate to="/brand/login" state={{ from: location }} replace />;
  }

  return React.cloneElement(children, { client });
}
