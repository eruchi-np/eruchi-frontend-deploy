import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { rememberReturnPath } from '../../utils/auth';

export default function LimitedSessionBanner() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.limitedSession) return null;

  const goLogin = () => {
    rememberReturnPath(location);
  };

  return (
    <div
      className="sticky top-0 z-[60] w-full bg-[#0c1520] text-white text-center text-sm sm:text-[15px] px-3 py-2.5 leading-snug"
      role="status"
    >
      <span>Survey access only. </span>
      <Link
        to="/login"
        state={{ from: location }}
        onClick={goLogin}
        className="underline font-semibold underline-offset-2 hover:text-blue-200"
      >
        Login for full access.
      </Link>
    </div>
  );
}
