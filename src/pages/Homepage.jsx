import React, { useState, useEffect } from 'react';

export default function Homepage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const username = localStorage.getItem("username");
    
    if (token && username) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    setLoading(false);

    const handleAuthChange = () => {
      const token = localStorage.getItem("access_token");
      const username = localStorage.getItem("username");
      setIsLoggedIn(!!(token && username));
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleButtonClick = () => {
    if (isLoggedIn) {
      window.location.href = '/profile';
    } else {
      window.location.href = '/login';
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-16">
          {/* Left Side - Headline */}
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-tight text-gray-900">
              Discover what defines you.
            </h1>
          </div>

          {/* Right Side - CTA */}
          <div className="lg:pt-8">
            <p className="text-lg sm:text-xl text-gray-600 mb-6">
              Your journey starts here. Let eRuchi connect you with product samples designed to match your interests.{' '}
              <a href="/faqs" className="text-blue-500 hover:text-blue-600 font-medium">
                Learn More!
              </a>
            </p>
            <button 
              onClick={handleButtonClick}
              className="bg-blue-500 hover:bg-blue-600 text-white text-lg sm:text-xl font-medium px-8 py-4 rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Become a Sampler'}
            </button>
          </div>
        </div>

        {/* Steps Section */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 sm:pb-16 lg:pb-0">
          {/* Step 1 */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-8 lg:p-10 text-white">
            <div className="mb-4">
              <span className="text-lg font-medium opacity-90">Step 1</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold leading-tight">
              Tell us<br />what you love.
            </h2>
          </div>

          {/* Step 2 */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-8 lg:p-10 text-white">
            <div className="mb-4">
              <span className="text-lg font-medium opacity-90">Step 2</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold leading-tight">
              We'll match you with something special.
            </h2>
          </div>

          {/* Step 3 */}
          <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl p-8 lg:p-10 text-white sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <span className="text-lg font-medium opacity-90">Step 3</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold leading-tight">
              Receive your products, completely free of costs.
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}