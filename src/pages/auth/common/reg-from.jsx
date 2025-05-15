import React, { useState } from "react";
import { toast } from "react-toastify";
import Textinput from "@/components/ui/Textinput"; // Assuming this path is correct
import Button from "@/components/ui/Button";       // Assuming this path is correct
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";   // Assuming this path is correct
import axios from "axios";
import { useMutation } from "@tanstack/react-query"; // Correct import for TanStack Query v4/v5

// Updated schema with all required fields
const schema = yup
  .object({
    name: yup.string().required("Name is Required"),
    email: yup.string().email("Invalid email").required("Email is Required"),
    username: yup.string().required("Username is Required"),
    phone: yup
      .string()
      .required("Phone is Required")
      .matches(/^[0-9+()-]*$/, "Phone number can only contain digits, +, (, ), -") // More flexible phone regex
      .min(10, "Phone number must be at least 10 characters")
      .max(15, "Phone number must be at most 15 characters"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters") // Your schema said 6, API might require 8
      .max(20, "Password shouldn't be more than 20 characters")
      .required("Please enter password"),
    password_confirmation: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Please confirm your password"),
  })
  .required();

// API registration function
const registerUserFn = async (userData) => {
  console.log("🚀 ~ registerUserFn ~ userData to be sent to API:", userData); // Log data before API call
  const response = await axios.post(
    "https://demo.aentora.com/backend/public/api/register",
    userData
  );
  console.log("🚀 ~ registerUserFn ~ API raw response:", response); // Log raw API response
  return response.data; // Return only response.data
};

const RegForm = () => {
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  // Using TanStack Query's useMutation
  const { mutate, isLoading } = useMutation({
    mutationFn: registerUserFn,
    onSuccess: (data) => {
      console.log("🚀 ~ onSuccess ~ API success data:", data); // Log successful API response data
      toast.success(data.message || "Registration Successful!"); // Use message from API if available
      reset();
      navigate("/"); // Or to a login page: navigate("/login");
    },
    onError: (error) => {
      console.error("🚀 ~ onError ~ API error object:", error); // Log the full error object
      console.error("🚀 ~ onError ~ API error response data:", error.response?.data); // Log specific response data if available

      let displayErrorMessage = "An error occurred. Please try again later.";

      if (error.response && error.response.data) {
        const responseData = error.response.data;
        if (responseData.message) {
          displayErrorMessage = responseData.message; // Use the main message from API
        }
        // Check for specific field errors if your API returns them in a nested 'errors' object
        if (responseData.errors) {
          const fieldErrors = Object.values(responseData.errors).flat().join(" ");
          if (fieldErrors) {
            displayErrorMessage = fieldErrors; // Display concatenated field errors
          }
        }
      }

      // More specific checks based on common API error messages
      if (displayErrorMessage.toLowerCase().includes("email has already been taken")) {
        toast.error("This email is already registered.");
      } else if (displayErrorMessage.toLowerCase().includes("username has already been taken")) {
        toast.error("This username is already taken.");
      } else {
        toast.error(displayErrorMessage); // Show the processed or generic error message
      }
    },
  });

  const onSubmit = (data) => {
    console.log("🚀 ~ onSubmit ~ Form data:", data); // Log form data on submit
    if (!checked) {
      toast.error("Please accept Terms and Conditions and Privacy Policy.");
      return;
    }
    mutate(data);
  };

  // Log form errors for debugging
  // console.log("🚀 ~ RegForm ~ Form validation errors:", errors);

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
        type="tel" // Use 'tel' for better mobile UX
        placeholder="Enter your phone number"
        register={register}
        error={errors.phone}
        className="h-[48px]"
      />

      <Textinput
        name="password"
        label="Password"
        type="password"
        placeholder="Enter your password (min. 6 characters)"
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
        disabled={isLoading} // Explicitly disable button when loading
      />
    </form>
  );
};

export default RegForm;