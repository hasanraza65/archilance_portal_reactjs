import React, { useState } from "react";
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

// console.log("LOG: LoginForm.jsx file has been loaded.");
const fcmTokenFromFlutter = localStorage.getItem("fcm_token") || "";
const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
    fcm_token: yup.string().default(fcmTokenFromFlutter), 
  })
  .required();

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const LOGIN_URL = `${BACKEND_BASE_URL}/api/login`;

const LoginForm = () => {
  // console.log("LOG: LoginForm component is rendering.");
  const [rememberMe, setRememberMe] = useState(false);
  const { login: authLogin } = useAuth();

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
      // console.log("LOG: mutationFn called. Sending login request to backend.");
      // console.log("LOG: Login URL:", LOGIN_URL);
      // console.log("LOG: Login Data:", { login: formData.email, password: "ENCRYPTED" });
      const apiData = {
        login: formData.email,
        password: formData.password,
        fcm_token: fcmTokenFromFlutter, 
        
      };
      const response = await axios.post(LOGIN_URL, apiData);
      // console.log("LOG: Received successful response from login API.", response.data);
      return response.data;
    },
    onSuccess: (responseData) => {
      // console.log("LOG: Login onSuccess block has been entered.");
      const loggedInUser = authLogin(responseData, rememberMe);
      // console.log("LOG: authLogin function was called. User is now logged in.");

      if (loggedInUser) {
        toast.success("Login Successful! Redirecting...");
        // console.log("LOG: User is confirmed to be logged in. Now attempting to message Flutter.");

        if (window.AuthHandler && window.AuthHandler.postMessage) {
          // console.log("LOG: window.AuthHandler was found. Sending 'login_successful' message...");
          window.AuthHandler.postMessage("login_successful");
          // console.log("LOG: 'login_successful' message has been sent to Flutter.");
        } else {
          // console.error("ERROR: window.AuthHandler was NOT found. Cannot message Flutter. Is the app running in the correct webview environment?");
        }
      } else {
         console.error("ERROR: loggedInUser object is falsy after calling authLogin.");
      }
    },
    onError: (error) => {
      console.error("ERROR: Login API call failed.");
      if (error.response) {
        // console.error("ERROR DETAILS: Server responded with an error.", error.response.data);
      } else {
        // console.error("ERROR DETAILS: A network or other error occurred.", error.message);
      }
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
    // console.log("LOG: Form submitted with data:", { email: formData.email, password: "ENCRYPTED" });
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