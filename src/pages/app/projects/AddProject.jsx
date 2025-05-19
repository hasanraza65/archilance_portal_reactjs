import React, { useState, useEffect } from "react";
import Select from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector, useDispatch } from "react-redux";
import { toggleAddModal } from "./store";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormGroup from "@/components/ui/FormGroup";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const AddProject = () => {
  const { openProjectModal } = useSelector((state) => state.project);
  const dispatch = useDispatch();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Form validation schema
  const FormValidationSchema = yup
    .object({
      project_name: yup.string().required("Project name is required"),
      project_description: yup.string().required("Description is required"),
      start_date: yup.date().required("Start date is required"),
      due_date: yup.date().required("End date is required"),
      customer_id: yup.mixed().required("Customer is required"),
    })
    .required();

  const {
    register,
    control,
    reset,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  const selectStyles = {
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

 useEffect(() => {
  const fetchCustomers = async () => {
    try {
      const token = Cookies.get("token");
      
      if (!token) {
        toast.error("Authentication required. Please log in.");
        setLoadingCustomers(false);
        return;
      }

      const response = await axios.get(
        'https://demo.Aentora.com/backend/public/api/admin/customer-user',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      const customerOptions = response.data.map(customer => ({
        value: customer.id.toString(),
        label: customer.name
      }));
      setCustomers(customerOptions);
    } catch (error) {
      console.error('Error fetching customers:', error);
      const errorMessage = error.response?.data?.message || "Failed to load customers";
      toast.error(errorMessage);
      
      // If unauthorized (401), you might want to redirect to login
      if (error.response?.status === 401) {
        navigate('/login', { state: { from: location } });
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  fetchCustomers();
}, []);
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const token = Cookies.get("token");
      
      if (!token) {
        toast.error("You are not logged in. Please log in to create projects.");
        dispatch(toggleAddModal(false));
        return;
      }
      
      const formattedData = {
        project_name: data.project_name,
        project_description: data.project_description,
        start_date: new Date(data.start_date).toISOString().split("T")[0],
        due_date: new Date(data.due_date).toISOString().split("T")[0],
        customer_id: data.customer_id.value,
      };

      const response = await axios.post(
        "https://demo.Aentora.com/backend/public/api/admin/project",
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (response.data) {
        toast.success("Project created successfully");
        dispatch(toggleAddModal(false));
        reset();
      } else {
        toast.error("Failed to create project: No response from server");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error.response?.data?.message || 
                        "Failed to create project. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Modal
        title="Create Project"
        labelclassName="btn-outline-dark"
        activeModal={openProjectModal}
        onClose={() => dispatch(toggleAddModal(false))}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="project_name"
            label="Project Name"
            placeholder="Enter project name"
            register={register}
            error={errors.project_name}
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
                    className="form-control py-2"
                    id="start-date-picker"
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChange={(date) => {
                      setStartDate(date[0]);
                      field.onChange(date[0]);
                    }}
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
              label="Due Date"
              id="due-date-picker"
              error={errors.due_date}
            >
              <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                  <Flatpickr
                    className="form-control py-2"
                    id="due-date-picker"
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChange={(date) => {
                      setEndDate(date[0]);
                      field.onChange(date[0]);
                    }}
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
          
          <div className={errors.customer_id ? "has-error" : ""}>
            <label className="form-label" htmlFor="customer_select">
              Customer
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
                  isDisabled={loadingCustomers}
                />
              )}
            />
            {errors.customer_id && (
              <div className="mt-2 text-danger-500 block text-sm">
                {errors.customer_id?.message}
              </div>
            )}
          </div>

          <FormGroup 
            label="Description" 
            error={errors.project_description}
          >
            <Textarea 
              name="project_description"
              placeholder="Enter project description" 
              register={register}
              error={errors.project_description}
            />
          </FormGroup>

          <div className="ltr:text-right rtl:text-left">
            <button 
              type="submit" 
              className="btn btn-dark text-center" 
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AddProject;               