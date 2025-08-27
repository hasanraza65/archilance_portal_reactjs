import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

import Modal from "@/components/ui/Modal";
import FormGroup from "@/components/ui/FormGroup";
import Flatpickr from "react-flatpickr";
import Button from "@/components/ui/Button";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Helper functions
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return role ? `/api/${role}${cleanBasePath}` : `/api/admin${cleanBasePath}`;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const AddTaskBriefModal = ({ isOpen, onClose, onTaskBriefAdded, taskId }) => {
  const [quillDescription, setQuillDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FormValidationSchema = yup
    .object({
      brief_description: yup.string().required("Brief description is required"),
      brief_date: yup
        .date()
        .required("Brief date is required")
        .typeError("Invalid date format"),
    })
    .required();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "onChange",
    defaultValues: {
      brief_description: "",
      brief_date: new Date(),
    },
  });

  useEffect(() => {
    setValue("brief_description", quillDescription, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [quillDescription, setValue]);

  useEffect(() => {
    if (isOpen) {
      reset({
        brief_description: "",
        brief_date: new Date(),
      });
      setQuillDescription("");
      setAttachments([]);
    }
  }, [isOpen, reset]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const onSubmitForm = async (data) => {
    if (!taskId) {
      toast.error("Task ID is missing. Cannot create brief.");
      return;
    }

    setIsSubmitting(true);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("task_id", String(taskId));
      formData.append("brief_description", data.brief_description);
      formData.append(
        "brief_date",
        new Date(data.brief_date).toISOString().split("T")[0]
      );

      // === YAHAN AHEM TABDEELI KI GAYI HAI ===
      // Hum check kar rahe hain ke agar user ne attachments select ki hain, to hi unhein FormData mein add karein.
      if (attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append("attachments[]", file);
        });
      }

      const apiPath = getApiBasePathForRole("/task-brief");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to add task brief.");
      }
      toast.success("Task brief added successfully!");
      if (onTaskBriefAdded) onTaskBriefAdded();
      onClose();
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add New Task Brief"
      activeModal={isOpen}
      onClose={onClose}
      unmountOnClose
    >
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
        <FormGroup label="Brief Description" error={errors.brief_description}>
          <input type="hidden" {...register("brief_description")} />
          <ReactQuill
            theme="snow"
            value={quillDescription}
            onChange={setQuillDescription}
            readOnly={isSubmitting}
            className={`h-32 mb-12 ${
              errors.brief_description ? "ql-error border-danger-500" : ""
            }`}
            placeholder="Enter the details for the task brief..."
          />
        </FormGroup>
        <FormGroup label="Brief Date" error={errors.brief_date}>
          <Controller
            name="brief_date"
            control={control}
            render={({ field }) => (
              <Flatpickr
                {...field}
                className="form-control h-[48px]"
                options={{
                  altInput: true,
                  altFormat: "F j, Y",
                  dateFormat: "Y-m-d",
                }}
                value={field.value}
                onChange={(date) => field.onChange(date[0] || null)}
                disabled={isSubmitting}
              />
            )}
          />
        </FormGroup>
        <FormGroup label="Attachments (Optional)">
          <label className="flex items-center justify-center w-full px-3 py-4 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:bg-slate-50">
            <span>Click to upload files</span>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>
          {attachments.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-xs font-medium text-slate-600">
                Selected files:
              </p>
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-100 rounded text-xs"
                >
                  <span className="truncate pr-2">
                    {file.name} ({formatFileSize(file.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700 font-bold"
                    disabled={isSubmitting}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormGroup>
        <div className="ltr:text-right rtl:text-left pt-2 space-x-2">
          <Button
            text="Cancel"
            type="button"
            className="btn-outline-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          />
          <Button
            text={isSubmitting ? "Adding..." : "Add Brief"}
            type="submit"
            className="btn-dark"
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskBriefModal;
