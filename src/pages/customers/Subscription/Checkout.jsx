import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./StripeCheckoutForm";

// Icons
const CreditCardIcon = () => (
  <svg
    className="w-8 h-8 text-gray-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

// Correctly load the Stripe key for a VITE project
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const { plan, billingCycle } = location.state || {};
  const [clientSecret, setClientSecret] = useState("");
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
  const [promoCode, setPromoCode] = useState("");

  useEffect(() => {
    if (!plan) {
      navigate("/upgrade-plan");
    }
  }, [plan, navigate]);

  // ===================================================================
  // ===== TEMPORARY CODE FOR TESTING START ============================
  // ===================================================================
  // This useEffect mocks the backend call to generate a fake clientSecret.
  // This is why you see the 400 error, which is expected and correct for testing.
  useEffect(() => {
    if (step === 2 && !clientSecret) {
      console.log("TESTING MODE: Creating mock clientSecret...");
      const dummyClientSecret =
        "pi_1GszdG2eZvKYlo2CSB1f5s5g_secret_9n0zS3Y0Pz1B5c6e8G7h9j1K3";
      setTimeout(() => {
        setClientSecret(dummyClientSecret);
        console.log("TESTING MODE: Mock clientSecret has been set.");
      }, 1000);
    }
  }, [step, clientSecret]);
  // ===================================================================
  // ===== TEMPORARY CODE FOR TESTING END ==============================
  // ===================================================================

  /*
  // == REAL CODE (When your backend is ready, DELETE the testing code above and UNCOMMENT this) ==
  useEffect(() => {
    if (step === 2 && plan && !clientSecret) {
      const laravelApiEndpoint = "/api/create-payment-intent"; // Get this URL from your backend dev
      fetch(laravelApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(parseFloat(plan.price) * 100) }),
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("Error: Did not receive clientSecret from backend.");
        }
      })
      .catch(error => {
        console.error("Error fetching from backend:", error);
      });
    }
  }, [step, plan, clientSecret]);
  */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const subtotal = plan ? parseFloat(plan.price) : 0;
  const tax = 0;
  const total = subtotal + tax;
  const inputClasses =
    "block w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600 transition-shadow";
  const labelClasses = "block text-sm font-semibold text-gray-600 mb-2";

  const OrderSummary = () => (
    <div className="lg:col-span-1">
      <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-24">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Package Name</span>
            <span className="font-semibold text-gray-900">{plan?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">User Email</span>
            <span className="font-semibold text-gray-900 break-all">
              {formData.email || "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Billing Cycle</span>
            <span className="font-semibold text-gray-900">{billingCycle}</span>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cart Totals</h2>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold text-gray-900">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span className="font-semibold text-gray-900">
              ${tax.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Do you have a promo code?
          </label>
          <div className="mt-1 flex">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter coupon code"
            />
            <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded-r-md text-sm font-medium hover:bg-gray-300">
              Apply
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6"></div>
        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  if (!plan) return <div className="p-8 text-center">Loading...</div>;

  const appearance = { theme: "stripe" };
  const stripeOptions = { clientSecret, appearance };

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
                {clientSecret ? (
                  <Elements options={stripeOptions} stripe={stripePromise}>
                    <CheckoutForm onBack={() => setStep(1)} />
                  </Elements>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-gray-600 font-semibold">
                      Loading payment form...
                    </p>
                  </div>
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
