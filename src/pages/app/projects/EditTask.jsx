import React, { useState, useEffect } from "react";
import Select from "react-select";
import Modal from "@/components/ui/Modal";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import FormGroup from "@/components/ui/FormGroup";
import Textinput from "@/components/ui/Textinput";
import axios from "axios";
import Cookies from "js-cookie";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Swal from "sweetalert2";
import { getApiPrefix } from "@/pages/utility/apiHelper";

// Reusable Styles for react-select
const selectStyles = {
  control: (base) => ({
    ...base,
    borderColor: "#e2e8f0",
    borderRadius: "0.375rem",
    minHeight: "38px",
    "&:hover": { borderColor: "#cbd5e1" },
    boxShadow: "none",
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 8px" }),
  input: (base) => ({ ...base, margin: "0px", padding: "0px" }),
  indicatorSeparator: () => ({ display: "none" }),
  indicatorsContainer: (base) => ({ ...base, height: "38px" }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
    backgroundColor: state.isSelected
      ? "#0f172a"
      : state.isFocused
      ? "#f1f5f9"
      : null,
    color: state.isSelected ? "white" : "#0f172a",
    ":active": { backgroundColor: "#e2e8f0" },
  }),
  multiValue: (base) => ({ ...base, backgroundColor: "#e2e8f0" }),
  multiValueLabel: (base) => ({ ...base, color: "#0f172a" }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#0f172a",
    ":hover": { backgroundColor: "#ef4444", color: "white" },
  }),
};

// Helper function to build API path based on user role
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix(); // e.g., 'admin'
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  // Fallback to admin if role is not found for some reason
  return `/api/admin${cleanBasePath}`;
};

// Reusable configurations for Quill editor
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};
const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
];

// --- MODIFIED: Added all new status options ---
const TASK_STATUS_OPTIONS = [
  { value: "On Hold", label: "On Hold" },
  { value: "Backlog", label: "Backlog" },
  { value: "Awaiting Info", label: "Awaiting Info" },
  { value: "In Progress", label: "In Progress" },
  { value: "In-house review", label: "In-house review" },
  { value: "Client Review", label: "Client Review" },
  { value: "Completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Normal", label: "Normal" },
  { value: "Urgent", label: "Urgent" },
];

const EditTask = ({ activeModal, onClose, task, onUpdate }) => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [quillDescription, setQuillDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Validation Schema
  const FormValidationSchema = yup
    .object({
      task_title: yup.string().required("Task title is required"),
      due_date: yup.date().nullable().typeError("Invalid date format"),
      task_status: yup.object().required("Status is required").nullable(),
      priority: yup.object().required("Priority is required").nullable(),
      assignees: yup
        .array()
        .min(1, "At least one assignee is required")
        .nullable(),
      task_description: yup.string().nullable(),
    })
    .required();

  const {
    register,
    control,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  useEffect(() => {
    const textContent = (quillDescription || "").replace(/<[^>]*>/g, "").trim();
    setValue("task_description", textContent ? quillDescription : "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [quillDescription, setValue]);

  // useEffect hook to fetch all employees for the dropdown
  useEffect(() => {
    if (activeModal) {
      const fetchEmployees = async () => {
        setLoadingEmployees(true);
        try {
          const token = Cookies.get("token");

          // === FIX: Sahi endpoint /employee-user ka istemal kiya gaya hai ===
          const apiPath = getApiBasePathForRole("/employee-user");

          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // API response ko dropdown ke format mein badla
          const employeeOptions = response.data.map((emp) => ({
            value: emp.id,
            label: emp.name,
          }));
          setEmployees(employeeOptions);
        } catch (error) {
          console.error("Error fetching employees:", error);
          toast.error("Failed to load employees for assignment.");
        } finally {
          setLoadingEmployees(false);
        }
      };
      fetchEmployees();
    }
  }, [activeModal]);

  // useEffect hook to populate form with task data
  useEffect(() => {
    if (task && activeModal && employees.length > 0) {
      const selectedAssignees = task.assignees
        ? task.assignees
            .map((a) => employees.find((e) => e.value === a.employee_id))
            .filter(Boolean)
        : [];

      reset({
        task_title: task.task_title || "",
        due_date: task.due_date ? new Date(task.due_date) : null,
        task_status:
          TASK_STATUS_OPTIONS.find((o) => o.value === task.task_status) || null,
        priority:
          PRIORITY_OPTIONS.find((o) => o.value === task.priority) || null,
        assignees: selectedAssignees,
        task_description: task.task_description || "",
      });
      setQuillDescription(task.task_description || "");
    } else if (!activeModal) {
      reset({});
      setQuillDescription("");
    }
  }, [task, activeModal, reset, employees]);

  // Form submit hone par task update karne ka function
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const token = Cookies.get("token");

    const payload = {
      task_title: data.task_title,
      due_date: data.due_date
        ? new Date(data.due_date).toISOString().split("T")[0]
        : null,
      task_status: data.task_status.value,
      priority: data.priority.value,
      employee_ids: data.assignees.map((a) => a.value),
      task_description: data.task_description,
    };

    try {
      const updateApiPath = getApiBasePathForRole(`/project-task/${task.id}`);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${updateApiPath}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Success!", "Task updated successfully.", "success");
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Update failed:", error);
      Swal.fire(
        "Error!",
        error.response?.data?.message || "Failed to update task.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Edit Task" activeModal={activeModal} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          name="task_title"
          label="Task Title"
          placeholder="Enter task title"
          register={register}
          error={errors.task_title}
        />
        <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
          <FormGroup
            label="Due Date (Optional)"
            id="edit-task-due-date"
            error={errors.due_date}
          >
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  value={field.value}
                  className="form-control"
                  placeholder="YYYY-MM-DD"
                  onChange={(date) => field.onChange(date[0])}
                  options={{
                    altInput: true,
                    altFormat: "F j, Y",
                    dateFormat: "Y-m-d",
                  }}
                />
              )}
            />
          </FormGroup>
          <FormGroup label="Priority" error={errors.priority}>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={PRIORITY_OPTIONS}
                  styles={selectStyles}
                  isClearable
                />
              )}
            />
          </FormGroup>
        </div>
        <FormGroup label="Status" error={errors.task_status}>
          <Controller
            name="task_status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={TASK_STATUS_OPTIONS}
                styles={selectStyles}
                isClearable
              />
            )}
          />
        </FormGroup>
        <FormGroup label="Assignees" error={errors.assignees}>
          <Controller
            name="assignees"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={employees}
                isLoading={loadingEmployees}
                styles={selectStyles}
                isMulti
                isClearable
                placeholder={
                  loadingEmployees ? "Loading..." : "Select assignees"
                }
              />
            )}
          />
        </FormGroup>
        <FormGroup label="Description (Optional)">
          <input type="hidden" {...register("task_description")} />
          <div className="pb-10">
            <ReactQuill
              theme="snow"
              value={quillDescription}
              onChange={setQuillDescription}
              className="h-32"
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter task description..."
            />
          </div>
        </FormGroup>
        <div className="ltr:text-right rtl:text-left pt-2">
          <button
            type="submit"
            className="btn btn-dark text-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTask;
