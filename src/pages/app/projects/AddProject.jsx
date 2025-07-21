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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const selectStyles = {
    control: (base) => ({...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '38px', '&:hover': {borderColor: '#cbd5e1',}, boxShadow: 'none', }),
    valueContainer: (base) => ({...base, padding: '2px 8px',}),
    input: (base) => ({...base, margin: '0px', padding: '0px',}),
    indicatorSeparator: () => ({display: 'none',}),
    indicatorsContainer: (base) => ({...base, height: '38px',}),
    option: (provided, state) => ({...provided, fontSize: "14px", backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f1f5f9' : null, color: state.isSelected ? 'white' : '#0f172a', ':active': {backgroundColor: '#e2e8f0',},}),
};

const OptionComponent = ({ data, ...props }) => {
    return (
        <components.Option {...props}>
            <span className="flex items-center space-x-4">
                {data.image && (
                    <div className="flex-none">
                        <div className="h-7 w-7 rounded-full">
                            <img src={data.image} alt="" className="w-full h-full rounded-full"/>
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
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [quillDescription, setQuillDescription] = useState("");

    const FormValidationSchema = yup.object({
        project_name: yup.string().required("Project name is required"),
        project_description: yup.string().required("Description is required.").test('has-content', 'Description cannot be empty or just spaces.', (value) => {
            if (!value) return false;
            const textContent = value.replace(/<[^>]*>/g, '').trim();
            return textContent.length > 0;
        }),
        start_date: yup.date().required("Start date is required").typeError("Invalid date format"),
        due_date: yup.date().required("Due date is required").typeError("Invalid date format").min(yup.ref('start_date'), "Due date can't be before start date"),
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
        }
    });

    useEffect(() => {
        setValue("project_description", quillDescription, {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [quillDescription, setValue]);

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoadingCustomers(true);
            try {
                const token = Cookies.get("token");
                if (!token) {
                    toast.error("Auth required.");
                    setLoadingCustomers(false);
                    return;
                }
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/customer-user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json'
                    }
                });
                setCustomers(res.data.map((c) => ({
                    value: c.id.toString(),
                    label: c.name,
                })));
            } catch (e) {
                console.error("Error fetching customers:", e);
                toast.error(e.response?.data?.message || "Failed to load customers");
            } finally {
                setLoadingCustomers(false);
            }
        };
        if (openProjectModal) {
            fetchCustomers();
        }
    }, [openProjectModal]);

    const onSubmit = async (data) => {
        setLocalIsLoading(true);
        const payload = {
            project_name: data.project_name,
            project_description: data.project_description,
            start_date: new Date(data.start_date).toISOString().split("T")[0],
            due_date: new Date(data.due_date).toISOString().split("T")[0],
            customer_id: data.customer_id.value,
        };
        dispatch(addProjectAPI(payload))
            .unwrap()
            .then(() => {
                reset();
                setQuillDescription("");
                if (onProjectAdded) {
                    onProjectAdded();
                }
            })
            .catch((error) => {
                console.error("DEBUG: AddProject addProjectAPI rejected in component:", error);
            })
            .finally(() => {
                setLocalIsLoading(false);
            });
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
            });
            setQuillDescription("");
        }
    }, [openProjectModal, reset]);

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
        'list', 'bullet',
        'link',
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
                                    value={field.value || new Date()}
                                    className="form-control h-[48px]"
                                    onChange={(date) => field.onChange(date[0])}
                                    options={{ altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d" }}
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
                                    value={field.value}
                                    className="form-control h-[48px]"
                                    onChange={(date) => field.onChange(date[0])}
                                    options={{
                                        altInput: true,
                                        altFormat: "F j, Y",
                                        dateFormat: "Y-m-d",
                                        minDate: control._formValues.start_date ? new Date(new Date(control._formValues.start_date).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] : new Date().fp_incr(1)
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
                <FormGroup label="Description" id="add_project_description_quill_fg">
                    <input type="hidden" {...register("project_description")} />
                    <ReactQuill
                        theme="snow"
                        value={quillDescription}
                        onChange={setQuillDescription}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Enter project description..."
                        className={`h-32 ${errors.project_description ? 'ql-error border-danger-500' : ''}`}
                        readOnly={isAdding || localIsLoading}
                    />
                    {errors.project_description && (
                        <div className="mt-1 text-danger-500 text-xs clear-both pt-1">
                            {errors.project_description.message}
                        </div>
                    )}
                </FormGroup>
                <div className="ltr:text-right rtl:text-left pt-2">
                    <button type="submit" className="btn btn-dark text-center mt-4" disabled={localIsLoading || isAdding}>
                        {(localIsLoading || isAdding) ? "Adding..." : "Add Project"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddProject;