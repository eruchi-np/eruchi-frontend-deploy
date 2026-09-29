import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { businessAPI } from "../../services/api";

const LINKS = [
  { to: "/business/scan", label: "Scan" },
  { to: "/business/vouchers", label: "Vouchers" },
  { to: "/business/dashboard", label: "Dashboard" },
];

const isActive = (pathname, to) => {
  if (to === "/business/dashboard") return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
};

export default function MerchantLayout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState(
    () => localStorage.getItem("business_name") || ""
  );
  const [logo, setLogo] = useState("");

  useEffect(() => {
    let cancelled = false;
    businessAPI
      .getProfile({ skipErrorToast: true })
      .then(({ data }) => {
        if (cancelled) return;
        const profile = data.data || {};
        setName(profile.brandName || profile.name || "");
        setLogo(profile.logo || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    try {
      await businessAPI.logout();
      localStorage.removeItem("is_business");
      localStorage.removeItem("business_name");
      window.dispatchEvent(new Event("authChange"));
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#d7eefc_0%,#eef6fb_28%,#f7fafc_100%)] pb-28">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center gap-4">
          <Link to="/business/dashboard" className="shrink-0">
            <img src="/logo-mark.png" alt="eRuchi" className="h-8 w-auto" />
          </Link>

          <nav className="hidden sm:flex flex-1 items-center justify-center gap-2">
            {LINKS.map((link) => {
              const active = isActive(pathname, link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#2f6fed] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3 min-w-0">
            <Link to="/business/profile" className="text-right min-w-0">
              <p className="text-xs text-gray-400 leading-none">Hello!</p>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px] sm:max-w-[180px]">
                {name || "Your store"}
              </p>
            </Link>
            <Link
              to="/business/profile"
              className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0"
            >
              {logo ? (
                <img src={logo} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-sm font-semibold text-gray-400">
                  {(name || "S").charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="hidden md:inline text-xs font-medium text-gray-400 hover:text-gray-700"
            >
              Log out
            </button>
          </div>
        </div>

        <nav className="sm:hidden flex items-center justify-center gap-2 px-4 pb-3">
          {LINKS.map((link) => {
            const active = isActive(pathname, link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  active ? "bg-[#2f6fed] text-white" : "text-gray-500"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
