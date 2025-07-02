// src/Subscription.jsx (UPDATED with Cancel Button and SweetAlert)

import React from "react";
// --- YAHAN TABDEELI KI GAI HAI ---
// SweetAlert2 ko import karein
import Swal from "sweetalert2";

// Icon component (jaisa pehle tha)
const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

// SummaryCard component (jaisa pehle tha)
const SummaryCard = ({ title, value, subtext, bgColor }) => (
  <div className={`p-6 rounded-xl border ${bgColor}`}>
    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    <p className="text-3xl font-bold mt-1 text-gray-800">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{subtext}</p>
  </div>
);

const Subscription = () => {
  // --- YAHAN TABDEELI KI GAI HAI ---
  // Cancel button ke liye function
  const handleCancelSubscription = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this! Your subscription will be cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it!",
    }).then((result) => {
      if (result.isConfirmed) {
        // Yahan aap apni API call kar sakte hain subscription cancel karne ke liye
        // For now, we will just show a success message.
        Swal.fire(
          "Cancelled!",
          "Your subscription has been cancelled.",
          "success"
        );
      }
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Billing</h1>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <SummaryCard
          title="Billing Cycle"
          value="Annual"
          subtext="Paid on 03/12/2025"
          bgColor="bg-green-50 border-green-200"
        />
        <SummaryCard
          title="Current Plan"
          value="Pro Plan"
          subtext="$300 Per Year"
          bgColor="bg-blue-50 border-blue-200"
        />
        <SummaryCard
          title="Next Renewal"
          value="In 8 Months"
          subtext="Date: 03/12/2026"
          bgColor="bg-orange-50 border-orange-200"
        />
      </div>

      {/* Current Subscription Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gray-400">
            <InfoIcon />
          </span>
          <h2 className="text-lg font-semibold text-gray-800">Pro Plan</h2>
        </div>
        {/* ... baki ka subscription content jaisa pehle tha ... */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Seats</span>
            <span className="font-medium text-gray-800">1</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Next Renewal</span>
            <span className="font-medium text-gray-800">In 8 Months</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Current Billing</span>
            <span className="font-medium text-gray-800">$300 / Year</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">Upgrade</span>
            <button className="px-4 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Billing Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        {/* ... Billing details jaisa pehle tha ... */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Billing</h2>
        <div className="divide-y divide-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
            <div>
              <p className="font-semibold text-gray-700">Billing Information</p>
              <p className="text-sm text-gray-500 mt-1">
                View and update your billing information.
              </p>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-blue-600 hover:underline shrink-0"
            >
              Edit Billing Information
            </a>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
            <div>
              <p className="font-semibold text-gray-700">Billing History</p>
              <p className="text-sm text-gray-500">
                Access and download your billing history if needed.
              </p>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-blue-600 hover:underline shrink-0"
            >
              View History
            </a>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
            <div>
              <p className="font-semibold text-gray-700">Payment Method</p>
              <p className="text-sm text-gray-500">
                View and update your payment method.
              </p>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-blue-600 hover:underline shrink-0"
            >
              Edit Payment Method
            </a>
          </div>
        </div>
      </div>

      {/* --- YAHAN TABDEELI KI GAI HAI --- */}
      {/* Cancellation Section with Button */}
      <div>
        <h2 className="text-xl font-semibold text-red-600">Cancellation</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-4 text-sm">
          After cancellation, you will not be able to send any more signature
          requests.
          <br />
          <button
            onClick={handleCancelSubscription}
            className="mt-4 px-4 py-2 bg-transparent border border-red-500 text-red-600 font-semibold rounded-md hover:bg-red-100 transition duration-200"
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
