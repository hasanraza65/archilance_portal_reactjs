import React, { useState, useEffect } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
  })
  .required();

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const LOGIN_URL = `${BACKEND_BASE_URL}/api/login`;

const LoginForm = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const { login: authLogin } = useAuth();

  useEffect(() => {
    const handleMessage = (event) => {
      const fcmToken = event.data;

      // Sirf yeh check karein ke data string hai aur khali nahi hai
      if (fcmToken && typeof fcmToken === 'string' && fcmToken.length > 20) {
        // Sirf ek final alert dikhayein
        alert(`FCM Token Received: ${fcmToken}`);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const { mutate: performLogin, isPending: isLoading } = useMutation({
    mutationFn: async (formData) => {
      const apiData = {
        login: formData.email,
        password: formData.password,
      };
      const response = await axios.post(LOGIN_URL, apiData);
      return response.data;
    },
    onSuccess: (responseData) => {
      const loggedInUser = authLogin(responseData, rememberMe);
      if (loggedInUser) {
        toast.success("Login Successful! Redirecting...");
      }
    },
    onError: (error) => {
      let errorMsg = "Login failed. Please check your credentials.";
      if (axios.isAxiosError(error) && error.response) {
        errorMsg =
          error.response.data.message ||
          `Server error: ${error.response.status}`;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    },
  });

  const onSubmit = (formData) => {
    performLogin(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Textinput
        name="email"
        label="Email"
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
        register={register}
        error={errors.password}
        className="h-[48px]"
        placeholder="Enter your password"
      />
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