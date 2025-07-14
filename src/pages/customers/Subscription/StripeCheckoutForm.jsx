import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Icon (koi tabdeeli nahi)
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

/**
 * Reusable Checkout Form Component
 * @param {function} onSuccess - (async) Function to call with paymentMethodId on success. Should handle API calls.
 * @param {function} onCancel - Function to call when the cancel button is clicked.
 * @param {string} submitButtonText - Text for the submit button (e.g., "Pay", "Add Card").
 * @param {string} cancelButtonText - Text for the cancel button (e.g., "Back", "Cancel").
 */
const CheckoutForm = ({
  onSuccess,
  onCancel,
  submitButtonText = "Pay",
  cancelButtonText = "Back",
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null); // Clear previous errors

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (error) {
        // Stripe-side error (e.g., invalid card number)
        throw new Error(error.message);
      }

      // Call the parent's success handler with the new payment method ID.
      // The parent component is responsible for the API call and what happens next.
      if (onSuccess) {
        await onSuccess(paymentMethod.id);
      }
    } catch (err) {
      // Catches errors from Stripe or from the parent's onSuccess function (e.g., API failure)
      setMessage(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
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
        Enter Card Details
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
          onClick={onCancel}
          className="w-auto text-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition shadow-sm"
        >
          {cancelButtonText}
        </button>
        <button
          disabled={isProcessing || !stripe || !elements}
          id="submit"
          className="w-auto text-center px-8 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition shadow-sm disabled:opacity-50"
        >
          <span id="button-text">
            {isProcessing ? "Processing..." : submitButtonText}
          </span>
        </button>
      </div>

      {message && (
        <div
          id="payment-message"
          className="mt-4 text-red-500 text-sm font-medium"
        >
          {message}
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;
