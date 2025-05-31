import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector, useDispatch } from "react-redux";
import { saveEditedProjectAPI, setEditModalAndItem } from "./store";
// Icon, Flatpickr, FormGroup, Textinput are used
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
import 'react-quill/dist/quill.snow.css';

const selectStyles = { /* ... your existing selectStyles ... */
  control: (base) => ({...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '38px', '&:hover': {borderColor: '#cbd5e1',}, boxShadow: 'none', }),
  valueContainer: (base) => ({...base, padding: '2px 8px',}), input: (base) => ({...base, margin: '0px', padding: '0px',}),
  indicatorSeparator: () => ({display: 'none',}), indicatorsContainer: (base) => ({...base, height: '38px',}),
  option: (provided, state) => ({...provided, fontSize: "14px", backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f1f5f9' : null, color: state.isSelected ? 'white' : '#0f172a', ':active': {backgroundColor: '#e2e8f0',},}),
  multiValue: (base) => ({ ...base, backgroundColor: '#e2e8f0', }),
  multiValueLabel: (base) => ({ ...base, color: '#0f172a', }),
  multiValueRemove: (base) => ({ ...base, color: '#0f172a', ':hover': { backgroundColor: '#ef4444', color: 'white',}, }),
};
const OptionComponent = ({ data, ...props }) => { /* ... your existing OptionComponent ... */
  return (<components.Option {...props}><span className="flex items-center space-x-4">{data.image && (<div className="flex-none"><div className="h-7 w-7 rounded-full"><img src={data.image} alt="" className="w-full h-full rounded-full"/></div></div>)}<span className="flex-1">{data.label}</span></span></components.Option>);
};

const EditProject = ({ onProjectUpdated }) => { // Added onProjectUpdated prop
  const { editModal, editItem, isUpdating: projectIsUpdating } = useSelector((state) => state.project);
  const dispatch = useDispatch();

  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [quillDescription, setQuillDescription] = useState(""); // State for ReactQuill

  const FormValidationSchema = yup
    .object({
      project_name: yup.string().required("Project name is required"),
      project_description: yup.string()
        .required("Description is required.")
        .test(
          'has-content',
          'Description cannot be empty or just spaces.',
          (value) => {
            if (!value) return false;
            const textContent = value.replace(/<[^>]*>/g, '').trim();
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
    })
    .required();

  const {
    register,
    control,
    reset,
    setValue, // Make sure setValue is destructured
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
    defaultValues: {
        project_name: "",
        project_description: "", // Will be managed by ReactQuill
        start_date: null,
        due_date: null,
        customer_id: null,
    }
  });

  // Effect to sync ReactQuill state with React Hook Form
  useEffect(() => {
    setValue("project_description", quillDescription, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [quillDescription, setValue]);

  // Fetch Customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const token = Cookies.get("token");
        if (!token) {
          toast.error("Authentication required to load customers.");
          setLoadingCustomers(false); return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL || 'https://demo.Aentora.com/backend/public'}/api/admin/customer-user`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        const customerOptions = response.data.map((customer) => ({
          value: customer.id.toString(), label: customer.name,
        }));
        setCustomers(customerOptions);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error(error.response?.data?.message || "Failed to load customers");
      } finally { setLoadingCustomers(false); }
    };
    if (editModal) { fetchCustomers(); }
  }, [editModal]);


  // Populate form when editItem changes and modal is open
  useEffect(() => {
    if (editModal && editItem && editItem.id) {
      reset(); // Clear previous values first for a clean populate
      setValue("project_name", editItem.name || "");
      // Set ReactQuill's state from editItem.des (HTML content)
      setQuillDescription(editItem.des || ""); // This will trigger the other useEffect to update RHF

      if (editItem.startDate) { setValue("start_date", new Date(editItem.startDate)); }
      else { setValue("start_date", null); }

      const effectiveEndDate = editItem.endDate || editItem.due_date;
      if (effectiveEndDate) { setValue("due_date", new Date(effectiveEndDate)); }
      else { setValue("due_date", null); }

      // Customer handling remains same, will be set by the next useEffect if customers load later
      if (customers.length > 0 && editItem.customer_id) {
        const selectedCustomer = customers.find(c => c.value === editItem.customer_id.toString());
        setValue("customer_id", selectedCustomer || null);
      } else {
        setValue("customer_id", null); // Ensure it's null if no match or customers not ready
      }

    } else if (!editModal) {
        reset(); // Reset form if modal is closed
        setQuillDescription(""); // Clear Quill editor as well
    }
  }, [editItem, editModal, reset, setValue, customers]); // Added customers here

  // Effect to set customer_id once customers are loaded (idempotent)
  useEffect(() => {
    if (editModal && editItem && editItem.customer_id && customers.length > 0) {
        const currentRHFcustomer = control._formValues.customer_id;
        if (!currentRHFcustomer || currentRHFcustomer.value !== String(editItem.customer_id)) {
            const selectedCustomer = customers.find(
                (c) => c.value === String(editItem.customer_id)
            );
            if (selectedCustomer) {
                setValue("customer_id", selectedCustomer);
            }
        }
    }
  }, [customers, editItem, editModal, setValue, control._formValues.customer_id]);


  const onSubmit = async (data) => {
    setLocalIsLoading(true);
    try {
      if (!editItem || !editItem.id) {
        toast.error("Project ID is missing. Cannot update.");
        setLocalIsLoading(false); return;
      }
      const payload = {
        id: editItem.id,
        project_name: data.project_name,
        project_description: data.project_description, // From RHF, which got it from Quill
        start_date: new Date(data.start_date).toISOString().split("T")[0],
        due_date: new Date(data.due_date).toISOString().split("T")[0],
        customer_id: data.customer_id.value,
      };
      dispatch(saveEditedProjectAPI(payload))
        .unwrap()
        .then(() => {
          // Modal close and refetch are handled by the thunk/reducer
          // and parent component callback
          if (onProjectUpdated) { // Call the callback from parent
            onProjectUpdated();
          }
        })
        .catch((error) => {
          console.error("Update failed (handled in component catch):", error);
        });
    } catch (error) {
      console.error("Synchronous error during submit preparation:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    dispatch(setEditModalAndItem({ open: false, item: null })); // Ensure item is cleared
    // Form reset and Quill reset are handled by useEffect watching editModal
  };

  // ReactQuill modules and formats
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };
  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link',
  ];


  return (
    <Modal title="Edit Project" activeModal={editModal} onClose={handleCloseModal} >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
        <Textinput name="project_name" label="Project Name" placeholder="Enter project name" register={register} error={errors.project_name} className="h-[48px]" />
        <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
          <FormGroup label="Start Date" id="edit-start-date-picker" error={errors.start_date}>
            <Controller name="start_date" control={control} render={({ field }) => (
                <Flatpickr {...field} className="form-control h-[48px]" placeholder="YYYY-MM-DD"
                  onChange={(date) => field.onChange(date[0])}
                  options={{ altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d" }}/>
              )}/>
            {errors.start_date && <div className="mt-1 text-danger-500 text-xs">{errors.start_date.message}</div>}
          </FormGroup>
          <FormGroup label="Due Date" id="edit-due-date-picker" error={errors.due_date}>
            <Controller name="due_date" control={control} render={({ field }) => (
                <Flatpickr {...field} className="form-control h-[48px]" placeholder="YYYY-MM-DD"
                  onChange={(date) => field.onChange(date[0])}
                  options={{ altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d",
                    minDate: control._formValues.start_date ? new Date(new Date(control._formValues.start_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null
                  }}/>
              )}/>
            {errors.due_date && <div className="mt-1 text-danger-500 text-xs">{errors.due_date.message}</div>}
          </FormGroup>
        </div>
        <FormGroup label="Customer" error={errors.customer_id} id="customer_id_fg">
          <Controller name="customer_id" control={control} render={({ field }) => (
              <Select {...field} options={customers} isLoading={loadingCustomers} styles={selectStyles}
                className="react-select" classNamePrefix="select" id="edit_customer_select"
                placeholder={loadingCustomers ? "Loading customers..." : "Select customer"}
                isDisabled={loadingCustomers || localIsLoading || projectIsUpdating}
                components={{ Option: OptionComponent }} isClearable />
            )}/>
          {errors.customer_id && <div className="mt-1 text-danger-500 text-xs">{errors.customer_id.message || errors.customer_id.value?.message}</div>}
        </FormGroup>

        {/* ReactQuill for Description */}
        <FormGroup label="Description" id="edit_project_description_quill_fg">
          <input type="hidden" {...register("project_description")} />
          <ReactQuill
            theme="snow"
            value={quillDescription} // Controlled by local state
            onChange={setQuillDescription} // Updates local state -> RHF via useEffect
            modules={quillModules}
            formats={quillFormats}
            placeholder="Enter project description..."
            className={`h-32 ${errors.project_description ? 'ql-error border-danger-500' : ''}`}
            readOnly={localIsLoading || projectIsUpdating}
          />
          {errors.project_description && (
            <div className="mt-1 text-danger-500 text-xs clear-both pt-1">
              {errors.project_description.message}
            </div>
          )}
        </FormGroup>

        <div className="ltr:text-right rtl:text-left pt-2">
          <button type="submit" className="btn btn-dark text-center" disabled={localIsLoading || projectIsUpdating}>
            {(localIsLoading || projectIsUpdating) ? "Updating..." : "Update Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProject;