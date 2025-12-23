import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.put(`${API_BASE_URL}/auth/verify-email/${token}`);
        setStatus('success');
        toast.success('Email verified successfully!');
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        setStatus('error');
        const errorMessage = error.response?.data?.message || 'Verification failed.';
        toast.error(errorMessage);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-green-600">Verification Successful!</h2>
            <p className="text-gray-600">Redirecting to login...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Failed</h2>
            <p className="text-gray-600 mb-4">The token may be invalid or expired.</p>
            <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;