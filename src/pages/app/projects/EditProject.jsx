import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector, useDispatch } from "react-redux";
import { updateProject, toggleEditModal } from "./store"; // Assuming this is your project slice
import Icon from "@/components/ui/Icon";
import Textarea from "@/components/ui/Textarea";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import FormGroup from "@/components/ui/FormGroup";
import Textinput from "@/components/ui/Textinput"; // Import Textinput
import axios from "axios";
import Cookies from "js-cookie";

// Assuming these are still relevant or can be adapted
import avatar1 from "@/assets/images/avatar/av-1.svg";
import avatar2 from "@/assets/images/avatar/av-2.svg";
import avatar3 from "@/assets/images/avatar/av-3.svg";
import avatar4 from "@/assets/images/avatar/av-4.svg";

const styles = {
  multiValue: (base, state) => {
    return state.data.isFixed ? { ...base, opacity: "0.5" } : base;
  },
  multiValueLabel: (base, state) => {
    return state.data.isFixed
      ? { ...base, color: "#626262", paddingRight: 6 }
      : base;
  },
  multiValueRemove: (base, state) => {
    return state.data.isFixed ? { ...base, display: "none" } : base;
  },
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const selectStyles = { // Copied from AddProject for consistency
    control: (base) => ({
      ...base,
      borderColor: '#e2e8f0',
      borderRadius: '0.375rem',
      padding: '0.2rem',
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
    }),
  };


// These might need to be fetched or adjusted if they are part of the editable data
const assigneeOptions = [
  { value: "mahedi", label: "Mahedi Amin", image: avatar1 },
  { value: "sovo", label: "Sovo Haldar", image: avatar2 },
  { value: "rakibul", label: "Rakibul Islam", image: avatar3 },
  { value: "pritom", label: "Pritom Miha", image: avatar4 },
];
const tagOptions = [ // Renamed from 'options' to be more descriptive
  { value: "team", label: "team" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
  { value: "update", label: "update" },
];

const OptionComponent = ({ data, ...props }) => {
  return (
    <components.Option {...props}>
      <span className="flex items-center space-x-4">
        {data.image && ( // Conditionally render image if available
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

const EditProject = () => {
  const { editModal, editItem } = useSelector((state) => state.project);
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Define the validation schema based on API fields
  const FormValidationSchema = yup
    .object({
      project_name: yup.string().required("Project name is required"),
      project_description: yup.string().required("Description is required"),
      start_date: yup.date().required("Start date is required"),
      due_date: yup.date().required("Due date is required")
                 .min(yup.ref('start_date'), "Due date can't be before start date"),
      customer_id: yup.mixed().required("Customer is required"),
      // Optional: Add validation for assignees and tags if needed by API
      // assignees: yup.array().nullable(),
      // tags: yup.array().nullable(),
    })
    .required();

  const {
    register,
    control,
    reset,
    setValue, // To set values programmatically
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  // Fetch Customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const token = Cookies.get("token");
        if (!token) {
          toast.error("Authentication required.");
          setLoadingCustomers(false);
          return;
        }
        const response = await axios.get(
          "https://demo.Aentora.com/backend/public/api/admin/customer-user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const customerOptions = response.data.map((customer) => ({
          value: customer.id.toString(), // Ensure value is string if API expects string
          label: customer.name,
        }));
        setCustomers(customerOptions);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error(error.response?.data?.message || "Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };
    if (editModal) { // Fetch customers only when modal is open
        fetchCustomers();
    }
  }, [editModal]);


  // Populate form when editItem or customers list changes
  useEffect(() => {
    if (editItem && editModal) {
      // Basic fields
      reset({
        project_name: editItem.name || "", // API uses project_name, UI uses name
        project_description: editItem.des || "", // API uses project_description, UI uses des
        // assignees: editItem.assignee || [], // Assuming editItem.assignee is in the correct format for Select
        // tags: editItem.tags || [], // Assuming editItem.tags is in the correct format for Select
      });

      // Dates (Flatpickr handles Date objects or valid date strings)
      if (editItem.startDate) {
        setValue("start_date", new Date(editItem.startDate));
      }
      if (editItem.endDate) { // Assuming editItem has an endDate property from your ProjectPostPage mapping
        setValue("due_date", new Date(editItem.endDate));
      } else if (editItem.due_date) { // Or if it directly has due_date
        setValue("due_date", new Date(editItem.due_date));
      }


      // Customer: Set only after customers are loaded and editItem.customer_id is available
      if (customers.length > 0 && editItem.customer_id) {
        const selectedCustomer = customers.find(
          (c) => c.value === editItem.customer_id.toString() // Ensure type consistency
        );
        if (selectedCustomer) {
          setValue("customer_id", selectedCustomer);
        } else {
             setValue("customer_id", null); // Or handle if customer not found
        }
      }
    }
  }, [editItem, editModal, reset, setValue, customers]);


  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const token = Cookies.get("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        setIsLoading(false);
        return;
      }

      if (!editItem || !editItem.id) {
        toast.error("Project ID is missing. Cannot update.");
        setIsLoading(false);
        return;
      }
      
      // Prepare data for the API
      const payload = {
        project_name: data.project_name,
        project_description: data.project_description,
        start_date: new Date(data.start_date).toISOString().split("T")[0],
        due_date: new Date(data.due_date).toISOString().split("T")[0],
        customer_id: data.customer_id.value, // Send only the value
        // Optional: Format assignees and tags if your API expects them
        // assignees: data.assignees ? data.assignees.map(a => a.value) : [],
        // tags: data.tags ? data.tags.map(t => t.value) : [],
        _method: "PUT" // Often required for PUT requests when using FormData or specific backend setups
      };

      // API uses POST for updates with _method: "PUT" or direct PUT
      // Let's try PUT directly first. If it fails, try POST with _method.
      const response = await axios.put(
        `https://demo.Aentora.com/backend/public/api/admin/project/${editItem.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Important for JSON payload
            Accept: "application/json",
          },
        }
      );

      // Assuming API returns the updated project or a success message
      // The `updateProject` action should update the Redux store
      // If API returns the full updated project, use response.data.data or response.data
      // For now, let's assume we use the payload merged with id
      const updatedProjectData = {
        id: editItem.id,
        ...payload, // Contains API field names
        // Map back to UI field names if they differ significantly for Redux state
        name: payload.project_name,
        des: payload.project_description,
        startDate: payload.start_date,
        endDate: payload.due_date,
        // Keep original assignee/members if not updated, or handle as per API
        assignee: editItem.assignee, 
        members: editItem.members,
        status: editItem.status, // Assuming status is not part of this edit form
      };

      dispatch(updateProject(updatedProjectData));
      dispatch(toggleEditModal(false));
      toast.success("Project updated successfully!", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Error updating project:", error.response || error);
      const errorMessage = error.response?.data?.message || "Failed to update project. Please try again.";
      toast.error(errorMessage);
       if (error.response?.data?.errors) {
         // Handle validation errors from backend if any
         Object.entries(error.response.data.errors).forEach(([key, value]) => {
           toast.error(`${key}: ${value.join(', ')}`);
         });
       }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    dispatch(toggleEditModal(false));
    reset(); // Reset form fields when modal is closed
  }

  return (
    <Modal
      title="Edit Project"
      activeModal={editModal}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
        <Textinput
          name="project_name" // API field name
          label="Project Name"
          placeholder="Enter project name"
          register={register}
          error={errors.project_name}
          className="form-control py-2"
        />

        <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
          <FormGroup
            label="Start Date"
            id="edit-start-date-picker"
            error={errors.start_date}
          >
            <Controller
              name="start_date" // API field name
              control={control}
              render={({ field }) => (
                <Flatpickr
                  className="form-control py-2"
                  placeholder="YYYY-MM-DD"
                  value={field.value || ""} // Use field.value
                  onChange={(date) => field.onChange(date[0])} // Flatpickr returns an array
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
            label="Due Date" // Changed from End Date to Due Date for API consistency
            id="edit-due-date-picker"
            error={errors.due_date}
          >
            <Controller
              name="due_date" // API field name
              control={control}
              render={({ field }) => (
                <Flatpickr
                  className="form-control py-2"
                  placeholder="YYYY-MM-DD"
                  value={field.value || ""} // Use field.value
                  onChange={(date) => field.onChange(date[0])} // Flatpickr returns an array
                  options={{
                    altInput: true,
                    altFormat: "F j, Y",
                    dateFormat: "Y-m-d",
                    minDate: control._formValues.start_date ? new Date(control._formValues.start_date) : null
                  }}
                />
              )}
            />
          </FormGroup>
        </div>

        <div className={errors.customer_id ? "has-error" : ""}>
          <label className="form-label" htmlFor="edit_customer_select">
            Customer
          </label>
          <Controller
            name="customer_id" // API field name
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={customers}
                isLoading={loadingCustomers}
                styles={selectStyles} // Using styles from AddProject
                className="react-select"
                classNamePrefix="select"
                id="edit_customer_select"
                placeholder={loadingCustomers ? "Loading customers..." : "Select customer"}
                isDisabled={loadingCustomers}
                components={{ Option: OptionComponent }} // For image if customer data had it
              />
            )}
          />
          {errors.customer_id && (
            <div className="mt-2 text-danger-500 block text-sm">
              {errors.customer_id?.message || errors.customer_id?.label?.message}
            </div>
          )}
        </div>
        
        {/* Optional: Assignee - If your API supports updating assignees */}
        {/* <div className={errors.assignees ? "has-error" : ""}>
          <label className="form-label" htmlFor="edit_assignees">
            Assignee(s)
          </label>
          <Controller
            name="assignees" // Or whatever your API expects
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={assigneeOptions} // Make sure these are the correct options
                styles={styles}
                className="react-select"
                classNamePrefix="select"
                isMulti
                components={{ Option: OptionComponent }}
                id="edit_assignees"
              />
            )}
          />
          {errors.assignees && (
            <div className=" mt-2  text-danger-500 block text-sm">
              {errors.assignees?.message}
            </div>
          )}
        </div> */}

        {/* Optional: Tags - If your API supports updating tags */}
        {/* <div className={errors.tags ? "has-error" : ""}>
          <label className="form-label" htmlFor="edit_tags">
            Tag(s)
          </label>
          <Controller
            name="tags" // Or whatever your API expects
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={tagOptions}
                styles={styles}
                className="react-select"
                classNamePrefix="select"
                isMulti
                id="edit_tags"
              />
            )}
          />
          {errors.tags && (
            <div className=" mt-2  text-danger-500 block text-sm">
              {errors.tags?.message}
            </div>
          )}
        </div> */}

        <FormGroup label="Description" error={errors.project_description}>
            <Textarea
                name="project_description" // API field name
                label="Description"
                placeholder="Enter project description"
                register={register}
                error={errors.project_description}
            />
        </FormGroup>

        <div className="ltr:text-right rtl:text-left">
          <button type="submit" className="btn btn-dark text-center" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProject;