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
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
  } catch (err) {
    console.warn('Logout API failed', err);
  }

  // Set lock flag BEFORE clearing state (prevents race)
  localStorage.setItem('logout_lock', Date.now().toString());

  clearAuth();
  if (contextLogout) contextLogout();
  window.dispatchEvent(new Event('authChange'));

  // Redirect to home (not login)
  window.location.href = '/';
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