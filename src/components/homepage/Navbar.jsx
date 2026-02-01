import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Loader2, LogOut } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Navbar = () => {
  const { user, loading, logout: contextLogout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleLogout = async () => {
    try {
      // Call backend to clear the httpOnly cookie
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {}, 
        { withCredentials: true } // Sends current cookie so backend can expire it
      );
      console.log('Backend logout successful');
    } catch (error) {
      console.warn('Backend logout failed - cleaning frontend anyway', error);
      // Continue anyway
    }

    // Clear frontend state
    if (contextLogout) {
      contextLogout();
    }

    // Close drawer if open (mobile)
    setIsDrawerOpen(false);

    // Redirect to login
    navigate('/login', { replace: true });
  };

  // Derive first letter safely
  const firstLetter = user?.username 
    ? user.username.charAt(0).toUpperCase() 
    : '';

  return (
    <nav className="rounded-lg border-b z-50 p-2.5 top-0 bg-white sticky">
      <div className="flex justify-between items-center mx-4">
        {/* Logo */}
        <div className="cursor-pointer">
          <Link to="/">
            <img src="/LogoEarlyAccess.png" width={135} height={60} alt="eruchi_icon" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8">
          <Link to="/">
            <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Home</span>
          </Link>
          <Link to="/for-business">
            <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">For Business</span>
          </Link>
          <Link to="/faqs">
            <span className="font-semibold hover:text-blue-600 transition-colors">FAQs</span>
          </Link>
        </div>

        {/* User auth area - Desktop */}
        {loading ? (
          <div className="hidden md:flex justify-center items-center space-y-7">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : user ? (
          <div className="hidden md:flex justify-center items-center space-x-4">
            {/* Profile Circle */}
            <Link 
              to="/profile" 
              className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-semibold text-sm hover:bg-blue-600 transition-colors"
            >
              {firstLetter}
            </Link>

            {/* Logout Icon */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex">
            <Link to="/login">
              <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Login</span>
            </Link>
          </div>
        )}

        {/* Mobile Hamburger Menu */}
        <div className="flex space-x-5 items-center md:hidden cursor-pointer" onClick={toggleDrawer}>
          {isDrawerOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-7 h-7 text-black" />}
        </div>
      </div>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed top-0 right-0 w-full h-full transition-all fade-in-5 bg-white shadow-lg z-50 p-6">
          <div className="flex justify-between border-b-2 pb-5 w-full items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
            <button onClick={toggleDrawer} className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <X className="w-7 h-7 text-black" />
            </button>
          </div>

          <nav className="flex transition-all h-full relative fade-in-5 flex-col gap-6">
            <Link 
              to="/for-business" 
              onClick={toggleDrawer}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
            >
              FOR BUSINESS
            </Link>
            <Link 
              to="/faqs" 
              onClick={toggleDrawer}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
            >
              FAQs
            </Link>

            {loading ? (
              <div className="py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : user ? (
              <>
                <Link 
                  to="/profile" 
                  onClick={toggleDrawer} 
                  className="flex items-center text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-semibold text-sm mr-3">
                    {firstLetter}
                  </div>
                  Profile
                </Link>

                {/* Logout in mobile drawer */}
                <button
                  onClick={() => {
                    handleLogout();
                    toggleDrawer();
                  }}
                  className="flex items-center text-lg font-semibold text-red-600 hover:text-red-700 transition-colors py-2 border-b border-gray-100 w-full text-left"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                onClick={toggleDrawer}
                className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
              >
                Login
              </Link>
            )}
          </nav>

          {!user && !loading && (
            <div className="w-full justify-center items-center border-t-2 border-gray-200 bg-blue-600 rounded-xl absolute bottom-6 left-0 right-0 mx-6 text-white p-4 text-center shadow-lg hover:bg-blue-700 transition-colors">
              <Link to="/login" onClick={toggleDrawer}>
                <span className="uppercase cursor-pointer font-bold text-lg">Login</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;