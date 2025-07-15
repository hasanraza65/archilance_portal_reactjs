import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Icon Component ---
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


// --- FULLY UPDATED CheckoutForm Component ---
const CheckoutForm = ({
    onSuccess,
    onCancel,
    submitButtonText = "Submit",
    cancelButtonText = "Cancel"
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            toast.error("Stripe is not ready yet.");
            return;
        }

        setIsProcessing(true);

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
            // paymentMethod.id ko parent component ke हवाले karein
            await onSuccess(paymentMethod.id);
            // Kamyabi ke baad ki state parent component handle karega
        } catch (parentError) {
            // Agar parent ki API call fail hoti hai, to hum button ko re-enable karenge.
            console.error("Error from parent component:", parentError);
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
                    onClick={onCancel}
                    disabled={isProcessing}
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
        </form>
    );
};

export default CheckoutForm;