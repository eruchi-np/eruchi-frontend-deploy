import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import axios from 'axios';
import { clearAuth } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Logout = () => {
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth(); // renamed for clarity

  const handleLogout = async () => {
    try {
      // Call backend to expire the httpOnly cookie
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {}, 
        { withCredentials: true } // Ensures the current cookie is sent so backend can clear it
      );

      console.log('Logout successful - cookie cleared by server');
    } catch (error) {
      console.warn('Logout API failed - proceeding with frontend cleanup', error);
      // Continue anyway - don't block the user
    }

    // Clear frontend state
    clearAuth();

    // Use AuthContext logout if available
    if (contextLogout) {
      contextLogout();
    }

    // Notify other components (Navbar, Homepage, etc.)
    window.dispatchEvent(new Event('authChange'));

    // Redirect to login page
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