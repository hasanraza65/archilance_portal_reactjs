import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector, useDispatch } from "react-redux";
import { saveEditedProjectAPI, setEditModalAndItem } from "./store";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import FormGroup from "@/components/ui/FormGroup";
import Textinput from "@/components/ui/Textinput";
import Cookies from "js-cookie";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { getApiPrefix } from "@/pages/utility/apiHelper";

// Styles aur dusre components waise hi rahenge
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

const OptionComponent = ({ data, ...props }) => (
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

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return role ? `/api/${role}${cleanBasePath}` : `/api/admin${cleanBasePath}`;
};

const EditProject = () => {
  const {
    editModal,
    editItem,
    isUpdating: projectIsUpdating,
  } = useSelector((state) => state.project);
  const dispatch = useDispatch();

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [quillDescription, setQuillDescription] = useState("");

  const FormValidationSchema = yup
    .object({
      project_name: yup.string().required("Job name is required"),
      project_description: yup.string().nullable(),
      start_date: yup
        .date()
        .required("Start date is required")
        .typeError("Invalid date format"),
      due_date: yup
        .date()
        .nullable()
        .typeError("Invalid date format")
        .min(yup.ref("start_date"), "Due date can't be before start date"),
      customer_id: yup
        .object()
        .shape({
          label: yup.string().required(),
          value: yup.string().required(),
        })
        .nullable()
        .required("Customer is required"),
    })
    .required();

  const {
    register,
    control,
    reset,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  useEffect(() => {
    const textContent = (quillDescription || "").replace(/<[^>]*>/g, "").trim();
    setValue("project_description", textContent ? quillDescription : "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [quillDescription, setValue]);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Authentication required.");

        const apiPath = getApiBasePathForRole("/customer-user");
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to load customers");
        }

        const data = await response.json();
        const customerOptions = data.map((customer) => ({
          value: customer.id.toString(),
          label: customer.name,
        }));
        setCustomers(customerOptions);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoadingCustomers(false);
      }
    };
    if (editModal) {
      fetchCustomers();
    }
  }, [editModal]);

  // +++ MUKHYA BADLAV YAHAN KIYA GAYA HAI +++
  useEffect(() => {
    if (editModal && editItem?.id) {
      setCurrentProjectId(editItem.id);

      const selectedCustomer = customers.find(
        (c) => c.value === String(editItem.customer_id)
      );

      // Sahi property naamo ka istemal karein
      const defaultValues = {
        project_name: editItem.project_name || "", // 'name' ki jagah 'project_name' behtar hai
        project_description: editItem.project_description || "", // 'des' ki jagah 'project_description'
        start_date: editItem.start_date ? new Date(editItem.start_date) : null, // 'startDate' ki jagah 'start_date'
        due_date: editItem.due_date ? new Date(editItem.due_date) : null, // 'endDate' ki jagah 'due_date'
        customer_id: selectedCustomer || null,
      };

      reset(defaultValues);
      setQuillDescription(editItem.project_description || ""); // 'des' ki jagah 'project_description'
    } else {
      reset({});
      setQuillDescription("");
      setCurrentProjectId(null);
    }
  }, [editItem, editModal, customers, reset]);

  const onSubmit = async (data) => {
    setLocalIsLoading(true);
    try {
      if (!currentProjectId) {
        toast.error("Job ID is missing. Cannot update.");
        return;
      }
      const textContent = (data.project_description || "")
        .replace(/<[^>]*>/g, "")
        .trim();

      const payload = {
        id: currentProjectId,
        project_name: data.project_name,
        project_description: textContent ? data.project_description : "",
        start_date: new Date(data.start_date).toISOString().split("T")[0],
        due_date: data.due_date
          ? new Date(data.due_date).toISOString().split("T")[0]
          : null,
        customer_id: data.customer_id.value,
      };

      await dispatch(saveEditedProjectAPI(payload)).unwrap();
    } catch (error) {
      // Error toast pehle se hi thunk mein hai, yahan console log kar sakte hain
      console.error("Update failed:", error);
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    dispatch(setEditModalAndItem({ open: false, project: null }));
  };

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
    <Modal title="Edit Job" activeModal={editModal} onClose={handleCloseModal}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          name="project_name"
          label="Job Name"
          placeholder="Enter Job name"
          register={register}
          error={errors.project_name}
          className="h-[48px]"
        />
        <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
          <FormGroup
            label="Start Date"
            id="edit-start-date-picker"
            error={errors.start_date}
          >
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  value={field.value}
                  className="form-control h-[48px]"
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
          <FormGroup
            label="Due Date (Optional)"
            id="edit-due-date-picker"
            error={errors.due_date}
          >
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  value={field.value}
                  className="form-control h-[48px]"
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
        </div>
        <FormGroup
          label="Customer"
          error={errors.customer_id}
          id="customer_id_fg"
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
                id="edit_customer_select"
                placeholder={
                  loadingCustomers ? "Loading customers..." : "Select customer"
                }
                isDisabled={
                  loadingCustomers || localIsLoading || projectIsUpdating
                }
                components={{ Option: OptionComponent }}
                isClearable
              />
            )}
          />
        </FormGroup>
        <FormGroup
          label="Description (Optional)"
          id="edit_project_description_quill_fg"
        >
          <div style={{ height: "200px" }}>
            {" "}
            {/* Wrapper with explicit height */}
            <ReactQuill
              theme="snow"
              value={quillDescription}
              onChange={setQuillDescription}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter Job description..."
              style={{ height: "150px" }} // Quill editor height
              readOnly={localIsLoading || projectIsUpdating}
            />
          </div>
        </FormGroup>
        <div className="ltr:text-right rtl:text-left pt-8">
          <button
            type="submit"
            className="btn btn-dark text-center"
            disabled={localIsLoading || projectIsUpdating}
          >
            {localIsLoading || projectIsUpdating ? "Updating..." : "Update Job"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProject;
