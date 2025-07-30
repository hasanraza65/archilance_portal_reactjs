import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector, useDispatch } from "react-redux";
import { addProjectAPI, toggleAddModal } from "./store";
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
};

const OptionComponent = ({ data, ...props }) => {
  return (
    <components.Option {...props}>
      <span className="flex items-center space-x-4">
        {data.image && (
          <div className="flex-none">
            <div className="h-7 w-7 rounded-full">
              <img
                src={data.image}
                alt=""
                className="w-full h-full rounded-full"
              />
            </div>
          </div>
        )}
        <span className="flex-1">{data.label}</span>
      </span>
    </components.Option>
  );
};

const AddProject = ({ onProjectAdded }) => {
  const { openProjectModal, isAdding } = useSelector((state) => state.project);
  const dispatch = useDispatch();

  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [quillDescription, setQuillDescription] = useState("");

  const FormValidationSchema = yup
    .object({
      project_name: yup.string().required("Job name is required"),

      project_description: yup.string().nullable(),

      start_date: yup
        .date()
        .required("Start date is required")
        .typeError("Invalid date format"),
      // +++ CHANGE: Made due_date optional by removing .required() and adding .nullable()
      due_date: yup
        .date()
        .nullable() // Allow the date to be null
        .typeError("Invalid date format")
        .min(yup.ref("start_date"), "Due date can't be before the start date"),
      customer_id: yup
        .object()
        .shape({
          label: yup.string().required(),
          value: yup.string().required(),
        })
        .nullable()
        .required("Customer is required"),
      employee_ids: yup
        .array()
        .min(1, "At least one employee must be assigned")
        .of(yup.object())
        .nullable()
        .required("Assigning employees is required"),
    })
    .required();

  const {
    register,
    control,
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
    defaultValues: {
      project_name: "",
      project_description: "",
      start_date: new Date(),
      due_date: null,
      customer_id: null,
      employee_ids: [],
    },
  });

  useEffect(() => {
    const textContent = quillDescription?.replace(/<[^>]*>/g, "").trim();
    setValue("project_description", textContent ? quillDescription : "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [quillDescription, setValue]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication required.");
      setLoadingCustomers(false);
      setLoadingEmployees(false);
      return;
    }

    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/customer-user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        setCustomers(
          res.data.map((c) => ({ value: c.id.toString(), label: c.name }))
        );
      } catch (e) {
        toast.error(e.response?.data?.message || "Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };

    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/employee-user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        setEmployees(
          res.data.map((e) => ({ value: e.id.toString(), label: e.name }))
        );
      } catch (e) {
        toast.error(e.response?.data?.message || "Failed to load employees");
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (openProjectModal) {
      fetchCustomers();
      fetchEmployees();
    }
  }, [openProjectModal]);

  const onSubmit = async (data) => {
    setLocalIsLoading(true);

    let finalDescription = data.project_description;
    const textContent = finalDescription?.replace(/<[^>]*>/g, "").trim();
    if (!textContent) {
      finalDescription = "";
    }

    const payload = {
      project_name: data.project_name,
      project_description: finalDescription,
      start_date: new Date(data.start_date).toISOString().split("T")[0],
      // +++ CHANGE: Safely handle optional due_date. If it's not set, send null.
      due_date: data.due_date
        ? new Date(data.due_date).toISOString().split("T")[0]
        : null,
      customer_id: data.customer_id.value,
      employee_ids: data.employee_ids.map((emp) => emp.value),
    };

    dispatch(addProjectAPI(payload))
      .unwrap()
      .then(() => {
        reset();
        setQuillDescription("");
        if (onProjectAdded) onProjectAdded();
      })
      .catch(() => {
        // Error is handled in the slice, so no action needed here
      })
      .finally(() => setLocalIsLoding(false));
  };

  const handleCloseModal = () => {
    dispatch(toggleAddModal(false));
    reset();
    setQuillDescription("");
  };
  useEffect(() => {
    if (openProjectModal) {
      reset({
        project_name: "",
        project_description: "",
        start_date: new Date(),
        due_date: null,
        customer_id: null,
        employee_ids: [],
      });
      setQuillDescription("");
    }
  }, [openProjectModal, reset]);

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

  return (
    <Modal
      title="Add New Job"
      activeModal={openProjectModal}
      onClose={handleCloseModal}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          name="project_name"
          label="Job Name"
          register={register}
          error={errors.project_name}
          className="h-[48px]"
        />

        <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
          <FormGroup label="Start Date" id="add-start-date-picker">
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  value={field.value || new Date()}
                  className="form-control h-[48px]"
                  onChange={(date) => field.onChange(date[0])}
                  options={{
                    altInput: true,
                    altFormat: "F j, Y",
                    dateFormat: "Y-m-d",
                  }}
                />
              )}
            />
            {errors.start_date && (
              <div className="mt-1 text-danger-500 text-xs">
                {errors.start_date.message}
              </div>
            )}
          </FormGroup>
          {/* +++ CHANGE: Updated label to indicate it's optional */}
          <FormGroup label="Due Date (Optional)" id="add-due-date-picker">
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  value={field.value}
                  className="form-control h-[48px]"
                  onChange={(date) => field.onChange(date[0])}
                  options={{
                    altInput: true,
                    altFormat: "F j, Y",
                    dateFormat: "Y-m-d",
                    minDate: control._formValues.start_date
                      ? new Date(
                          new Date(control._formValues.start_date).getTime() +
                            24 * 60 * 60 * 1000
                        )
                          .toISOString()
                          .split("T")[0]
                      : new Date().fp_incr(1),
                  }}
                />
              )}
            />
            {errors.due_date && (
              <div className="mt-1 text-danger-500 text-xs">
                {errors.due_date.message}
              </div>
            )}
          </FormGroup>
        </div>

        <FormGroup
          label="Customer"
          error={errors.customer_id}
          id="add_customer_id_fg"
        >
          <Controller
            name="customer_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={customers}
                isLoading={loadingCustomers}
                styles={selectStyles}
                className="react-select"
                classNamePrefix="select"
                placeholder={
                  loadingCustomers ? "Loading..." : "Select customer"
                }
                isDisabled={loadingCustomers || isAdding || localIsLoading}
                components={{ Option: OptionComponent }}
                isClearable
              />
            )}
          />
          {errors.customer_id && (
            <div className="mt-1 text-danger-500 text-xs">
              {errors.customer_id.message || errors.customer_id.value?.message}
            </div>
          )}
        </FormGroup>

        <FormGroup
          label="Assign Employees"
          error={errors.employee_ids}
          id="add_employee_ids_fg"
        >
          <Controller
            name="employee_ids"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                isMulti
                options={employees}
                isLoading={loadingEmployees}
                styles={selectStyles}
                className="react-select"
                classNamePrefix="select"
                placeholder={
                  loadingEmployees
                    ? "Loading employees..."
                    : "Select employees to assign"
                }
                isDisabled={loadingEmployees || isAdding || localIsLoading}
                components={{ Option: OptionComponent }}
                isClearable
              />
            )}
          />
          {errors.employee_ids && (
            <div className="mt-1 text-danger-500 text-xs">
              {errors.employee_ids.message}
            </div>
          )}
        </FormGroup>

        <FormGroup
          label="Description (Optional)"
          id="add_project_description_quill_fg"
        >
          <input type="hidden" {...register("project_description")} />
          <ReactQuill
            theme="snow"
            value={quillDescription}
            onChange={setQuillDescription}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Enter job description..."
            className={`h-32 ${
              errors.project_description ? "ql-error border-danger-500" : ""
            }`}
            readOnly={isAdding || localIsLoading}
          />
          {errors.project_description && (
            <div className="mt-1 text-danger-500 text-xs clear-both pt-1">
              {errors.project_description.message}
            </div>
          )}
        </FormGroup>

        <div className="ltr:text-right rtl:text-left pt-2">
          <button
            type="submit"
            className="btn btn-dark text-center mt-4"
            disabled={localIsLoading || isAdding}
          >
            {isAdding || localIsLoading ? "Adding..." : "Add Job"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProject;
