import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput"; 
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
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

// Get API URL from environment variable or use fallback
const API_URL = import.meta.env?.VITE_API_URL || window.env?.API_URL || "https://demo.aentora.com/backend/public/api";
const LOGIN_URL = `${API_URL}/login`;

const LoginForm = () => {
  const [loginError, setLoginError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
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
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: (responseData) => {
      if (responseData && responseData.access_token) {
        const cookieOptions = {
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'Lax',
        };

        if (rememberMe) {
          cookieOptions.expires = 7;
        }
       
        Cookies.set("token", responseData.access_token, cookieOptions);
        if (responseData.user) {
          Cookies.set("user", JSON.stringify(responseData.user), cookieOptions);
        }

        toast.success("Login Successful");
        
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        const errorMessage = responseData.message || "Login failed: Invalid server response.";
        toast.error(errorMessage);
        setLoginError(errorMessage);
      }
    },
    onError: (error) => {
      console.error("Login error details:", error);
      let errorMsg = "Login failed. Please check your credentials.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Server Error Response Data:", error.response.data);
          const serverErrorData = error.response.data;
          errorMsg = serverErrorData.message || `Server error: ${error.response.status}`;
          if (serverErrorData.errors && typeof serverErrorData.errors === 'object' && Object.keys(serverErrorData.errors).length > 0) {
            const specificErrors = Object.values(serverErrorData.errors)
              .map(errArray => Array.isArray(errArray) ? errArray.join(', ') : String(errArray))
              .join('; ');
            errorMsg += `: ${specificErrors}`;
          }
        } else if (error.request) {
          console.error("Network error (no response received):", error.request);
          errorMsg = "Network error. Please check your connection and try again.";
        } else {
          console.error("Axios error (request setup):", error.message);
          errorMsg = `Request setup error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
      setLoginError(errorMsg);
    },
  });

  const onSubmit = (formData) => {
    setLoginError(null);
    login(formData);
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-4"
   
    >
      <Textinput
        name="email"
        label="Email"
        defaultValue="admin@mail.com" 
        type="email"
        register={register}
        error={errors.email}
        className="h-[48px]" 
        placeholder="Enter your email"
      />
      <Textinput
        name="password"
        label="Password"
        type="password"
        defaultValue="" 
        register={register}
        error={errors.password}
        className="h-[48px]" 
        placeholder="Enter your password"
      />
      {loginError && (
        <div className="text-sm text-red-500 dark:text-red-400" role="alert"> 
          {loginError}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2"> 
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
        disabled={isLoading} 
      />
    </form>
  );
};

export default LoginForm;