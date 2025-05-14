import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
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

      console.log("Data being sent (axios):", apiData);
      
      const response = await axios.post(LOGIN_URL, apiData, {
        headers: {
          "Accept": "application/json",
        }
      });
      return response.data;
    },
    onSuccess: (responseData) => {
      if (responseData && responseData.access_token) {
        localStorage.setItem("token", responseData.access_token);
        localStorage.setItem("user", JSON.stringify(responseData.user));
        toast.success("Login Successful");
        navigate("/dashboard");
      } else {
        throw new Error(responseData.message || "Invalid response from server");
      }
    },
    onError: (error) => {
      console.error("Login error details (axios):", error);
      let errorMsg = "Login failed. Please check your credentials.";

      if (axios.isAxiosError(error) && error.response) {
        console.error("Server Error Response (axios):", error.response.data);
        const serverErrorData = error.response.data;
        errorMsg = serverErrorData.message || "An unknown server error occurred.";
        if (serverErrorData.errors && Object.keys(serverErrorData.errors).length > 0) {
          errorMsg += ": " + Object.values(serverErrorData.errors).map(errArray => errArray.join(', ')).join('; ');
        }
      } else if (error.request) {
        console.error("Network error (axios):", error.request);
        errorMsg = "Network error. Please check your connection.";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
      setLoginError(errorMsg);
    }
  });

  const onSubmit = (formData) => {
    setLoginError(null);
    login(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Textinput
        name="email"
        label="Email"
        defaultValue="admin@mail.com"
        type="email"
        register={register}
        error={errors.email}
        className="h-[48px]"
      />
      <Textinput
        name="password"
        label="Password"
        type="password"
        defaultValue=""
        register={register}
        error={errors.password}
        className="h-[48px]"
      />
      {loginError && (
        <div className="text-red-500 text-sm">{loginError}</div>
      )}
      <div className="flex justify-between">
        <Checkbox
          value={rememberMe}
          onChange={() => setRememberMe(!rememberMe)}
          label="Keep me signed in"
        />
        <Link
          to="/forgot-password"
          className="text-sm text-slate-800 dark:text-slate-400 leading-6 font-medium"
        >
          Forgot Password?
        </Link>
      </div>
      <Button
        type="submit"
        text="Sign in"
        className="btn btn-dark block w-full text-center"
        isLoading={isLoading}
      />
    </form>
  );
};

export default LoginForm;