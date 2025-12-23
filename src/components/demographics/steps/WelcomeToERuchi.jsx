import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomeToERuchi = () => {
  const navigate = useNavigate();
  const [dialogOpacityClass, setDialogOpacityClass] = useState('opacity-0');

  useEffect(() => {
    // Trigger animation after component mounts
    setDialogOpacityClass('opacity-0');
    const timer = setTimeout(() => {
      setDialogOpacityClass('opacity-100');
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setDialogOpacityClass('opacity-0');
    setTimeout(() => {
      navigate('/'); // Redirect to home page
    }, 500);
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#3399ff] p-0
        transition-opacity duration-500 ease-in-out 
        ${dialogOpacityClass}
      `}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center max-w-lg mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-white text-center">Welcome to eRuchi!</h1>
          <div className="text-xl mb-12 space-y-6 text-white text-center">
            <p>
              Thank you for completing your profile and telling us what's at the <strong>core</strong> of what defines you.
            </p>
            <p>
              Your selections will help us match you with product samples that truly fit your personality and passions.
            </p>
            <p>
              Get ready to discover amazing products tailored just for you!
            </p>
          </div>
          <button
            onClick={handleContinue}
            className="bg-white text-[#3399ff] hover:bg-gray-100 text-xl px-12 py-4 rounded-xl font-bold mx-auto transition-colors transform hover:scale-105"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeToERuchi;