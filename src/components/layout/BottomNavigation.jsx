import React from 'react';
import { Home, HelpCircle, User, Briefcase } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <Home size={24} />, label: 'Home' },
    { path: '/for-business', icon: <Briefcase size={24} />, label: 'For Business' },
    { path: '/faqs', icon: <HelpCircle size={24} />, label: 'FAQs' },
    { path: '/profile', icon: <User size={24} />, label: 'Profile' },
  ];

  return (
    <nav className="fixed block md:hidden rounded-lg bottom-0 z-50 left-0 right-0 bg-white border-t border-gray-400 px-4 py-2">
      <ul className="flex justify-between items-center">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <NavItem 
              icon={item.icon} 
              label={item.label}
              isActive={location.pathname === item.path}
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