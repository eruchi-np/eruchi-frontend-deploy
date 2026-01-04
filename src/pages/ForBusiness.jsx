import React from 'react';

const ForBusiness = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 md:mb-24">
          {/* Left - Heading */}
          <div>
            <h1 className="text-5xl md:text-7xl font-semibold text-gray-900 leading-tight">
              Discover <span className="text-blue-600">Who</span>
              <br />
              Defines <span className="text-gray-900">You</span>
            </h1>
          </div>
          
          {/* Right - Description */}
          <div>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
              Unlock your product's market potential with optimised product testing.
              eRuchi is the quickest and most cost-effective way to learn about your
              consumers, and connect with them meaningfully. Reach out to us on any of the
              platforms below!
            </p>
          </div>
        </div>

        {/* Cards Section */}
        <div className="space-y-6 mb-16 md:mb-24">
          {/* First Card - Blue - LEFT ALIGNED */}
          <div className="bg-blue-600 text-white rounded-3xl p-10 md:p-16">
            <h3 className="text-2xl font-medium mb-2" style={{ textAlign: 'left' }}>Tell us about</h3>
            <h2 className="text-3xl md:text-4xl font-semibold" style={{ textAlign: 'left' }}>Your product and your consumers</h2>
          </div>
          
          {/* Second and Third Cards - Side by Side on Desktop */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Second Card - Dark - RIGHT ALIGNED */}
            <div className="bg-gray-800 text-white rounded-3xl p-10 md:p-16">
              <h3 className="text-xl font-medium mb-2" style={{ textAlign: 'right' }}>We'll find out</h3>
              <h2 className="text-3xl md:text-4xl font-semibold" style={{ textAlign: 'right' }}>What consumers think and how they feel</h2>
            </div>
            
            {/* Third Card - Blue Gradient - RIGHT ALIGNED */}
            <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white rounded-3xl p-10 md:p-16">
              <h3 className="text-xl font-medium mb-2" style={{ textAlign: 'right' }}>We'll return to you with</h3>
              <h2 className="text-3xl md:text-5xl font-semibold" style={{ textAlign: 'right' }}>Actionable insights</h2>
            </div>
          </div>
        </div>

        {/* Get in Touch Section - Horizontal */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 text-center">Get in Touch</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Email */}
            <a 
              href="mailto:sales@eruchi.com.np"
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-all group hover:shadow-md"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-900 font-semibold text-base">Email</span>
            </a>

            {/* Instagram */}
            <a 
              href="https://instagram.com/eruchi.np" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-all group hover:shadow-md"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <span className="text-gray-900 font-semibold text-base">Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForBusiness;