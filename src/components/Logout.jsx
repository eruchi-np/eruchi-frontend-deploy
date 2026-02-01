import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import axios from 'axios';
import { clearAuth } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth?.() || {};

  const handleLogout = async () => {
    try {
      // Call backend to clear the httpOnly cookie
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {}, 
        { withCredentials: true }  // This sends the current cookie so backend can clear it
      );

      console.log('Logout API success — cookie cleared by server');
    } catch (error) {
      console.warn('Logout API call failed, but clearing frontend state anyway', error);
      // Continue anyway — don't block user
    }

    // Clear frontend state (localStorage, context, etc.)
    clearAuth();

    if (logout) {
      logout();
    }

    // Notify other components
    window.dispatchEvent(new Event('authChange'));

    // Redirect to login
    navigate('/login', { replace: true });
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