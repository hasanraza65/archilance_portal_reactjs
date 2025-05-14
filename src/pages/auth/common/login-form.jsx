import React, { useState, useEffect } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "@/store/api/auth/authApiSlice";
import { setUser } from "@/store/api/auth/authSlice";
import { toast } from "react-toastify";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
  })
  .required();

const LoginForm = () => {
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch();
  
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);

  // Display error message if there's an API error
  useEffect(() => {
    if (error) {
      console.error("Login error:", error);
      setLoginError(error.message || "Login failed. Please check your credentials.");
    }
  }, [error]);

  const onSubmit = async (data) => {
    try {
      setLoginError(null);
      const response = await login(data);
      
      // Check for error in response
      if (response.error) {
        throw new Error(response.error.data?.message || "Login failed");
      }
      
      // If successful, extract data
      const userData = response.data;
      
      if (userData && userData.access_token) {
        // Store token
        localStorage.setItem("token", userData.access_token);
        
        // Store user data
        localStorage.setItem("user", JSON.stringify(userData.user));
        
        // Update Redux state
        dispatch(setUser(userData.user));
        
        toast.success("Login Successful");
        navigate("/dashboard");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      const errorMsg = error.message || "Login failed";
      toast.error(errorMsg);
      setLoginError(errorMsg);
    }
  };

  const [rememberMe, setRememberMe] = useState(false);

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