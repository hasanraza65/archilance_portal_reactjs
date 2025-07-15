import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./StripeCheckoutForm"; // Your existing Stripe form
import Cookies from "js-cookie";
import Swal from "sweetalert2";

// --- Load Stripe Key (Best practice: define outside the component) ---
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ===================================================================
// ===== Helper Icons & Components
// ===================================================================

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-500 hover:text-red-600"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const getCardLogo = (cardType) => {
  const type = (cardType || "").toLowerCase();
  if (type.includes("visa")) return "/card-brands/visa.svg";
  if (type.includes("mastercard")) return "/card-brands/mastercard.svg";
  if (type.includes("jcb")) return "/card-brands/jcb.svg";
  if (type.includes("amex")) return "/card-brands/amex.svg";
  return "/card-brands/default.svg";
};

// ===================================================================
// ===== Main Checkout Component
// ===================================================================

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- State Management ---
  // IMPORTANT: Ensure the `plan` object you pass in `location.state` includes the plan's ID.
  // For example: navigate('/checkout', { state: { plan: { id: 12, name: 'Standard', price: '2500.00' }, billingCycle: 'Monthly' } })
  const { plan, billingCycle } = location.state || {};

  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentView, setPaymentView] = useState("list");
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    zip: "",
    city: "",
    state: "",
    country: "Canada",
  });

  // --- Redirection and Initial Setup ---
  useEffect(() => {
    if (!plan) {
      navigate("/upgrade-plan");
    }
  }, [plan, navigate]);

  // --- API Call to Fetch Saved Cards ---
  const fetchCards = useCallback(async () => {
    setIsLoadingCards(true);
    setApiError(null);
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");
      const response = await fetch(
        "https://demo.aentora.com/backend/public/api/customer/payment-method/list",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Could not fetch your saved cards.");
      const apiData = await response.json();
      const formattedCards = apiData.map((card) => ({
        id: card.id,
        type: card.brand,
        last4: card.last4,
        expiry: `${String(card.exp_month).padStart(2, "0")}/${String(
          card.exp_year
        ).slice(-2)}`,
        isDefault: card.is_default,
      }));
      setSavedCards(formattedCards);
      if (formattedCards.length === 0) {
        setPaymentView("add");
      } else {
        const defaultCard = formattedCards.find((c) => c.isDefault);
        setSelectedCardId(defaultCard ? defaultCard.id : formattedCards[0].id);
        setPaymentView("list");
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2) fetchCards();
  }, [step, fetchCards]);

  // --- API Call to Create a Payment Intent (for adding a new card) ---
  useEffect(() => {
    if (step === 2 && paymentView === "add" && !clientSecret) {
      const dummyClientSecret =
        "pi_1GszdG2eZvKYlo2CSB1f5s5g_secret_9n0zS3Y0Pz1B5c6e8G7h9j1K3"; // Using mock for testing
      setTimeout(() => setClientSecret(dummyClientSecret), 500);
    }
  }, [step, paymentView, clientSecret]);

  // --- Payment Execution ---
  const executeSubscriptionCreation = async (paymentMethodId) => {
    // **ERROR FIX**: Check for all required information before making the API call.
    if (!plan?.id) {
      Swal.fire(
        "Error",
        "The Plan ID is missing. Please go back and select a plan again.",
        "error"
      );
      setIsProcessingPayment(false);
      return;
    }
    if (!billingCycle) {
      Swal.fire(
        "Error",
        "Billing cycle is not specified. Please try again.",
        "error"
      );
      setIsProcessingPayment(false);
      return;
    }
    if (!paymentMethodId) {
      Swal.fire(
        "Error",
        "Payment method is not specified. Please try again.",
        "error"
      );
      setIsProcessingPayment(false);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(
        "https://demo.aentora.com/backend/public/api/customer/subscription/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            plan_id: plan.id,
            billing_cycle: billingCycle,
            payment_method_id: paymentMethodId,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message || "An error occurred while creating the subscription."
        );

      Swal.fire({
        title: "Payment Successful!",
        text: "Your subscription has been activated.",
        icon: "success",
      });
      navigate("/subscriptions"); // Navigate to a relevant success page
    } catch (err) {
      Swal.fire("Payment Failed", err.message, "error");
      throw err;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentWithSavedCard = () => {
    if (selectedCardId) executeSubscriptionCreation(selectedCardId);
  };

  const handlePayWithNewCard = (newPaymentMethodId) => {
    executeSubscriptionCreation(newPaymentMethodId);
  };

  // Other card handlers (delete, set default) remain the same
  const handleDeleteCard = async (cardId) => {
    // ... (no changes to this function)
  };
  const handleSetDefault = async (cardId) => {
    // ... (no changes to this function)
  };

  // --- Form and UI Variables ---
  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const subtotal = plan ? parseFloat(plan.price) : 0;
  const total = subtotal;
  const inputClasses =
    "block w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600 transition-shadow";
  const labelClasses = "block text-sm font-semibold text-gray-600 mb-2";

  // --- Render Functions ---
  const OrderSummary = () => (
    <div className="lg:col-span-1">
      <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-24">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Package</span>
            <span className="font-semibold text-gray-900">{plan?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email</span>
            <span className="font-semibold text-gray-900 break-all">
              {formData.email || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Billing</span>
            <span className="font-semibold text-gray-900">{billingCycle}</span>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6"></div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold text-gray-900">
              ${subtotal.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6"></div>
        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        {/* The main pay button has been moved out of the summary for better UX */}
      </div>
    </div>
  );

  const SavedCardListView = () => (
    <div>
      <div className="space-y-3">
        {savedCards.map((card) => (
          <div
            key={card.id}
            onClick={() => setSelectedCardId(card.id)}
            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
              selectedCardId === card.id
                ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <img
                src={getCardLogo(card.type)}
                alt={card.type}
                className="w-10 mr-4"
              />
              <div>
                <p className="font-semibold text-gray-800 capitalize">
                  {card.type} ending in {card.last4}
                </p>
                <p className="text-sm text-gray-500">Exp. {card.expiry}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {card.isDefault ? (
                <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Default
                </span>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(card.id);
                  }}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Set as Default
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCard(card.id);
                }}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* --- UI CHANGE: New Button Layout --- */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handlePaymentWithSavedCard}
          className="w-full text-center px-6 py-3 bg-gray-800 text-white rounded-lg text-base font-semibold hover:bg-gray-900 transition shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!selectedCardId || isProcessingPayment}
        >
          {isProcessingPayment ? "Processing..." : `Pay with Selected Card`}
        </button>
        <button
          onClick={() => setPaymentView("add")}
          className="w-full text-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
        >
          Pay with a New Card
        </button>
      </div>
    </div>
  );

  const AddNewCardView = () => {
    if (!clientSecret)
      return (
        <div className="text-center py-20">
          <p className="text-gray-600 font-semibold">
            Initializing secure payment form...
          </p>
        </div>
      );
    return (
      <Elements
        options={{ clientSecret, appearance: { theme: "stripe" } }}
        stripe={stripePromise}
      >
        <CheckoutForm
          onSuccess={handlePayWithNewCard}
          onCancel={savedCards.length > 0 ? () => setPaymentView("list") : null}
          submitButtonText={
            isProcessingPayment ? "Processing..." : `Pay $${total.toFixed(2)}`
          }
          cancelButtonText={savedCards.length > 0 ? "Use a Saved Card" : null}
          isProcessing={isProcessingPayment}
        />
      </Elements>
    );
  };

  // --- Main Render ---
  if (!plan) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
          Billing
        </h1>
        <div className="flex items-center mb-10">
          <div
            className={`flex items-center ${
              step >= 1 ? "text-green-600" : "text-gray-500"
            }`}
          >
            <span
              className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                step >= 1
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </span>
            <span className="ml-4 font-semibold text-lg">
              Billing Information
            </span>
          </div>
          <div
            className={`flex-1 border-t-2 mx-4 ${
              step > 1 ? "border-green-600" : "border-gray-200"
            }`}
          ></div>
          <div
            className={`flex items-center ${
              step >= 2 ? "text-green-600" : "text-gray-500"
            }`}
          >
            <span
              className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                step >= 2
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </span>
            <span className="ml-4 font-semibold text-lg">Payment Details</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {step === 1 && (
            <>
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClasses}>
                        First name <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>
                        Last name <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClasses}>
                        Email address{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>
                        Phone Number{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>
                      Company name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>
                      Street Address{" "}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={inputClasses}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className={labelClasses}>
                        City <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>
                        State / Province{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>
                        ZIP / Postcode{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>
                      Country <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={inputClasses}
                    >
                      <option>Canada</option>
                      <option>United States</option>
                      <option>Pakistan</option>
                    </select>
                  </div>
                </form>
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="w-auto text-center px-8 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
              <OrderSummary />
            </>
          )}
          {step === 2 && (
            <>
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {paymentView === "list"
                      ? "Choose a Payment Method"
                      : "Pay with New Card"}
                  </h3>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Billing Info
                  </button>
                </div>
                {isLoadingCards ? (
                  <div className="text-center py-20">
                    <p className="text-gray-600 font-semibold">
                      Loading your cards...
                    </p>
                  </div>
                ) : apiError ? (
                  <div className="text-center py-20 text-red-600">
                    {apiError}
                  </div>
                ) : paymentView === "list" && savedCards.length > 0 ? (
                  <SavedCardListView />
                ) : (
                  <AddNewCardView />
                )}
              </div>
              <OrderSummary />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
