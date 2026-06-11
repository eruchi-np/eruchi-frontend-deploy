// src/pages/CompleteBasicInfo.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const schema = z.object({
  phone: z
    .string()
    .min(8, "Phone number must be at least 8 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], {
    required_error: "Please select your gender",
  }),
});

const CompleteBasicInfo = () => {
  const { user, refreshUser, loading: authLoading } = useAuth();  // ← Changed fetchUser → refreshUser
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split('T')[0]
        : '',
      gender: user?.gender || '',
    },
  });

  // Redirect if already complete or no auth
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (authLoading) return;

    if (!token) {
      toast.error("Please log in to continue");
      navigate('/login', { replace: true });
      return;
    }

    if (user?.isRegistrationComplete) {
      if (user.isProfileComplete) {
        navigate('/', { replace: true });
      } else {
        navigate('/complete-profile', { replace: true });
      }
    }

    reset({
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split('T')[0]
        : '',
      gender: user?.gender || '',
    });
  }, [user, authLoading, navigate, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);

    const token = localStorage.getItem('access_token');
    const authMethod = localStorage.getItem('auth_method');

    if (!token) {
      toast.error("Authentication required. Redirecting to login...");
      navigate('/login', { replace: true });
      setSubmitting(false);
      return;
    }

    try {
      console.log("[DEBUG] Auth method:", authMethod);
      console.log("[DEBUG] Token value:", token);
      console.log("[DEBUG] Preparing PUT to /users/me/basic-profile");

      const config = {
        withCredentials: true,
      };

      if (token && token !== 'USE_COOKIE_AUTH' && authMethod !== 'cookie') {
        config.headers = { Authorization: `Bearer ${token}` };
        console.log("[DEBUG] Using Bearer token authentication");
      } else {
        console.log("[DEBUG] Using cookie-based authentication (no Bearer header)");
      }

      await axios.put(
        `${API_BASE_URL}/users/me/basic-profile`,
        {
          phone: data.phone.trim(),
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
        },
        config
      );

      toast.success("Basic information saved successfully!");
      
      // Refresh user data (this was crashing before)
      await refreshUser();  // ← Changed here

      // Optional: force navigation if needed
      // navigate(user?.isProfileComplete ? '/' : '/complete-profile');

    } catch (err) {
      console.error("[ERROR] Failed to update basic profile:", err);

      if (err.response?.status === 401) {
        toast.error("Session expired or invalid authentication. Please log in again.");
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_method');
        navigate('/login', { replace: true });
      } else if (err.response?.status === 400) {
        const msg = err.response.data.message ||
                    err.response.data.errors?.[0]?.msg ||
                    "Invalid information provided.";
        toast.error(msg);
      } else {
        toast.error(
          err.response?.data?.message ||
          "Could not save your information. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-10">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Complete Your Basic Profile
          </h2>
          <p className="text-center text-gray-600 mb-8">
            We need a few more details to personalize your experience.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register("phone")}
                className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="98XXXXXXXX or +977..."
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("dateOfBirth")}
                className={`w-full px-4 py-3 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                {...register("gender")}
                className={`w-full px-4 py-3 border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || authLoading}
              className={`w-full py-3 px-4 font-medium rounded-lg text-white transition-colors ${
                submitting || authLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </span>
              ) : (
                'Save & Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteBasicInfo;