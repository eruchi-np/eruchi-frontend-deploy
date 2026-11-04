import { Outlet } from 'react-router-dom';
import { BrandSessionProvider } from './BrandSessionContext';

/** Keeps brand /me cached across /brand/account, dashboard, and insights. */
export default function BrandSessionGate() {
  return (
    <BrandSessionProvider>
      <Outlet />
    </BrandSessionProvider>
  );
}
