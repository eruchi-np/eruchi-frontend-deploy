import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { isAuthenticated, redirectToProfile } from "../utils/auth";
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Form schema remains unchanged to match backend expectations
const formSchema = z.object({
  firstName: z.string().min(2, "First Name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last Name must be at least 2 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm Password is required"),
  phone: z.string().regex(/^\+?\d{9,15}$/, "Phone Number must be valid (9–15 digits, optional +)"),
  email: z.string().email("Invalid email address"),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], {
    required_error: "Please select your gender",
  }),
  dob: z.string().min(1, "Date of Birth is required").refine((val) => {
    const birth = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 13;
  }, "You must be at least 13 years old"),
  nationality: z.enum(["Nepali", "Other"]).optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Signup = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated()) {
      toast.error("You're already logged in. Back to Profile!");
      setTimeout(() => redirectToProfile(navigate), 1000);
    }
  }, [navigate]);

  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const termsAcceptedValue = watch("termsAccepted");

  const onSubmit = async (data) => {
    setIsLoading(true);

    // Generate valid username: alphanumeric only, 3–30 chars
    const emailPrefix = data.email.split('@')[0];
    const safeUsername = emailPrefix
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 30)
      .padEnd(3, '0');

    try {
      const payload = {
        username: safeUsername,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dob,
        nationality: data.nationality || null,
      };

      console.log("[DEBUG] Sending registration payload:", payload);

      const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
      const userEmail = response.data.data.user.email;
      toast.success('Registration successful! Please verify your email.');
      navigate(`/email-verification?email=${encodeURIComponent(userEmail)}`);
      
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Registration failed. Please try again.';

      if (errorData?.errors) {
        errorMessage = errorData.errors.map(e => e.msg).join(', ');
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }

      toast.error(errorMessage);
      console.error('Signup failed:', err, errorData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 bg-white text-black">
      <div className="flex justify-center items-center">
        <div className="flex w-full rounded-lg lg:w-[600px] mx-5 space-y-12 flex-wrap flex-col">
          
          {/* Header section matching login typography */}
          <h1 className="text-[40px] lg:text-4xl font-bold leading-tight">
            Glad to have you with us!
            <br />
          </h1>

          <form className="grid grid-cols-1 space-y-7" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 space-y-6">
              
              {/* First Name */}
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  {...register("firstName")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.firstName ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  {...register("lastName")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.lastName ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  {...register("email")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.email ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.email.message}
                  </p>
                )}
              </div>

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

              {/* Password */}
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  {...register("password")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.password ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  {...register("confirmPassword")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Gender Select */}
              <div>
                <span className="block text-xs font-semibold text-gray-400 px-4 mb-[-4px]">Gender</span>
                <select
                  id="gender"
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

              {/* Date of Birth */}
              <div>
                <span className="block text-xs font-semibold text-gray-400 px-4 mb-[-4px]">Date of Birth</span>
                <input
                  type="date"
                  id="dob"
                  {...register("dob")}
                  className={`w-full text-lg font-medium outline-none p-4 border-b-2 bg-transparent transition-all duration-200 ${
                    errors.dob ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.dob && (
                  <p className="text-sm text-red-500 mt-2 font-medium px-4">
                    {errors.dob.message}
                  </p>
                )}
              </div>

              {/* Nationality Select */}
              <div>
                <span className="block text-xs font-semibold text-gray-400 px-4 mb-[-4px]">Nationality</span>
                <select
                  id="nationality"
                  {...register("nationality")}
                  className="w-full text-lg font-medium outline-none p-4 border-b-2 border-gray-300 focus:border-black bg-transparent transition-all duration-200 text-black"
                  defaultValue=""
                >
                  <option value="">Select Nationality</option>
                  <option value="Nepali">Nepali</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex flex-col space-y-2 pt-2 px-2">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  {...register("termsAccepted")}
                  className={`h-5 w-5 mt-0.5 text-black border-2 border-gray-300 rounded focus:ring-2 focus:ring-black cursor-pointer ${
                    errors.termsAccepted ? "border-red-500" : ""
                  }`}
                />
                <label htmlFor="termsAccepted" className="ml-3 block text-base font-medium text-gray-600">
                  I agree to the{" "}
                  <Link 
                    to="/terms" 
                    className="font-semibold text-black hover:text-gray-700 underline transition-colors duration-200" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Terms and Conditions
                  </Link>
                </label>
              </div>
              {errors.termsAccepted && (
                <p className="text-sm text-red-500 font-medium pt-1">
                  {errors.termsAccepted.message}
                </p>
              )}
            </div>

            {/* Inline Navigation Context Link */}
            <div className="w-full flex justify-end text-gray-600 px-2">
              <Link 
                to="/login" 
                className="font-semibold hover:text-black transition-colors duration-200 underline decoration-gray-400 hover:decoration-black"
              >
                Already have an account?
              </Link>
            </div>

            {/* Submit button matching Login styling perfectly */}
            <button
              type="submit"
              className={`w-full mt-4 p-4 font-bold text-lg rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 ${
                isLoading || !termsAcceptedValue
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg transform hover:scale-[1.02]'
              }`}
              disabled={isLoading || !termsAcceptedValue}
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                'Register'
              )}
            </button>
          </form>
        </div>
        <Toaster />
      </div>
    </section>
  );
};

export default Signup;