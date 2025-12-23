import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EmailVerificationPending = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const [isResending, setIsResending] = useState(false);

  if (!email) {
    // Redirect to signup if no email provided
    navigate('/signup');
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email });
      toast.success('Verification email resent successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email.';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">Verify Your Email</h2>
        <p className="text-gray-600 text-center mb-6">
          We've sent a verification email to <span className="font-semibold">{email}</span>. 
          Please check your inbox (and spam folder) and click the link to verify your account.
        </p>
        <button
          onClick={handleResend}
          disabled={isResending}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            isResending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isResending ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Resending...
            </div>
          ) : (
            'Resend Verification Email'
          )}
        </button>
        <p className="text-center mt-4 text-sm text-gray-600">
          Already verified? <a href="/login" className="text-blue-600 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationPending;