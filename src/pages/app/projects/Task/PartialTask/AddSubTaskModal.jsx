import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import FormGroup from "@/components/ui/FormGroup";
import Flatpickr from "react-flatpickr"; // For Due Date
import Button from "@/components/ui/Button";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Helper functions (getFileIcon, formatFileSize)
const getFileIcon = (fileType) => {
  if (fileType.startsWith("image/")) {
    return (
      <svg
        className="w-5 h-5 text-green-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else if (fileType === "application/pdf") {
    return (
      <svg
        className="w-5 h-5 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else {
    return (
      <svg
        className="w-5 h-5 text-blue-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
};
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};
const AddSubTaskModal = ({
  isOpen,
  onClose,
  parentTaskId,
  projectId,
  onSubTaskAdded,
}) => {
  const [quillDescription, setQuillDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FormValidationSchema = yup
    .object({
      task_title: yup.string().required("Title is required"),
      task_description: yup.string().nullable(),
      due_date: yup.date().nullable().typeError("Invalid date format"),
    })
    .required();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "onChange",
    defaultValues: {
      task_title: "",
      task_description: "",
      due_date: null,
    },
  });

  useEffect(() => {
    setValue("task_description", quillDescription, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [quillDescription, setValue]);

  useEffect(() => {
    if (isOpen) {
      reset();
      setQuillDescription("");
      setAttachments([]);
    }
  }, [isOpen, reset]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large (max 10MB).`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type for ${file.name} is not allowed.`);
        return false;
      }
      return true;
    });
    setAttachments((prev) => [...prev, ...validFiles]);
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmitRHF = async (data) => {
    if (!projectId) {
      toast.error("Project ID is missing or invalid.");
      return;
    }
    const numericProjectId = parseInt(String(projectId), 10);
    if (isNaN(numericProjectId)) {
      toast.error("Invalid Project ID format.");
      return;
    }
    let numericParentTaskId = null;
    if (parentTaskId) {
      numericParentTaskId = parseInt(String(parentTaskId), 10);
      if (isNaN(numericParentTaskId)) {
        toast.error("Invalid Parent Task ID format.");
        return;
      }
    }

    setIsSubmitting(true);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("task_title", data.task_title);
      formDataPayload.append("task_description", data.task_description);
      formDataPayload.append("project_id", numericProjectId.toString());

      if (numericParentTaskId !== null) {
        formDataPayload.append(
          "parent_task_id",
          numericParentTaskId.toString()
        );
      }
      if (data.due_date) {
        formDataPayload.append(
          "due_date",
          new Date(data.due_date).toISOString().split("T")[0]
        );
      }

      attachments.forEach((file, index) => {
        formDataPayload.append(`attachments[${index}]`, file);
      });

      const apiPath = getApiBasePathForRole("/project-task");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formDataPayload,
        }
      );

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        let detailedMessage =
          responseData.message ||
          `Failed to create task (status ${response.status}).`;
        if (responseData.errors) {
          const firstErrorKey = Object.keys(responseData.errors)[0];
          if (firstErrorKey && responseData.errors[firstErrorKey]?.length > 0) {
            detailedMessage = responseData.errors[firstErrorKey][0];
          }
        }
        throw new Error(detailedMessage);
      }

      toast.success(
        responseData.message ||
          (numericParentTaskId ? "Sub-task added!" : "Task added!")
      );

      // --- FIX: DELAY CLOSING THE MODAL TO ALLOW TOAST TO BE SEEN ---
      setTimeout(() => {
        if (onSubTaskAdded) {
          onSubTaskAdded();
        }
        onClose();
      }, 300); // 300ms delay
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred.");
      console.error("Error during task submission:", error);
    } finally {
      // We don't set isSubmitting to false here anymore because the component will unmount.
      // If there's an error, it will be set to false below.
      if (!isSubmitting) setIsSubmitting(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  };
  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  return (
    <Modal
      title={parentTaskId ? "Add New Sub-Task" : "Add New Task"}
      activeModal={isOpen}
      onClose={onClose}
      unmountOnClose={true}
    >
      <form onSubmit={handleSubmit(onSubmitRHF)} className="space-y-4">
        <Textinput
          name="task_title"
          label="Title"
          type="text"
          register={register}
          error={errors.task_title}
          placeholder="Enter task title"
          className="h-[48px]"
          disabled={isSubmitting}
        />

        <FormGroup
          label="Description (Optional)"
          error={errors.task_description}
        >
          <input type="hidden" {...register("task_description")} />
          <ReactQuill
            theme="snow"
            value={quillDescription}
            onChange={setQuillDescription}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Enter task description..."
            className={` ${
              errors.task_description
                ? "ql-error border-danger-500"
                : "dark:border-slate-600"
            }`}
            readOnly={isSubmitting}
          />
        </FormGroup>

        <FormGroup
          label="Due Date (Optional)"
          error={errors.due_date}
        x
        >
          <Controller
            name="due_date"
            control={control}
            render={({ field }) => (
              <Flatpickr
                {...field}
                className="form-control h-[48px] dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
                placeholder="YYYY-MM-DD"
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
          <div className="mb-2">
            <label className="flex items-center justify-center w-full px-3 py-4 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md cursor-pointer bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
              <div className="text-center">
                <svg
                  className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Click to upload
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Max 10MB per file
                </p>
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSubmitting}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Selected files:
              </p>
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700/50 rounded text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {getFileIcon(file.type)}
                    <span
                      className="text-slate-700 dark:text-slate-300 truncate"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-danger-500 hover:text-danger-700 p-0.5"
                    disabled={isSubmitting}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
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
            text={
              isSubmitting
                ? "Adding..."
                : parentTaskId
                ? "Add Sub-Task"
                : "Add Task"
            }
            type="submit"
            className="btn-dark"
            isLoading={isSubmitting}
            disabled={isSubmitting || !watch("task_title")?.trim()}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddSubTaskModal;
