import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader } from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { isAuthenticated, redirectToProfile } from "../utils/auth";
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define validation schema using Zod
const formSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .min(1, "Password is required"),
  confirmPassword: z.string().min(1, "Confirm Password is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone Number must be 10 digits"),
  email: z.string().email("Invalid email address"),
  gender: z.string().min(1, "Please select your gender").pipe(
    z.enum(["male", "female", "other"], { errorMap: () => ({ message: "Please select a valid gender" }) })
  ),
  dob: z.string().min(1, "Date of Birth is required")
    .refine((dob) => {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 13;
    }, "You must be at least 13 years old to sign up"),
  nationality: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
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
      setTimeout(() => {
        redirectToProfile(navigate);
      }, 1000);
    }
  }, [navigate]);

  const [signuperror, setSignuperror] = useState();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const dobValue = watch("dob");
  const termsAcceptedValue = watch("termsAccepted");

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    // Map gender to match backend expectations
    const genderMap = {
      'male': 'male',
      'female': 'female', 
      'other': 'other'
    };

    try {
      // Attempt Registration with your backend
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: data.email.split('@')[0], // Generate username from email
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: genderMap[data.gender],
        dateOfBirth: data.dob,
        nationality: data.nationality,
      });

      // Registration successful, redirect to verification pending page
      const userEmail = registerResponse.data.data.user.email;
      toast.success('Registration successful! Please verify your email.');
      navigate(`/email-verification?email=${encodeURIComponent(userEmail)}`);
      
    } catch (registrationError) {
      const errorMessage = registrationError.response?.data?.message || 
                          registrationError.response?.data?.errors?.[0]?.msg || 
                          'Registration failed. Please try again.';
      toast.error(errorMessage);
      console.error('Signup failed:', registrationError);
      setSignuperror(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="px-6 py-12 lg:py-20 mx-auto max-w-[1400px] w-full bg-white text-black">
      <Toaster />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div className="flex flex-col space-y-3">
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            Glad to have you with us!
            <br />
            <span className="text-3xl lg:text-4xl font-semibold text-gray-700">
              We'd love to learn more about you.
            </span>
          </h1>
          <p className="text-lg font-medium text-gray-600">
            Required fields are marked with{" "}
            <span className="text-xl font-bold text-[#2ed6fd]">*</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
          {/* First Name */}
          <div>
            <label htmlFor="firstname" className="block text-lg font-semibold mb-1">
              First Name <span className="text-2xl text-[#2ed6fd]">*</span>
            </label>
            <input
              type="text"
              id="firstname"
              {...register("firstName")}
              className={`w-full text-lg font-medium outline-none py-4 border-b-2 bg-transparent transition-all duration-200 ${
                errors.firstName ? "border-red-500" : "border-gray-300 focus:border-black"
              }`}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500 mt-2 font-medium">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastname" className="block text-lg font-semibold mb-1">
              Last Name <span className="text-2xl text-[#2ed6fd]">*</span>
            </label>
            <input
              type="text"
              id="lastname"
              {...register("lastName")}
              className={`w-full text-lg font-medium outline-none py-4 border-b-2 bg-transparent transition-all duration-200 ${
                errors.lastName ? "border-red-500" : "border-gray-300 focus:border-black"
              }`}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500 mt-2 font-medium">{errors.lastName.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-lg font-semibold mb-1">
              Password <span className="text-2xl text-[#2ed6fd]">*</span>
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              className={`w-full text-lg font-medium outline-none py-4 border-b-2 bg-transparent transition-all duration-200 ${
                errors.password ? "border-red-500" : "border-gray-300 focus:border-black"
              }`}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-2 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-lg font-semibold mb-1">
              Confirm Password <span className="text-2xl text-[#2ed6fd]">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              {...register("confirmPassword")}
              className={`w-full text-lg font-medium outline-none py-4 border-b-2 bg-transparent transition-all duration-200 ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300 focus:border-black"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-2 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-lg font-semibold mb-1">
              Phone Number <span className="text-2xl text-[#2ed6fd]">*</span>
            </label>
            <input
              type="text"
              id="phone"
              {...register("phone")}
              className={`w-full text-lg font-medium outline-none py-4 border-b-2 bg-transparent transition-all duration-200 ${
                errors.phone ? "border-red-500" : "border-gray-300 focus:border-black"
              }`}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-2 font-medium">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-lg font-semibold mb-1">
              Email Address <span className="text-2xl text-[#2ed6fd]">*</span>
            </label>
            <input
              type="email"
              id="email"
              {...register("email")}
              className={`w-full text-lg font-medium outline-none py-4 border-b-2 bg-transparent transition-all duration-200 ${
                errors.email ? "border-red-500" : "border-gray-300 focus:border-black"
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-2 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-lg font-semibold mb-1">
              Gender <span className="text-2xl text-[#2ed6fd]">*</span>
            </label>
            <select
              id="gender"
              {...register("gender")}
              className="w-full text-lg font-medium outline-none py-4 border-b-2 border-gray-300 focus:border-black bg-transparent transition-all duration-200"
              defaultValue=""
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Non Binary</option>
            </select>
            {errors.gender && (
              <p className="text-sm text-red-500 mt-2 font-medium">{errors.gender.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="block text-lg font-semibold mb-1">
              Date of Birth <span className="text-2xl text-[#2ed6fd]">*</span>
            </label>
            <input
              type="date"
              id="dob"
              {...register("dob")}
              className={`w-full text-lg font-medium outline-none py-4 border-b-2 bg-transparent transition-all duration-200 ${
                errors.dob ? "border-red-500" : "border-gray-300 focus:border-black"
              } ${!dobValue ? "text-gray-400" : "text-black"}`}
              placeholder="dd/mm/yyyy"
            />
            {errors.dob && (
              <p className="text-sm text-red-500 mt-2 font-medium">{errors.dob.message}</p>
            )}
          </div>

          {/* Nationality */}
          <div>
            <label htmlFor="nationality" className="block text-lg font-semibold mb-1">
              Nationality
            </label>
            <select
              id="nationality"
              {...register("nationality")}
              className="w-full text-lg font-medium outline-none py-4 border-b-2 border-gray-300 focus:border-black bg-transparent transition-all duration-200"
            >
              <option value="" disabled>
                Select Nationality
              </option>
              <option value="nepali">Nepali</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="flex items-start mt-8 mb-2">
          <input
            type="checkbox"
            id="termsAccepted"
            {...register("termsAccepted")}
            className={`h-5 w-5 mt-0.5 text-black border-2 border-gray-300 rounded focus:ring-2 focus:ring-black cursor-pointer ${
              errors.termsAccepted ? "border-red-500" : ""
            }`}
          />
          <label htmlFor="termsAccepted" className="ml-3 block text-base font-medium text-gray-700">
            I agree to the{" "}
            <Link 
              to="/terms" 
              className="font-bold text-black hover:text-gray-700 underline transition-colors duration-200" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Terms and Conditions
            </Link>
            <span className="text-xl font-bold text-[#2ed6fd] ml-1">*</span>
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-sm text-red-500 mt-1 font-medium">{errors.termsAccepted.message}</p>
        )}

        {/* Submit Button */}
        <div className="flex justify-center lg:justify-start pt-6">
          <button
            type="submit"
            className={`py-4 text-lg font-bold px-24 rounded-2xl transition-all duration-200 ${
              isLoading || !termsAcceptedValue
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800 hover:shadow-lg transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            }`}
            disabled={isLoading || !termsAcceptedValue}
          >
            {isLoading ? (
              <div className="flex justify-center items-center">
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              'Register'
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Signup;