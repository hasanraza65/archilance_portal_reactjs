import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import ManageCardsModal from "./ManageCardsModal";
import BillingHistoryModal from "./BillingHistoryModal";
import ManageBillingInfoModal from "./ManageBillingInfoModal";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import Cookies from "js-cookie";

const initialHistory = [
  {
    id: 1,
    invoiceId: "INV-2024-003",
    date: "June 1, 2024",
    amount: "$300.00",
    status: "Paid",
    downloadUrl: "#",
  },
  {
    id: 2,
    invoiceId: "INV-2023-003",
    date: "June 1, 2023",
    amount: "$300.00",
    status: "Paid",
    downloadUrl: "#",
  },
  {
    id: 3,
    invoiceId: "INV-2022-003",
    date: "June 1, 2022",
    amount: "$300.00",
    status: "Paid",
    downloadUrl: "#",
  },
];

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

const SummaryCard = ({ title, value, subtext, bgColor }) => (
  <div className={`p-6 rounded-xl border ${bgColor}`}>
    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    <p className="text-3xl font-bold mt-1 text-gray-800">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{subtext}</p>
  </div>
);

const Subscription = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBillingInfoModalOpen, setIsBillingInfoModalOpen] = useState(false);
  const [billingHistory, setBillingHistory] = useState(initialHistory);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error(
            "Authentication token not found in cookies. Please log in."
          );
        }
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_BASE_URL
          }/api/customer/subscription/active`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 401) {
          navigate("/login");
          throw new Error(
            "You are not authorized. Your session may have expired."
          );
        }
        if (!response.ok) {
          throw new Error(
            "Failed to fetch subscription data. Please try again later."
          );
        }
        const data = await response.json();
        setSubscriptionData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscriptionData();
  }, [navigate]);

  useEffect(() => {
    const isAnyModalOpen =
      isModalOpen || isHistoryModalOpen || isBillingInfoModalOpen;
    document.body.style.overflow = isAnyModalOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen, isHistoryModalOpen, isBillingInfoModalOpen]);

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
        Swal.fire(
          "Cancelled!",
          "Your subscription has been cancelled.",
          "success"
        );
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-medium text-gray-600">
          Loading Billing Information...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <h2 className="text-2xl font-semibold text-gray-700">
          No Active Subscription
        </h2>
        <p className="mt-2 text-gray-500">
          You do not currently have an active subscription.
        </p>
        <Link
          to="/pricing"
          className="mt-6 px-6 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition"
        >
          View Plans
        </Link>
      </div>
    );
  }

  const renewalDate = new Date(subscriptionData.subscription.ends_at);
  const renewalIn = formatDistanceToNow(renewalDate, { addSuffix: true });
  const renewalDateFormatted = format(renewalDate, "MM/dd/yyyy");

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Billing</h1>
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
          value={renewalIn}
          subtext={`Date: ${renewalDateFormatted}`}
          bgColor="bg-orange-50 border-orange-200"
        />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gray-400">
            <InfoIcon />
          </span>
          <h2 className="text-lg font-semibold text-gray-800">Pro Plan</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Next Renewal</span>
            <span className="font-medium text-gray-800">{renewalIn}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Current Billing</span>
            <span className="font-medium text-gray-800">$300 / Year</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">Upgrade</span>
            <Link
              to="/upgrade-plan"
              className="px-4 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Billing</h2>
        <div className="divide-y divide-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
            <div>
              <p className="font-semibold text-gray-700">Billing Information</p>
              <p className="text-sm text-gray-500 mt-1">
                View your current billing information.
              </p>
            </div>
            <button
              onClick={() => setIsBillingInfoModalOpen(true)}
              className="text-sm font-medium text-blue-600 hover:underline shrink-0"
            >
              Manage Billing Information
            </button>
          </div>
          {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
            <div>
              <p className="font-semibold text-gray-700">Billing History</p>
              <p className="text-sm text-gray-500">
                Access and download your billing history if needed.
              </p>
            </div>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-sm font-medium text-blue-600 hover:underline shrink-0"
            >
              View History
            </button>
          </div> */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
            <div>
              <p className="font-semibold text-gray-700">Payment Method</p>
              <p className="text-sm text-gray-500">
                View and update your payment method.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-medium text-blue-600 hover:underline shrink-0"
            >
              Edit Payment Method
            </button>
          </div>
        </div>
      </div>
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

      <ManageCardsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <BillingHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={billingHistory}
      />
      <ManageBillingInfoModal
        isOpen={isBillingInfoModalOpen}
        onClose={() => setIsBillingInfoModalOpen(false)}
      />
    </div>
  );
};

export default Subscription;
