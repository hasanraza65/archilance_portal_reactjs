import React, { useState } from "react";

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
    return "/src/assets/images/svg/card-brands/visa.svg";
  if (type.includes("mastercard"))
    return "/src/assets/images/svg/card-brands/mastercard.svg";
  if (type.includes("amex") || type.includes("american express"))
    return "/src/assets/images/svg/card-brands/amex.svg";
  return "/src/assets/images/svg/card-brands/visa.svg";
};

const NoCardsView = ({ setView }) => (
  <div className="text-center">
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
            <p className="font-semibold text-gray-800">
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

const AddCardView = ({ newCard, handleInputChange, handleAddCard }) => (
  <form onSubmit={handleAddCard}>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Card Holder Name
        </label>
        <input
          type="text"
          name="name"
          value={newCard.name}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Card Number
        </label>
        <input
          type="text"
          name="number"
          placeholder="0000 0000 0000 0000"
          value={newCard.number}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Expiry Date
          </label>
          <input
            type="text"
            name="expiry"
            placeholder="MM/YY"
            value={newCard.expiry}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">CVC</label>
          <input
            type="text"
            name="cvc"
            placeholder="CVC"
            value={newCard.cvc}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
      </div>
      <div className="flex justify-center items-center gap-2 pt-2">
        <img
          src="/src/assets/images/svg/card-brands/visa.svg"
          alt="Visa"
          className="h-6"
        />
        <img
          src="/src/assets/images/svg/card-brands/mastercard.svg"
          alt="Mastercard"
          className="h-6"
        />
        <img
          src="/src/assets/images/svg/card-brands/amex.svg"
          alt="American Express"
          className="h-6"
        />
        <img
          src="/src/assets/images/svg/card-brands/discover.svg"
          alt="Discover"
          className="h-6"
        />
      </div>
    </div>
    <div className="mt-6">
      <button
        type="submit"
        className="w-full bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-900 transition"
      >
        Add Credit Card
      </button>
    </div>
  </form>
);

// --- Main Modal Component (No change in logic, only in rendering) ---
const ManageCardsModal = ({ isOpen, onClose, cards, setCards }) => {
  const [view, setView] = useState("list");
  // --- YAHAN TABDEELI KI GAI HAI (Step 2) ---
  // Initial state mein name ko khali rakhein taake placeholder dikhe
  const [newCard, setNewCard] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });

  if (!isOpen) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCard((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCard.name || !newCard.number || !newCard.expiry || !newCard.cvc) {
      alert("Please fill all the fields.");
      return;
    }
    const newCardData = {
      id: Date.now(),
      type: newCard.number.startsWith("4") ? "Visa" : "Mastercard",
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      isDefault: cards.length === 0,
    };
    setCards((prev) => [...prev, newCardData]);
    setNewCard({ name: "", number: "", expiry: "", cvc: "" });
    setView("list");
  };

  const handleDeleteCard = (cardId) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const handleSetDefault = (cardId) => {
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        isDefault: card.id === cardId,
      }))
    );
  };

  const closeModal = () => {
    setView("list");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
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
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {view === "list"
              ? "Manage Credit Cards"
              : "New Credit Card Details"}
          </h2>
        </div>

        {/* --- YAHAN TABDEELI KI GAI HAI (Step 3) --- */}
        {/* Ab hum props ke zariye state aur functions pass kar rahe hain */}
        {view === "list" &&
          (cards.length > 0 ? (
            <CardListView
              cards={cards}
              handleSetDefault={handleSetDefault}
              handleDeleteCard={handleDeleteCard}
              setView={setView}
            />
          ) : (
            <NoCardsView setView={setView} />
          ))}
        {view === "add" && (
          <AddCardView
            newCard={newCard}
            handleInputChange={handleInputChange}
            handleAddCard={handleAddCard}
          />
        )}
      </div>
    </div>
  );
};

export default ManageCardsModal;
