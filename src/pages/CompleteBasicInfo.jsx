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
  const { user, refreshUser, loading: authLoading } = useAuth();
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
      const config = {
        withCredentials: true,
      };

      if (token && token !== 'USE_COOKIE_AUTH' && authMethod !== 'cookie') {
        config.headers = { Authorization: `Bearer ${token}` };
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

      // Refresh user data
      await refreshUser();

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
      <section className="py-20 bg-white text-black min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
      </section>
    );
  }

  return (
    <section className="py-20 bg-white text-black">
      <div className="flex justify-center items-center">
        <div className="flex w-full rounded-lg lg:w-[600px] mx-5 space-y-12 flex-wrap flex-col">

          <h1 className="text-[40px] lg:text-4xl font-bold leading-tight">
            Just a few more details
            <br />
          </h1>
          <p className="text-gray-600 text-lg -mt-8">
            We need this to personalize your experience.
          </p>

          <form className="grid grid-cols-1 space-y-7" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 space-y-6">

              {/* Phone Number */}
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  {...register("phone")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.phone ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <span className="block text-xs font-semibold text-gray-400 px-4 mb-[-4px]">Date of Birth</span>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 ${
                    errors.dateOfBirth ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              {/* Gender Select */}
              <div>
                <span className="block text-xs font-semibold text-gray-400 px-4 mb-[-4px]">Gender</span>
                <select
                  {...register("gender")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 ${
                    errors.gender ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                  defaultValue=""
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`w-full mt-4 p-4 font-bold text-lg rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 ${
                submitting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg transform hover:scale-[1.02]'
              }`}
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex justify-center items-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </div>
              ) : (
                'Save & Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CompleteBasicInfo;