// src/components/ui/ConfirmDeleteModal.jsx
import React from "react";
import Modal from "@/components/ui/Modal"; // Assuming you have a general Modal component
import Button from "@/components/ui/Button"; // Assuming you have a Button component
import Icon from "@/components/ui/Icon";

const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName = "",
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title={title}
      // You might need to adjust Modal props based on your Modal component's API
      // For example, if it doesn't have a 'preventCloseOnOutsideClick' or similar,
      // you might manage that via its internal logic or by not providing onClose to the overlay.
      themeClass="bg-slate-900 bg-opacity-50 backdrop-filter backdrop-blur-sm" // Example theme
      centered
      // uncontrol // If your Modal component supports this
    >
      <div className="text-center p-6">
        <Icon
          icon="heroicons-outline:exclamation-triangle"
          className="text-danger-500 w-12 h-12 mx-auto mb-4"
        />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {message}
          {itemName && (
            <span className="font-semibold block mt-1">"{itemName}"</span>
          )}
        </p>
      </div>
      <div className="flex justify-center space-x-4 p-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          text={cancelButtonText}
          className="btn-outline-secondary"
          onClick={onClose}
          disabled={isLoading}
        />
        <Button
          text={isLoading ? "Deleting..." : confirmButtonText}
          className="btn-danger" // Ensure you have a btn-danger style
          onClick={onConfirm}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;