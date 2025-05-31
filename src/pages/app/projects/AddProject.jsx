import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector, useDispatch } from "react-redux";
import { addProjectAPI, toggleAddModal } from "./store";
// Removed Textarea, will use ReactQuill
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import FormGroup from "@/components/ui/FormGroup";
import Textinput from "@/components/ui/Textinput";
import axios from "axios";
import Cookies from "js-cookie";

// Import ReactQuill and its styles
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Snow theme is common

// Styles and OptionComponent can be reused or adapted from EditProject.jsx
const selectStyles = {
    control: (base) => ({...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '38px', '&:hover': {borderColor: '#cbd5e1',}, boxShadow: 'none', }),
    valueContainer: (base) => ({...base, padding: '2px 8px',}), input: (base) => ({...base, margin: '0px', padding: '0px',}),
    indicatorSeparator: () => ({display: 'none',}), indicatorsContainer: (base) => ({...base, height: '38px',}),
    option: (provided, state) => ({...provided, fontSize: "14px", backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f1f5f9' : null, color: state.isSelected ? 'white' : '#0f172a', ':active': {backgroundColor: '#e2e8f0',},}),
};
const OptionComponent = ({ data, ...props }) => {
    return (<components.Option {...props}><span className="flex items-center space-x-4">{data.image && (<div className="flex-none"><div className="h-7 w-7 rounded-full"><img src={data.image} alt="" className="w-full h-full rounded-full"/></div></div>)}<span className="flex-1">{data.label}</span></span></components.Option>);
};


const AddProject = ({ onProjectAdded }) => { // Added onProjectAdded prop
  const { openProjectModal, isAdding } = useSelector((state) => state.project);
  const dispatch = useDispatch();

  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [quillDescription, setQuillDescription] = useState(""); // State for ReactQuill

  const FormValidationSchema = yup.object({
      project_name: yup.string().required("Project name is required"),
      project_description: yup.string()
        .required("Description is required.")
        .test(
          'has-content', // Custom test name
          'Description cannot be empty or just spaces.', // Error message
          (value) => {
            // Check if value exists and, after stripping HTML tags, if it has non-whitespace characters
            if (!value) return false;
            const textContent = value.replace(/<[^>]*>/g, '').trim(); // Strip HTML and trim
            return textContent.length > 0;
          }
        ),
      start_date: yup.date().required("Start date is required").typeError("Invalid date format"),
      due_date: yup.date().required("Due date is required").typeError("Invalid date format")
                 .min(yup.ref('start_date'), "Due date can't be before start date"),
      customer_id: yup.object().shape({
          label: yup.string().required(),
          value: yup.string().required(),
        }).nullable().required("Customer is required"),
    }).required();

  const {
    register,
    control,
    reset,
    handleSubmit,
    setValue, // <-- Need setValue from useForm
    formState: { errors },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all", // Or "onChange" for better performance on complex forms
    defaultValues: {
      project_name: "",
      project_description: "", // Will be handled by ReactQuill state
      start_date: new Date(),
      due_date: null, // Or new Date() if you prefer a default
      customer_id: null,
    }
  });

  // Effect to sync ReactQuill state with React Hook Form for validation
  useEffect(() => {
    setValue("project_description", quillDescription, {
      shouldValidate: true, // Validate after setting the value
      shouldDirty: true,    // Mark the field as dirty
    });
  }, [quillDescription, setValue]);


  useEffect(() => {
    const fetchCustomers = async () => {
        setLoadingCustomers(true); try { const token = Cookies.get("token"); if (!token) { toast.error("Auth required."); setLoadingCustomers(false); return; }
        // Ensure your environment variable and endpoint are correct
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL || 'https://demo.Aentora.com/backend/public'}/api/admin/customer-user`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
        setCustomers(res.data.map((c) => ({ value: c.id.toString(), label: c.name, /* image: c.profile_image_url if available */ }))); } catch (e) { console.error("Error fetching customers:", e); toast.error(e.response?.data?.message || "Failed to load customers"); } finally { setLoadingCustomers(false); }
    };
    if (openProjectModal) { fetchCustomers(); }
  }, [openProjectModal]);

  const onSubmit = async (data) => {
    console.log("DEBUG: AddProject onSubmit: Form data (from RHF):", data);
    setLocalIsLoading(true);
    const payload = {
      project_name: data.project_name,
      project_description: data.project_description, // This now comes from RHF, updated by ReactQuill
      start_date: new Date(data.start_date).toISOString().split("T")[0],
      due_date: new Date(data.due_date).toISOString().split("T")[0],
      customer_id: data.customer_id.value,
    };
    console.log("DEBUG: AddProject onSubmit: Dispatching addProjectAPI with payload:", payload);
    dispatch(addProjectAPI(payload))
      .unwrap()
      .then(() => {
        console.log("DEBUG: AddProject addProjectAPI fulfilled in component.");
        reset(); // Reset RHF form
        setQuillDescription(""); // Reset Quill editor's content
        // Modal close is handled by the thunk/reducer (toggleAddModal(false) should be dispatched there)
        if (onProjectAdded) { // Call the callback from parent
          onProjectAdded();
        }
      })
      .catch((error) => {
        console.error("DEBUG: AddProject addProjectAPI rejected in component:", error);
        // Toast for error is likely handled in the thunk or caught globally
      })
      .finally(() => {
        setLocalIsLoading(false);
      });
  };

  const handleCloseModal = () => {
    console.log("DEBUG: AddProject handleCloseModal: Dispatching toggleAddModal(false)");
    dispatch(toggleAddModal(false));
    reset(); // Reset RHF form
    setQuillDescription(""); // Reset Quill editor's content
  };

  // Reset form and Quill when modal closes or opens
  useEffect(() => {
    if (openProjectModal) {
        reset({ // Reset to default values when modal opens
            project_name: "",
            project_description: "",
            start_date: new Date(),
            due_date: null,
            customer_id: null,
        });
        setQuillDescription(""); // Clear Quill editor
    }
  }, [openProjectModal, reset]);

  // ReactQuill modules and formats
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', /*'image'*/], // Image upload needs server-side handling
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', /*'image'*/
  ];

  return (
    <Modal title="Add New Project" activeModal={openProjectModal} onClose={handleCloseModal}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput name="project_name" label="Project Name" register={register} error={errors.project_name} className="h-[48px]" />
        <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
          <FormGroup label="Start Date" id="add-start-date-picker" error={errors.start_date}>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  value={field.value || new Date()} // Ensure a value is always passed
                  className="form-control h-[48px]"
                  onChange={(date) => field.onChange(date[0])}
                  options={{altInput:true, altFormat:"F j, Y", dateFormat:"Y-m-d"}}
                />
              )}
            />
            {errors.start_date && <div className="mt-1 text-danger-500 text-xs">{errors.start_date.message}</div>}
          </FormGroup>
          <FormGroup label="Due Date" id="add-due-date-picker" error={errors.due_date}>
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Flatpickr
                  {...field}
                  value={field.value} // Can be null initially
                  className="form-control h-[48px]"
                  onChange={(date) => field.onChange(date[0])}
                  options={{
                    altInput:true,
                    altFormat:"F j, Y",
                    dateFormat:"Y-m-d",
                    minDate: control._formValues.start_date ? new Date(new Date(control._formValues.start_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] : new Date().fp_incr(1) // Ensure minDate is next day
                  }}
                />
              )}
            />
             {errors.due_date && <div className="mt-1 text-danger-500 text-xs">{errors.due_date.message}</div>}
          </FormGroup>
        </div>
        <FormGroup label="Customer" error={errors.customer_id} id="add_customer_id_fg">
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
                id="add_customer_select"
                placeholder={loadingCustomers ? "Loading..." : "Select customer"}
                isDisabled={loadingCustomers || isAdding || localIsLoading}
                components={{ Option: OptionComponent }}
                isClearable
              />
            )}
          />
          {errors.customer_id && <div className="mt-1 text-danger-500 text-xs">{errors.customer_id.message || errors.customer_id.value?.message}</div>}
        </FormGroup>

        {/* ReactQuill for Description */}
        <FormGroup label="Description" id="add_project_description_quill_fg">
          {/* Hidden input for RHF to register the field, setValue updates it */}
          <input type="hidden" {...register("project_description")} />
          <ReactQuill
            theme="snow"
            value={quillDescription}
            onChange={setQuillDescription} // Updates local state, which updates RHF via useEffect
            modules={quillModules}
            formats={quillFormats}
            placeholder="Enter project description..."
            // Add a class for error styling on the Quill editor itself if needed
            // And adjust height, mb-12 might be too much if error message is below
            className={`h-32 ${errors.project_description ? 'ql-error border-danger-500' : ''}`}
            readOnly={isAdding || localIsLoading}
          />
          {errors.project_description && (
            <div className="mt-1 text-danger-500 text-xs clear-both pt-1"> {/* Adjusted margin and clear for toolbar */}
              {errors.project_description.message}
            </div>
          )}
        </FormGroup>
        {/*
            You might need to add CSS for .ql-error to style the border of Quill:
            .ql-error .ql-toolbar, .ql-error .ql-container {
                border-color: #your_error_color !important;
            }
            Or use Tailwind's ring utilities on the parent if you prefer.
        */}

        <div className="ltr:text-right rtl:text-left pt-2">
          <button type="submit" className="btn btn-dark text-center" disabled={localIsLoading || isAdding}>
            {(localIsLoading || isAdding) ? "Adding..." : "Add Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProject;