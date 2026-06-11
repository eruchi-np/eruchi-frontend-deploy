import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { clearAuth } from '../utils/auth';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication data
    clearAuth();
    
    // Dispatch event for components listening to auth changes
    window.dispatchEvent(new Event('authChange'));
    
    // Redirect to login
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
};

export default Logout;