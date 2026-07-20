import React from "react";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
  })
  .required();

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const FORGOT_PASSWORD_URL = `${BACKEND_BASE_URL}/api/forgot-password`;

const ForgotPass = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const { mutate: sendRecoveryEmail, isPending: isLoading } = useMutation({
    mutationFn: async (formData) => {
      const response = await axios.post(FORGOT_PASSWORD_URL, {
        email: formData.email,
      });
      return response.data;
    },
    onSuccess: (responseData) => {
      toast.success(
        responseData?.message ||
          "A new temporary password has been sent to your email."
      );
      reset();
    },
    onError: (error) => {
      let errorMsg = "Could not send recovery email. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMsg =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    },
  });

  const onSubmit = (formData) => {
    sendRecoveryEmail(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
      <Textinput
        name="email"
        label="Email"
        type="email"
        register={register}
        error={errors.email}
        className="h-[48px]"
        placeholder="Enter your email address"
      />

      <Button
        type="submit"
        text="Send recovery email"
        className="btn btn-dark block w-full text-center"
        isLoading={isLoading}
        disabled={isLoading}
      />
    </form>
  );
};

export default ForgotPass;
