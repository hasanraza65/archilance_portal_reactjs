import React, { useState } from "react";
import {
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Cookies from "js-cookie";
import { toast } from 'react-toastify'; // react-toastify ko import karein
import 'react-toastify/dist/ReactToastify.css'; // Toast ke styles ko import karein

// (CreditCardIcon component yahan mojood hai... usay change nahi kiya)
const CreditCardIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );

const CheckoutForm = ({ onBack }) => {
  const stripe = useStripe();
  const elements = useElements();

  // message state ki ab zaroorat nahi hai
  // const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      setIsProcessing(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
    });

    if (error) {
      toast.error(error.message);
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch(
        "https://demo.aentora.com/backend/public/api/customer/subscription/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_id: 1,
            payment_method_id: paymentMethod.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // ---- YEH HISSA UPDATE KIYA GAYA HAI ----
        // Ab error toast mein dikhaya jayega
        const errorMessage = result.error || result.message || `An unexpected error occurred (Status: ${response.status}).`;
        toast.error(errorMessage);
      } else {
        // ---- YEH HISSA BHI UPDATE KIYA GAYA HAI ----
        // Kamyabi ka message toast mein dikhaya jayega
        console.log("API Response:", result);
        toast.success("Subscription created successfully!");
        // Yahan aap user ko success page per redirect kar saktay hain
        // onBack(); // Ya shayad pichlay step per wapis le jayein
      }
    } catch (apiError) {
      console.error("API Call Error:", apiError);
      toast.error("Failed to connect to the server. Please try again later.");
    }

    setIsProcessing(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Payment Details
      </h3>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Card information
        </label>
        <div className="flex items-center p-4 border border-gray-300 bg-gray-50 rounded-lg shadow-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-200 transition-shadow">
          <CreditCardIcon />
          <div className="flex-1 ml-4">
            <CardElement id="card-element" options={cardElementOptions} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={onBack}
          className="w-auto text-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition shadow-sm"
        >
          Back
        </button>
        <button
          disabled={isProcessing || !stripe || !elements}
          id="submit"
          className="w-auto text-center px-8 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition shadow-sm disabled:opacity-50"
        >
          <span id="button-text">
            {isProcessing ? "Processing..." : "Pay"}
          </span>
        </button>
      </div>

      {/* Is hissay ki ab zaroorat nahi, kyunke hum toasts istemal kar rahe hain */}
      {/* {message && (
        <div id="payment-message" className="mt-4 text-red-500 text-sm font-medium">
          {message}
        </div>
      )} */}
    </form>
  );
};

export default CheckoutForm;