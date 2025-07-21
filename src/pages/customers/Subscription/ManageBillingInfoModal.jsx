import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-500 hover:text-blue-600"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path
      fillRule="evenodd"
      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
      clipRule="evenodd"
    />
  </svg>
);

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

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-500 hover:text-blue-600"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path
      fillRule="evenodd"
      d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
      clipRule="evenodd"
    />
  </svg>
);

const AddressPlaceholderIcon = () => (
  <svg
    className="w-24 h-24 text-gray-300 mx-auto"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-1-4h1m-1-4h1"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M12 21V3m0 18h-1m1 0h1"
    />
  </svg>
);

const NoBillingInfoView = ({ setView }) => (
  <div className="text-center py-8">
    <AddressPlaceholderIcon />
    <h3 className="mt-4 text-lg font-semibold text-gray-800">
      No billing address on file.
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Please add a billing address for your account.
    </p>
    <button
      onClick={() => setView("add")}
      className="mt-6 w-full bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-900 transition"
    >
      Add Billing Address
    </button>
  </div>
);

const BillingInfoListView = ({
  details,
  handleView,
  handleEdit,
  handleDelete,
  setView,
}) => (
  <div>
    {details.map((detail) => (
      <div
        key={detail.id}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 mb-3 border rounded-lg hover:bg-gray-50"
      >
        <div className="mb-2 sm:mb-0">
          <p className="font-semibold text-gray-800">
            {detail.first_name} {detail.last_name}
          </p>
          <p className="text-sm text-gray-500">
            {detail.address}, {detail.city}, {detail.state} {detail.zip}
          </p>
          <p className="text-sm text-gray-500">{detail.country}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={() => handleView(detail)} title="View Details">
            <EyeIcon />
          </button>
          <button onClick={() => handleEdit(detail)} title="Edit Address">
            <EditIcon />
          </button>
        </div>
      </div>
    ))}
  </div>
);

const AddEditBillingInfoForm = ({ initialData = null }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        company: initialData.company || "",
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        zip: initialData.zip || "",
        country: initialData.country || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-gray-700"
          >
            First Name
          </label>
          <input
            type="text"
            name="first_name"
            id="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name
          </label>
          <input
            type="text"
            name="last_name"
            id="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email Address
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label
          htmlFor="company"
          className="block text-sm font-medium text-gray-700"
        >
          Company (Optional)
        </label>
        <input
          type="text"
          name="company"
          id="company"
          value={formData.company}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700"
        >
          Address
        </label>
        <input
          type="text"
          name="address"
          id="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700"
          >
            City
          </label>
          <input
            type="text"
            name="city"
            id="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700"
          >
            State / Province
          </label>
          <input
            type="text"
            name="state"
            id="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="zip"
            className="block text-sm font-medium text-gray-700"
          >
            ZIP / Postal Code
          </label>
          <input
            type="text"
            name="zip"
            id="zip"
            value={formData.zip}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700"
          >
            Country
          </label>
          <input
            type="text"
            name="country"
            id="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row justify-between py-3 border-b border-gray-100">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-800 text-left sm:text-right">
      {value || "N/A"}
    </p>
  </div>
);

const BillingInfoDetailView = ({ detail }) => (
  <div className="space-y-2">
    <DetailItem
      label="Full Name"
      value={`${detail.first_name} ${detail.last_name}`}
    />
    <DetailItem label="Email Address" value={detail.email} />
    <DetailItem label="Phone Number" value={detail.phone} />
    <DetailItem label="Company" value={detail.company} />
    <DetailItem label="Address" value={detail.address} />
    <DetailItem label="City" value={detail.city} />
    <DetailItem label="State / Province" value={detail.state} />
    <DetailItem label="ZIP / Postal Code" value={detail.zip} />
    <DetailItem label="Country" value={detail.country} />
  </div>
);

const ManageBillingInfoModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [billingDetails, setBillingDetails] = useState([]);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const formId = "billing-info-form";

  const fetchBillingDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = Cookies.get("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/customer/subscription/billing-detail`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch billing details.");
      const data = await response.json();
      const details =
        data.billing_details ||
        (data.billing_detail ? [data.billing_detail] : []);
      setBillingDetails(details);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isOpen) {
      fetchBillingDetails();
    }
  }, [isOpen, fetchBillingDetails]);

  const handleView = (detail) => {
    setCurrentDetail(detail);
    setView("view");
  };

  const handleEdit = (detail) => {
    setCurrentDetail(detail);
    setView("edit");
  };

  const handleDelete = async (detailId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This billing address will be permanently removed.",
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
          }/api/customer/subscription/billing-detail/delete/${detailId}`,
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
          throw new Error(
            errorData.message || "Failed to delete billing address."
          );
        }
        Swal.fire(
          "Deleted!",
          "The billing address has been removed.",
          "success"
        );
        await fetchBillingDetails();
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    const isEditing = view === "edit";
    let url;
    let method;
    let payload;

    if (isEditing) {
      url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/customer/subscription/update-billing-detail`;
      method = "POST";
      payload = { ...data, id: currentDetail.id };
    } else {
      url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/customer/subscription/billing-detail/create`;
      method = "POST";
      payload = data;
    }

    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Billing address ${isEditing ? "updated" : "added"}!`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      await fetchBillingDetails();
      setView("list");
      setCurrentDetail(null);
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: err.message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setView("list");
    setCurrentDetail(null);
  };

  const closeModal = () => {
    setView("list");
    setCurrentDetail(null);
    onClose();
  };

  const getModalTitle = () => {
    if (view === "add") return "Add New Billing Address";
    if (view === "edit") return "Edit Billing Address";
    if (view === "view") return "Billing Address Details";
    return "Manage Billing Information";
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12 text-gray-600">
          Loading billing details...
        </div>
      );
    }
    if (error) {
      return <div className="text-center py-12 text-red-600">{error}</div>;
    }
    switch (view) {
      case "list":
        return billingDetails.length > 0 ? (
          <BillingInfoListView
            details={billingDetails}
            handleView={handleView}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            setView={setView}
          />
        ) : (
          <NoBillingInfoView setView={setView} />
        );
      case "add":
      case "edit":
        return (
          <form onSubmit={handleFormSubmit} id={formId}>
            <AddEditBillingInfoForm initialData={currentDetail} />
          </form>
        );
      case "view":
        return <BillingInfoDetailView detail={currentDetail} />;
      default:
        return <NoBillingInfoView setView={setView} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 pt-26">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <div className="p-6 border-b shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {getModalTitle()}
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
        <div className="p-6 overflow-y-auto grow">{renderContent()}</div>
        {(view === "add" || view === "edit" || view === "view") && (
          <div className="p-4 bg-gray-50 border-t rounded-b-xl shrink-0">
            {view === "view" ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form={formId}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium disabled:bg-gray-400"
                >
                  {isSaving ? "Saving..." : "Save Address"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBillingInfoModal;