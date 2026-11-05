import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { brandAPI } from '../../services/api';
import { identifyBrandClient, initRuchiAnalytics } from './ruchiAnalytics';

const BrandSessionContext = createContext({
  status: 'loading',
  client: null,
  refresh: async () => {},
});

export function BrandSessionProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [client, setClient] = useState(null);

  const refresh = async () => {
    const { data } = await brandAPI.me({ skipErrorToast: true, skipAuthRedirect: true });
    setClient(data.client);
    identifyBrandClient(data.client);
    setStatus('authed');
    return data.client;
  };

  useEffect(() => {
    let cancelled = false;
    initRuchiAnalytics();
    brandAPI.me({ skipErrorToast: true, skipAuthRedirect: true })
      .then(({ data }) => {
        if (cancelled) return;
        setClient(data.client);
        identifyBrandClient(data.client);
        setStatus('authed');
      })
      .catch(() => {
        if (!cancelled) {
          setClient(null);
          setStatus('unauthed');
        }
      });
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({ status, client, refresh }), [status, client]);

  return (
    <BrandSessionContext.Provider value={value}>
      {children}
    </BrandSessionContext.Provider>
  );
}

export function useBrandSession() {
  return useContext(BrandSessionContext);
}
