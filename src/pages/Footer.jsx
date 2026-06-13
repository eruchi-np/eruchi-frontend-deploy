import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white font-['Inter']">
      <div className="max-w-[940px] mx-auto px-6 py-8 md:py-10">

        {/* Mobile layout: compact stacked */}
        <div className="flex flex-col gap-6 md:hidden">

          {/* Brand + support */}
          <div>
            <span className="text-[#3399FF] font-bold tracking-tight text-sm">eRuchi</span>
            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
              Earn rewards by sharing your opinions.
            </p>
            <a
              href="mailto:support@eruchi.com.np"
              className="inline-block mt-2 text-[11px] text-gray-500 hover:text-[#3399FF] transition-colors"
            >
              support@eruchi.com.np
            </a>
          </div>

          {/* Links: two columns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Platform</p>
              <ul className="space-y-1.5">
                {[
                  { label: 'Home', to: '/' },
                  { label: 'Surveys', to: '/standalone-surveys' },
                  { label: 'Campaigns', to: '/campaigns' },
                  { label: 'Shop', to: '/shop' },
                  { label: 'FAQs', to: '/faqs' },
                  { label: 'For Business', to: '/for-business' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Legal</p>
              <ul className="space-y-1.5">
                {[
                  { label: 'Privacy Policy', to: '/privacy-policy' },
                  { label: 'Terms of Service', to: '/terms' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              © {year} E. Ruchi Private Limited. All Rights Reserved.
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              eRuchi™ is a trademark of E. Ruchi Private Limited.
            </p>
          </div>
        </div>

        {/* Desktop layout: 4-column grid */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-8 mb-10">

            {/* Brand */}
            <div>
              <span className="text-[#3399FF] font-bold tracking-tight text-base">eRuchi</span>
              <p className="mt-2 text-[11px] text-gray-400 leading-relaxed max-w-[180px]">
                Earn rewards by sharing your opinions. Nepal's trusted survey platform.
              </p>
              <a
                href="mailto:support@eruchi.com.np"
                className="inline-block mt-3 text-[11px] text-gray-500 hover:text-[#3399FF] transition-colors"
              >
                support@eruchi.com.np
              </a>
            </div>

            {/* Platform */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Platform</p>
              <ul className="space-y-2">
                {[
                  { label: 'Home', to: '/' },
                  { label: 'Surveys', to: '/standalone-surveys' },
                  { label: 'Campaigns', to: '/campaigns' },
                  { label: 'Shop', to: '/shop' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Company</p>
              <ul className="space-y-2">
                {[
                  { label: 'For Business', to: '/for-business' },
                  { label: 'FAQs', to: '/faqs' },
                  { label: 'Sign Up', to: '/signup' },
                  { label: 'Log In', to: '/login' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Legal</p>
              <ul className="space-y-2">
                {[
                  { label: 'Privacy Policy', to: '/privacy-policy' },
                  { label: 'Terms of Service', to: '/terms' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              © {year} E. Ruchi Private Limited. All Rights Reserved.{' '}
              eRuchi™ is a trademark of E. Ruchi Private Limited.
            </p>
            <p className="text-[11px] text-gray-300">Made in Nepal 🇳🇵</p>
          </div>
        </div>

      </div>

      {/* Spacer so footer clears the fixed BottomNavigation on mobile */}
      <div className="h-16 md:hidden" />
    </footer>
  );
};

export default Footer;