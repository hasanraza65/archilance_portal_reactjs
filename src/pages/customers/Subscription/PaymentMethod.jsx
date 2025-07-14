import React, { useState } from 'react';
// You need to import Elements from @stripe/react-stripe-js as well
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

// Ensure this key is available in your .env file
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SubscriptionForm = ({ plans }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [planId, setPlanId] = useState(1); // Default to first plan
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (stripeError) {
        throw stripeError;
      }

      // 2. Send payment method ID to your Laravel backend
      const response = await axios.post('/api/subscriptions', {
        plan_id: planId,
        payment_method_id: paymentMethod.id
      }, {
        headers: {
          // FIX 1: Use backticks (`) for template literals
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      // 3. Confirm payment if needed
      if (response.data.requires_action) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          response.data.client_secret
        );

        if (confirmError) {
          throw confirmError;
        }
      }

      setSuccess(true);
    } catch (err) {
      // It's good practice to check for response errors from axios
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h2>Subscription Successful!</h2>
        <p>Your subscription has been activated.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h2>Subscribe to a Plan</h2>

      <div className="plan-selection">
        {plans.map(plan => (
          <label key={plan.id}>
            <input
              type="radio"
              name="plan"
              value={plan.id}
              checked={planId === plan.id}
              onChange={() => setPlanId(plan.id)}
            />
            {plan.name} - ${plan.price}/month
          </label>
        ))}
      </div>

      <div className="card-element">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={!stripe || loading}>
        {/* FIX 2: Use a template literal for the button text */}
        {loading ? 'Processing...' : `Subscribe for $${plans.find(p => p.id === planId)?.price}/month`}
      </button>
    </form>
  );
};


const SubscriptionPage = () => {
  // Mock plans - you should fetch these from your backend in a real app
  const plans = [
    { id: 1, name: 'Basic', price: 9.99 },
    { id: 2, name: 'Pro', price: 19.99 },
    { id: 3, name: 'Enterprise', price: 29.99 }
  ];

  return (
    <Elements stripe={stripePromise}>
      <SubscriptionForm plans={plans} />
    </Elements>
  );
};

export default SubscriptionPage;