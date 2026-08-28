import React from 'react';
import { Home, HelpCircle, User, ClipboardList, ShoppingBag, QrCode, LayoutDashboard, Store } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BusinessBottomNavigation = () => {
  const location = useLocation();

  const isDashboard = location.pathname === '/business/dashboard';
  const isScan = location.pathname === '/business/scan';
  const isProfile = location.pathname.startsWith('/business/profile') || location.pathname.startsWith('/business/vouchers');

  return (
    <nav className="fixed block md:hidden bottom-0 z-50 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <ul className="flex justify-between items-end">
        <Link to="/business/dashboard">
          <li className="flex flex-col items-center pb-1">
            <button className={`p-1 rounded-full focus:outline-none ${isDashboard ? 'text-blue-600' : 'text-gray-500'}`}>
              <LayoutDashboard size={24} />
            </button>
            <span className={`text-xs mt-1 ${isDashboard ? 'text-blue-600' : 'text-gray-500'}`}>Dashboard</span>
          </li>
        </Link>

        <Link to="/business/scan">
          <li className="flex flex-col items-center" style={{ marginBottom: '12px' }}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-white ${isScan ? 'bg-blue-600' : 'bg-gray-900'}`}>
              <QrCode size={28} className="text-white" />
            </div>
            <span className={`text-xs mt-1 ${isScan ? 'text-blue-600' : 'text-gray-500'}`}>Scan</span>
          </li>
        </Link>

        <Link to="/business/profile">
          <li className="flex flex-col items-center pb-1">
            <button className={`p-1 rounded-full focus:outline-none ${isProfile ? 'text-blue-600' : 'text-gray-500'}`}>
              <Store size={24} />
            </button>
            <span className={`text-xs mt-1 ${isProfile ? 'text-blue-600' : 'text-gray-500'}`}>Profile</span>
          </li>
        </Link>
      </ul>
    </nav>
  );
};

const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (location.pathname.startsWith('/business')) {
    return <BusinessBottomNavigation />;
  }

  const navItems = [
    { path: '/', icon: <Home size={24} />, label: 'Home' },
    { path: '/standalone-surveys', icon: <ClipboardList size={24} />, label: 'Surveys', requiresProfile: true },
    { path: '/shop', icon: <ShoppingBag size={24} />, label: 'REWARDS' },
    { path: '/faqs', icon: <HelpCircle size={24} />, label: 'FAQs' },
    { path: '/profile', icon: <User size={24} />, label: 'Profile' },

  ];

  return (
    <nav className="fixed block md:hidden bottom-0 z-50 left-0 right-0 bg-white border-t border-gray-400 px-1 sm:px-3 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
      <ul className="flex justify-between items-center gap-0.5">
        {navItems.filter(item => !item.requiresProfile || user?.isProfileComplete).map((item) => (
          <Link key={item.path} to={item.path} className="min-w-0 flex-1">
            <NavItem
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
            />
          </Link>
        ))}
      </ul>
    </nav>
  );
};

const NavItem = ({ icon, label, isActive }) => {
  return (
    <li className="flex flex-col bg-white text-black items-center min-w-0">
      <button className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200 ${
        isActive ? 'text-blue-600' : 'text-gray-600 hover:bg-gray-100'
      }`}>
        {icon}
      </button>
      <span className={`text-[10px] sm:text-xs mt-0.5 truncate max-w-full px-0.5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
        {label}
      </span>
    </li>
  );
};

export default BottomNavigation;