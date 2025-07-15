import React, { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./StripeCheckoutForm";

// --- Stripe Promise (Define outside component) ---
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// --- Icons and Child Components ---
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
const CardPlaceholderIcon = () => (
  <svg
    className="w-24 h-24 text-gray-300 mx-auto"
    fill="none"
    viewBox="0 0 56 40"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.5"
      y="0.5"
      width="55"
      height="39"
      rx="3.5"
      stroke="currentColor"
      strokeLinejoin="round"
    />
    <path d="M0.5 11.5H55.5" stroke="currentColor" />
    <rect
      x="6"
      y="27"
      width="16"
      height="4"
      rx="1"
      fill="currentColor"
      fillOpacity="0.5"
    />
  </svg>
);
const getCardLogo = (cardType) => {
  const type = cardType.toLowerCase();
  if (type.includes("visa"))
    return "/card-brands/visa.svg"; 
  if (type.includes("mastercard"))
    return "/card-brands/mastercard.svg";
  if (type.includes("jcb"))
    return "/card-brands/jcb.svg";
  if (type.includes("amex"))
    return "/card-brands/amex.svg";

  return "/card-brands/default.svg";
};
const NoCardsView = ({ setView }) => (
  <div className="text-center py-8">
    <CardPlaceholderIcon />
    <h3 className="mt-4 text-lg font-semibold text-gray-800">
      No card on file.
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Please add a credit card to continue.
    </p>
    <button
      onClick={() => setView("add")}
      className="mt-6 w-full bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-900 transition"
    >
      Add New Credit Card
    </button>
  </div>
);
const CardListView = ({
  cards,
  handleSetDefault,
  handleDeleteCard,
  setView,
}) => (
  <div>
    {cards.map((card) => (
      <div
        key={card.id}
        className="flex items-center justify-between p-4 mb-3 border rounded-lg hover:bg-gray-50"
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
            <p className="text-sm text-gray-500">Exp. date {card.expiry}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {card.isDefault ? (
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
              Default
            </span>
          ) : (
            <button
              onClick={() => handleSetDefault(card.id)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Set as Default
            </button>
          )}
          <button onClick={() => handleDeleteCard(card.id)}>
            <TrashIcon />
          </button>
        </div>
      </div>
    ))}
    <button
      onClick={() => setView("add")}
      className="mt-4 w-full border border-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-100 transition"
    >
      Add New Credit Card
    </button>
  </div>
);

// --- Main Modal Component ---
const ManageCardsModal = ({ isOpen, onClose }) => {
  const [view, setView] = useState("list");
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/customer/payment-method/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch payment methods.");
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
      setCards(formattedCards);
    } catch (err) {
      setError(err.message);
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCards();
    }
  }, [isOpen, fetchCards]);

  const handleDeleteCard = async (cardId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Authentication token not found.");

        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_BASE_URL
          }/api/customer/payment-method/delete/${cardId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to delete the card.");
        }

        Swal.fire("Deleted!", "The card has been removed.", "success");
        await fetchCards(); // Refresh the card list
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    }
  };

  const handleSetDefault = async (cardId) => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/customer/payment-method/set-default`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ payment_method_id: cardId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to set the default card.");
      }

      Swal.fire({
        icon: "success",
        title: "Card set as default!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      await fetchCards(); // Refresh the card list to show the new default
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleAttachCard = async (paymentMethodId) => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/customer/payment-method/attach`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ payment_method_id: paymentMethodId }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to attach the new card.");
      }

      Swal.fire(
        "Success!",
        "The new card has been added successfully.",
        "success"
      );
      await fetchCards();
      setView("list");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
      // We re-throw the error so the CheckoutForm can also catch it and re-enable the button
      throw err;
    }
  };

  const closeModal = () => {
    setView("list");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-50 p-4 pt-24">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: "80vh" }}
      >
        <div className="p-6 border-b sticky top-0 bg-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {view === "list"
                ? "Manage Payment Methods"
                : "Add Card"}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">Loading cards...</div>
          ) : error && cards.length === 0 ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : view === "list" ? (
            cards.length > 0 ? (
              <CardListView
                cards={cards}
                handleSetDefault={handleSetDefault}
                handleDeleteCard={handleDeleteCard}
                setView={setView}
              />
            ) : (
              <NoCardsView setView={setView} />
            )
          ) : (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                onSuccess={handleAttachCard}
                onCancel={() => setView("list")}
                submitButtonText="Add Card"
                cancelButtonText="Cancel"
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCardsModal;