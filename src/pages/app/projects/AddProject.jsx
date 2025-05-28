import React, { useState, useEffect } from "react";
import Select from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector, useDispatch } from "react-redux";
import { toggleAddModal } from "./store";
import Textinput from "@/components/ui/Textinput";
// Textarea will be replaced by ReactQuill
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormGroup from "@/components/ui/FormGroup";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill snow theme styles
// Assuming navigate and location might be needed from your previous context
// If not, you can remove them.
import { useNavigate, useLocation } from "react-router-dom";


const AddProject = () => {
  const { openProjectModal } = useSelector((state) => state.project);
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Included as it was in your useEffect
  const location = useLocation(); // Included as it was in your useEffect

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [quillDescription, setQuillDescription] = useState(""); // State for ReactQuill content

  // Form validation schema
  const FormValidationSchema = yup
    .object({
      project_name: yup.string().required("Project name is required"),
      project_description: yup.string(), // Yup will validate the string from Quill
      start_date: yup.date().required("Start date is required").typeError("Invalid date format"),
      due_date: yup.date().required("End date is required").typeError("Invalid date format")
        .min(yup.ref('start_date'), "End date cannot be before start date"),
      customer_id: yup.object().shape({ // Assuming react-select returns an object
        value: yup.string().required(),
        label: yup.string().required(),
      }).required("Customer is required").nullable(),
    })
    .required();

  const {
    register,
    control,
    reset,
    setValue, // <-- Destructure setValue from useForm
    formState: { errors },
    handleSubmit,
    watch, // To watch start_date for due_date minDate
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all", // Or "onChange"
    defaultValues: { // Set default values for controlled components
        project_name: "",
        project_description: "", // Will be updated by Quill
        start_date: new Date(),
        due_date: new Date(),
        customer_id: null,
    }
  });

  // Effect to update react-hook-form when Quill's description changes
  useEffect(() => {
    // Set the value for 'project_description' in react-hook-form
    // This allows yup to validate it.
    setValue("project_description", quillDescription, { 
      shouldValidate: true, // Validate after setting value
      shouldDirty: true    // Mark field as dirty
    });
  }, [quillDescription, setValue]);

  // Effect to reset Quill editor when modal is closed or form is reset
  // This hook should run when `openProjectModal` changes, to clear on close.
  useEffect(() => {
    if (!openProjectModal) {
      // Reset Quill editor's content
      setQuillDescription("");
      // Reset other form fields (react-hook-form's reset handles its own fields)
      // The main `reset()` call is in `onClose` and `onSubmit` success.
    }
  }, [openProjectModal]);


  const selectStyles = {
    control: (base, state) => ({ // Added state for dynamic styling
      ...base,
      borderColor: state.isFocused ? '#4f46e5' : (errors.customer_id ? '#f87171' : '#e2e8f0'),
      borderRadius: '0.375rem',
      padding: '0.2rem',
      boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#4f46e5' : (errors.customer_id ? '#f87171' : '#cbd5e1'),
      }
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : null,
      color: state.isSelected ? 'white' : 'black',
    }),
    menu: base => ({
        ...base,
        zIndex: 9999
    })
  };

 useEffect(() => {
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const token = Cookies.get("token");
      
      if (!token) {
        toast.error("Authentication required. Please log in.");
        // navigate('/login', { state: { from: location } });
        setLoadingCustomers(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_BASE_URL || 'https://demo.Aentora.com/backend/public'}/api/admin/customer-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          }
        }
      );
      if (response.data && Array.isArray(response.data)) {
        const customerOptions = response.data.map(customer => ({
          value: customer.id.toString(),
          label: customer.name
        }));
        setCustomers(customerOptions);
      } else {
        toast.error("Invalid customer data format from server.");
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      const errorMessage = error.response?.data?.message || "Failed to load customers";
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        // navigate('/login', { state: { from: location } });
        toast.info("Session expired or unauthorized. Please log in again.");
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch customers only when the modal is open to avoid unnecessary calls
  if (openProjectModal) {
    fetchCustomers();
  }
// }, [openProjectModal, navigate, location]); // Removed navigate, location if not strictly needed for this specific fetch logic
}, [openProjectModal]); // Simpler dependency array if navigate/location are for other side effects

  const onSubmitHandler = async (data) => { // Renamed to avoid conflict
    setIsLoading(true);

    // Ensure Quill description (HTML) is what's submitted.
    // data.project_description should already be updated by the useEffect hook.
    // Add a check for empty Quill content (ignoring HTML tags)
    const plainTextDescription = quillDescription.replace(/<(.|\n)*?>/g, '').trim();
    if (!plainTextDescription) {
        toast.error("Description cannot be empty.");
        // Manually trigger error display for react-hook-form if needed,
        // though yup schema should catch it if setValue correctly makes it an empty string.
        // For example: setError("project_description", { type: "manual", message: "Description cannot be empty." });
        setIsLoading(false);
        return;
    }
    
    try {
      const token = Cookies.get("token");
      
      if (!token) {
        toast.error("You are not logged in. Please log in to create projects.");
        dispatch(toggleAddModal(false));
        setIsLoading(false);
        return;
      }
      
      const formattedData = {
        project_name: data.project_name,
        project_description: data.project_description, // This comes from RHF, updated by Quill
        start_date: new Date(data.start_date).toISOString().split("T")[0],
        due_date: new Date(data.due_date).toISOString().split("T")[0],
        customer_id: data.customer_id.value, // react-select value
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL || 'https://demo.Aentora.com/backend/public'}/api/admin/project`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          }
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success(response.data.message || "Project created successfully");
        dispatch(toggleAddModal(false));
        reset(); // Resets react-hook-form fields to defaultValues
        setQuillDescription(""); // Explicitly reset Quill state
      } else {
        toast.error(response.data.message || "Failed to create project: Unexpected server response");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error.response?.data?.message || 
                        (error.message || "Failed to create project. Please try again.");
      toast.error(errorMessage);
      if (error.response?.status === 401) {
         toast.info("Session expired or unauthorized. Please log in again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }], // Simplified header options
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'clean'] // Clean formatting button
    ],
  };

  const quillFormats = [ // Must match toolbar options
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'link'
  ];
  
  const watchedStartDate = watch("start_date"); // For minDate in due_date Flatpickr

  return (
    <div>
      <Modal
        title="Create Project"
        labelclassName="btn-outline-dark" // May not be used if modal is controlled by Redux
        activeModal={openProjectModal}
        onClose={() => {
            dispatch(toggleAddModal(false));
            reset(); // Reset RHF form
            setQuillDescription(""); // Reset Quill editor state
        }}
        // className="max-w-2xl" // Optional: Adjust modal width for more space
      >
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          <Textinput
            name="project_name"
            label="Project Name"
            placeholder="Enter project name"
            register={register}
            error={errors.project_name}
            disabled={isLoading}
          />
          
          <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
            <FormGroup
              label="Start Date"
              id="start-date-picker"
              error={errors.start_date}
            >
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <Flatpickr
                    // {...field} // Spread field for value and onChange
                    className={`form-control py-2 ${errors.start_date ? 'border-danger-500 focus:border-danger-500' : ''}`}
                    id="start-date-picker"
                    placeholder="YYYY-MM-DD"
                    value={field.value} // Controlled by RHF
                    onChange={(date) => {
                      setStartDate(date[0]); // Keep your local state if other logic depends on it
                      field.onChange(date[0]); // Update RHF field
                    }}
                    options={{
                      altInput: true,
                      altFormat: "F j, Y",
                      dateFormat: "Y-m-d",
                    }}
                    disabled={isLoading}
                  />
                )}
              />
               {errors.start_date && (
                <div className="mt-2 text-danger-500 block text-sm">
                    {errors.start_date?.message}
                </div>
                )}
            </FormGroup>
            
            <FormGroup
              label="Due Date"
              id="due-date-picker"
              error={errors.due_date}
            >
              <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                  <Flatpickr
                    // {...field}
                    className={`form-control py-2 ${errors.due_date ? 'border-danger-500 focus:border-danger-500' : ''}`}
                    id="due-date-picker"
                    placeholder="YYYY-MM-DD"
                    value={field.value} // Controlled by RHF
                    onChange={(date) => {
                      setEndDate(date[0]); // Keep your local state
                      field.onChange(date[0]); // Update RHF
                    }}
                    options={{
                      altInput: true,
                      altFormat: "F j, Y",
                      dateFormat: "Y-m-d",
                      minDate: watchedStartDate || "today" // Use watched start_date
                    }}
                    disabled={isLoading}
                  />
                )}
              />
              {errors.due_date && (
                <div className="mt-2 text-danger-500 block text-sm">
                    {errors.due_date?.message}
                </div>
                )}
            </FormGroup>
          </div>
          
          <div className={errors.customer_id ? "has-error" : ""}>
            <label className="form-label" htmlFor="customer_select">
              Customer <span className="text-danger-500">*</span>
            </label>
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
                  id="customer_select"
                  placeholder={loadingCustomers ? "Loading customers..." : "Select customer"}
                  isDisabled={loadingCustomers || isLoading}
                  isClearable
                />
              )}
            />
            {errors.customer_id && (
              <div className="mt-2 text-danger-500 block text-sm">
                {errors.customer_id?.message || errors.customer_id?.value?.message}
              </div>
            )}
          </div>

          {/* Project Description with ReactQuill */}
          <FormGroup 
            label="Description" 
            // Error display is now below ReactQuill
          >
            {/* Hidden input for RHF to 'see' the field, though setValue is the primary mechanism */}
            <input type="hidden" {...register("project_description")} />
            <ReactQuill
              theme="snow"
              value={quillDescription}
              onChange={setQuillDescription} // Updates local state, which updates RHF via useEffect
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter project description..."
              // Add a class for error styling on the Quill editor itself
              className={`h-40 mb-12 ${errors.project_description ? 'ql-error' : ''}`} 
              readOnly={isLoading}
            />
            {errors.project_description && (
              <div className="mt-2 text-danger-500 block text-sm clear-both pt-1"> {/* clear-both for toolbar */}
                {errors.project_description?.message}
              </div>
            )}
          </FormGroup>
           {/*
            You might need to add CSS for .ql-error to style the border of Quill:
            .ql-error .ql-toolbar, .ql-error .ql-container {
                border-color: #f87171 !important; // Your error color
            }
           */}

          <div className="ltr:text-right rtl:text-left pt-4">
            <button 
              type="submit" 
              className="btn btn-dark text-center" 
              disabled={isLoading}
            >
              {isLoading ? (
                 <>
                  <svg className="animate-spin inline-block -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AddProject;