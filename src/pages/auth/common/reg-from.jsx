import React, { useState } from "react";
import { toast } from "react-toastify";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

// Updated schema with all required fields
// !!! IMPORTANT: Check API requirements for password length.
// If API requires 8 characters, change min(6) to min(8) below.
const schema = yup
  .object({
    name: yup.string().required("Name is Required"),
    email: yup.string().email("Invalid email").required("Email is Required"),
    username: yup.string().required("Username is Required"),
    phone: yup
      .string()
      .required("Phone is Required")
      .matches(/^[0-9+()-]*$/, "Phone number can only contain digits, +, (, ), -")
      .min(10, "Phone number must be at least 10 characters")
      .max(15, "Phone number must be at most 15 characters"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters") //  <-- API MIGHT REQUIRE 8. Check error.response.data.errors for password field.
      .max(20, "Password shouldn't be more than 20 characters")
      .required("Please enter password"),
    password_confirmation: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Please confirm your password"),
  })
  .required();


const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || DEFAULT_BACKEND_URL;


const API_BASE_URL_FOR_API_CALLS = `${BACKEND_BASE_URL}/api`;

const REGISTER_API_URL = `${API_BASE_URL_FOR_API_CALLS}/register`; 

const registerUserFn = async (userData) => {
  // console.log("🚀 ~ registerUserFn ~ userData to be sent to API:", userData);
  const response = await axios.post(
    REGISTER_API_URL, 
    userData,
    { 
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }
  );
  // console.log("🚀 ~ registerUserFn ~ API raw response:", response);
  return response.data;
};
const RegForm = () => {
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate(); 
  const {
    register,
    formState: { errors },
    handleSubmit,
    setError,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: registerUserFn,
    onSuccess: (data) => {
      // console.log("🚀 ~ onSuccess ~ API success data:", data);
      toast.success(data.message || "Registration Successful! Redirecting to login...");
      reset(); 

      setTimeout(() => {
        navigate("/login"); 
      }, 1500);
    },
    onError: (error) => {
      console.error("🚀 ~ onError ~ API error object:", error);

      if (error.response && error.response.data) {
        const responseData = error.response.data;
        console.error("🚀 ~ onError ~ API error response data:", responseData);

        if (responseData.errors && typeof responseData.errors === 'object') {
          let specificErrorSet = false;
          Object.keys(responseData.errors).forEach((fieldKey) => {
            const messages = responseData.errors[fieldKey];
            const message = Array.isArray(messages) ? messages.join(" ") : messages;

            if (["name", "email", "username", "phone", "password", "password_confirmation"].includes(fieldKey)) {
              setError(fieldKey, {
                type: "server",
                message: message,
              });
              specificErrorSet = true;
            } else {
              toast.error(`${fieldKey}: ${message}`);
            }
          });

          if (specificErrorSet) {
            toast.error(responseData.message || "Please correct the errors highlighted in the form.");
          } else if(responseData.message) {
            toast.error(responseData.message);
          } else {
            toast.error("Validation failed. Please check form details.");
          }
        }
        else if (responseData.message) {
          let displayErrorMessage = responseData.message;
          if (displayErrorMessage.toLowerCase().includes("email has already been taken")) {
            setError("email", { type: "server", message: "This email is already registered." });
            toast.error("This email is already registered.");
          } else if (displayErrorMessage.toLowerCase().includes("username has already been taken")) {
             setError("username", { type: "server", message: "This username is already taken." });
            toast.error("This username is already taken.");
          } else {
            toast.error(displayErrorMessage);
          }
        }
        else {
          toast.error("An unknown validation error occurred. Please check your input.");
        }
      }
      else {
        toast.error(error.message || "A network error occurred. Please try again.");
      }
    },
  });

  const onSubmit = (data) => {
    // console.log("🚀 ~ onSubmit ~ Form data (after yup validation):", data);
    if (!checked) {
      toast.error("Please accept Terms and Conditions and Privacy Policy.");
      return;
    }
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Textinput
        name="name"
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        register={register}
        error={errors.name}
        className="h-[48px]"
      />
      <Textinput
        name="email"
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        register={register}
        error={errors.email}
        className="h-[48px]"
      />
      <Textinput
        name="username"
        label="Username"
        type="text"
        placeholder="Choose a username"
        register={register}
        error={errors.username}
        className="h-[48px]"
      />
      <Textinput
        name="phone"
        label="Phone Number"
        type="tel"
        placeholder="Enter your phone number"
        register={register}
        error={errors.phone}
        className="h-[48px]"
      />
      <Textinput
        name="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        register={register}
        error={errors.password}
        className="h-[48px]"
      />
      <Textinput
        name="password_confirmation"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        register={register}
        error={errors.password_confirmation}
        className="h-[48px]"
      />
      <Checkbox
        label="You accept our Terms and Conditions and Privacy Policy"
        value={checked}
        onChange={() => setChecked(!checked)}
      />
      <Button
        type="submit"
        text="Create an account"
        className="btn btn-dark block w-full text-center"
        isLoading={isLoading}
        disabled={isLoading}
      />
    </form>
  );
};

export default RegForm;