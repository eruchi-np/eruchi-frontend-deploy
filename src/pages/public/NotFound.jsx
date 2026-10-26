import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      className="min-h-[70vh] flex items-center justify-center bg-white px-4 py-16"
      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
    >
      <div className="max-w-md text-center">
        <p className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 mb-4">
          404
        </p>
        <h1
          className="text-gray-900 mb-4"
          style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 500, lineHeight: 1.15 }}
        >
          Page not found
        </h1>
        <p className="text-gray-600 mb-10" style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 300 }}>
          That link doesn’t go anywhere. Head home or browse the rewards shop.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="rounded-full px-6 py-3 text-sm font-medium text-white"
            style={{ backgroundColor: '#134074' }}
          >
            Home
          </Link>
          <Link
            to="/shop"
            className="rounded-full px-6 py-3 text-sm font-medium border border-neutral-200 text-neutral-800"
          >
            Rewards Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
