import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput"; // Assuming this path is correct
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation, Link } from "react-router-dom"; // Added useLocation
import Checkbox from "@/components/ui/Checkbox"; // Assuming this path is correct
import Button from "@/components/ui/Button"; // Assuming this path is correct
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
  })
  .required();

const LOGIN_URL = "https://demo.aentora.com/backend/public/api/login";

const LoginForm = () => {
  const [loginError, setLoginError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // To get the state passed by ProtectedRoute

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange", // Or "onSubmit" or "onBlur" based on preference
  });

  const { mutate: login, isPending: isLoading } = useMutation({
    mutationFn: async (formData) => {
      const apiData = {
        login: formData.email,
        password: formData.password,
      };

      console.log("Data being sent to API:", apiData);

      const response = await axios.post(LOGIN_URL, apiData, {
        headers: {
          Accept: "application/json", // Standard header
          "Content-Type": "application/json", // Good practice to specify content type
        },
      });
      return response.data;
    },
    onSuccess: (responseData) => {
      if (responseData && responseData.access_token) {
        // --- Store token and user data in cookies ---
        const cookieOptions = {
          secure: process.env.NODE_ENV === 'production', // Only transmit over HTTPS in production
          sameSite: 'Lax', // CSRF protection. Consider 'Strict' for higher security if UX allows.
          // path: '/', // Optional: makes the cookie available across the entire domain
        };

        if (rememberMe) {
          cookieOptions.expires = 7; // Remember for 7 days
        }
        // If not rememberMe, it will be a session cookie (deleted when browser closes by default)

        Cookies.set("token", responseData.access_token, cookieOptions);
        if (responseData.user) {
          Cookies.set("user", JSON.stringify(responseData.user), cookieOptions);
        }
        // --- End of cookie storage ---

        toast.success("Login Successful");

        // Redirect to the page the user was trying to access, or dashboard by default
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });

      } else {
        // Handle cases where token might be missing even if API call was "successful" (status 2xx)
        const errorMessage = responseData.message || "Login failed: Invalid server response.";
        toast.error(errorMessage);
        setLoginError(errorMessage);
        // No need to throw error here if we're handling it with toast/setLoginError,
        // unless you have specific global error handling that relies on it.
      }
    },
    onError: (error) => {
      console.error("Login error details:", error);
      let errorMsg = "Login failed. Please check your credentials.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Server Error Response Data:", error.response.data);
          const serverErrorData = error.response.data;
          errorMsg = serverErrorData.message || `Server error: ${error.response.status}`;
          if (serverErrorData.errors && typeof serverErrorData.errors === 'object' && Object.keys(serverErrorData.errors).length > 0) {
            // Flatten errors if they are in an object like { email: ["message"], password: ["message"] }
            const specificErrors = Object.values(serverErrorData.errors)
              .map(errArray => Array.isArray(errArray) ? errArray.join(', ') : String(errArray))
              .join('; ');
            errorMsg += `: ${specificErrors}`;
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error("Network error (no response received):", error.request);
          errorMsg = "Network error. Please check your connection and try again.";
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Axios error (request setup):", error.message);
          errorMsg = `Request setup error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        // Non-Axios error (e.g., error thrown in mutationFn before axios call, or in onSuccess)
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
      setLoginError(errorMsg);
    },
  });

  const onSubmit = (formData) => {
    setLoginError(null); // Clear previous login errors
    login(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Textinput
        name="email"
        label="Email"
        defaultValue="admin@mail.com" // Consider removing for production or if not needed for testing
        type="email"
        register={register}
        error={errors.email}
        className="h-[48px]" // Ensure this class exists and styles appropriately
        placeholder="Enter your email"
      />
      <Textinput
        name="password"
        label="Password"
        type="password"
        defaultValue="" // Leave empty or use a test password if needed during development
        register={register}
        error={errors.password}
        className="h-[48px]" // Ensure this class exists and styles appropriately
        placeholder="Enter your password"
      />
      {loginError && (
        <div className="text-sm text-red-500 dark:text-red-400" role="alert"> {/* Added role="alert" for accessibility */}
          {loginError}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2"> {/* Added flex-wrap and gap for responsiveness */}
        <Checkbox
          value={rememberMe}
          onChange={() => setRememberMe(!rememberMe)}
          label="Keep me signed in"
        />
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
        >
          Forgot Password?
        </Link>
      </div>
      <Button
        type="submit"
        text="Sign in"
        className="btn btn-dark block w-full text-center"
        isLoading={isLoading}
        disabled={isLoading} // Disable button when loading
      />
    </form>
  );
};

export default LoginForm;