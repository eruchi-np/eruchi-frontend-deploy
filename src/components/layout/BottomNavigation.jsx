import React from 'react';
import { Home, HelpCircle, User, ClipboardList, ShoppingBag, QrCode, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { businessAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BusinessBottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await businessAPI.logout();
      localStorage.removeItem('is_business');
      localStorage.removeItem('business_name');
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  const isDashboard = location.pathname === '/business/dashboard';
  const isScan = location.pathname === '/business/scan';

  return (
    <nav className="fixed block md:hidden rounded-lg bottom-0 z-50 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2">
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

        <li className="flex flex-col items-center pb-1">
          <button
            onClick={handleLogout}
            className="p-1 rounded-full text-gray-500 focus:outline-none"
          >
            <LogOut size={24} />
          </button>
          <span className="text-xs mt-1 text-gray-500">Logout</span>
        </li>
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
    <nav className="fixed block md:hidden rounded-lg bottom-0 z-50 left-0 right-0 bg-white border-t border-gray-400 px-4 py-2">
      <ul className="flex justify-between items-center">
        {navItems.filter(item => !item.requiresProfile || user?.isProfileComplete).map((item) => (
          <Link key={item.path} to={item.path}>
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
    <li className="flex flex-col bg-white text-black items-center">
      <button className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200 ${
        isActive ? 'text-blue-600' : 'text-gray-600 hover:bg-gray-100'
      }`}>
        {icon}
      </button>
      <span className={`text-xs mt-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
        {label}
      </span>
    </li>
  );
};

export default BottomNavigation;