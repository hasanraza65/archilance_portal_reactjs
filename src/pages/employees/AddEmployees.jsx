import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { canManageEmployees, getUserRole } from "@/pages/utility/apiHelper";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#94a3b8" : "#cbd5e1",
    borderRadius: "0.375rem",
    minHeight: "42px",
    boxShadow: "none",
    "&:hover": { borderColor: "#94a3b8" },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 8px" }),
  input: (base) => ({ ...base, margin: "0px", padding: "0px" }),
  indicatorSeparator: () => ({ display: "none" }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
    backgroundColor: state.isSelected ? "#0f172a" : state.isFocused ? "#f1f5f9" : null,
    color: state.isSelected ? "white" : "#0f172a",
    ":active": { backgroundColor: "#e2e8f0" },
  }),
};

const EMPLOYEE_TYPE_OPTIONS = [
  { value: "Employee", label: "Employee" },
  { value: "Manager", label: "Manager" },
  { value: "Executive", label: "Executive" },
  { value: "Supervisor", label: "Coordinator" },
  { value: "Outsource", label: "Outsource" },
  { value: "Internee", label: "Internee" },
];

// Teams are fixed labels agreed with management; the backend stores a free
// string, so adding one later is a one-line change here. Used for grouping/
// reporting and to drive which Leave Policy addendum an employee sees.
const EMPLOYEE_TEAM_OPTIONS = [
  { value: "BIM Team", label: "BIM Team" },
  { value: "3D Team", label: "3D Team" },
  { value: "Outsource Department", label: "Outsource Department" },
  { value: "Business Team", label: "Business Team" },
];

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};

const AddEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);

  // The "contract already accepted" toggle is only offered to Admins & Executives.
  const canSetContractStatus = ["admin", "executive"].includes(
    (getUserRole() || "").toLowerCase()
  );
  // Deliberately narrower than who can open this form (supervisors can, but
  // were not included when this field was specced). Widen here if that changes.
  const canSetEmployeeTeam = ["admin", "executive", "manager"].includes(
    (getUserRole() || "").toLowerCase()
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      employee_type: "Employee",
    },
  });

  const passwordValue = watch("password");
  const watchedProfilePic = watch("profile_pic");
  const watchedEmployeeType = watch("employee_type");

  useEffect(() => {
    if (!canManageEmployees()) {
      toast.error("You are not authorized to perform this action.");
      navigate("/employees");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = Cookies.get("token");
      try {
        const apiPath = getApiBasePathForRole("/employee-user");
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
          { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
        );
        const data = res.data;
        setAllEmployees(Array.isArray(data) ? data : data?.data || []);
      } catch (_) {}
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (watchedProfilePic && watchedProfilePic[0]) {
      const file = watchedProfilePic[0];
      const url = URL.createObjectURL(file);
      setProfilePicPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setProfilePicPreview(null);
    }
  }, [watchedProfilePic]);

  const onSubmit = async (formData) => {
    setLoading(true);
    const token = Cookies.get("token");

    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      setLoading(false);
      navigate("/login");
      return;
    }

    // Determine user_role based on employee_type
    let userRoleId;
    switch (formData.employee_type) {
      case "Manager":
        userRoleId = "5";
        break;
      case "Supervisor":
        userRoleId = "6";
        break;
      case "Executive":
        userRoleId = "7";
        break;
      case "Internee":
        userRoleId = "3";
        break;
      default:
        userRoleId = "3";
        break;
    }

    const dataToSubmit = new FormData();
    dataToSubmit.append("name", formData.name);
    dataToSubmit.append("email", formData.email);
    dataToSubmit.append("username", formData.username);
    dataToSubmit.append("phone", formData.phone || "");
    dataToSubmit.append("employee_type", formData.employee_type);
    dataToSubmit.append("user_role", userRoleId);
    if (canSetEmployeeTeam && formData.employee_team) {
      dataToSubmit.append("employee_team", formData.employee_team);
    }
    if (formData.employee_type === "Internee" && formData.internee_manager_id) {
      dataToSubmit.append("internee_manager_id", formData.internee_manager_id);
    }
    if (
      ["Employee", "Manager", "Executive"].includes(formData.employee_type) &&
      formData.manager_id
    ) {
      dataToSubmit.append("manager_id", formData.manager_id);
    }
    dataToSubmit.append("password", formData.password);
    dataToSubmit.append("password_confirmation", formData.password_confirmation);
    // 1 = contract already accepted (login allowed immediately); 0 = must accept
    // the contract before logging in. Only Admins/Executives can set this to 1.
    dataToSubmit.append(
      "contract_status",
      canSetContractStatus && formData.contract_status ? 1 : 0
    );

    if (formData.joining_date) {
      const date = Array.isArray(formData.joining_date)
        ? formData.joining_date[0]
        : new Date(formData.joining_date);
      if (!isNaN(date.getTime())) {
        const formattedDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        dataToSubmit.append("joining_date", formattedDate);
      }
    }

    if (formData.probation_period_end_date) {
      const date = Array.isArray(formData.probation_period_end_date)
        ? formData.probation_period_end_date[0]
        : new Date(formData.probation_period_end_date);
      if (!isNaN(date.getTime())) {
        const formattedDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        dataToSubmit.append("probation_period_end_date", formattedDate);
      }
    }

    if (formData.profile_pic && formData.profile_pic[0]) {
      dataToSubmit.append("profile_pic", formData.profile_pic[0]);
    }

    try {
      const apiPath = getApiBasePathForRole("/employee-user");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        dataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Employee added successfully!");
      navigate("/employees");
    } catch (error) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          toast.error(`${key}: ${backendErrors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to add employee.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Add New Employee">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-6">
          {/* Personal Information Section */}
          <div>
            <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4 flex items-center">
              <Icon icon="heroicons-outline:user" className="mr-2" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Textinput
                label="Full Name*"
                name="name"
                type="text"
                placeholder="Enter full name"
                register={register}
                validate={{ required: "Full name is required" }}
                error={errors.name}
              />
              <Textinput
                label="Email Address*"
                name="email"
                type="email"
                placeholder="Enter email address"
                register={register}
                validate={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                error={errors.email}
              />
              <Textinput
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+923001234567"
                register={register}
                error={errors.phone}
              />
              <div>
                <label className="form-label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      id="profile_pic"
                      className="form-control py-2 px-3 w-full"
                      {...register("profile_pic")}
                      accept="image/*"
                    />
                  </div>
                  {profilePicPreview && (
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-none ring-2 ring-primary-500">
                      <img
                        src={profilePicPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* Account & Administration Section */}
          <div>
            <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4 flex items-center">
              <Icon icon="heroicons-outline:cog" className="mr-2" />
              Account & Administration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Textinput
                label="Username*"
                name="username"
                type="text"
                placeholder="Enter username"
                register={register}
                validate={{ required: "Username is required" }}
                error={errors.username}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="employee_type" className="form-label mb-1">
                    Employee Type*
                  </label>
                  <Controller
                    name="employee_type"
                    control={control}
                    rules={{ required: "Type is required" }}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        inputId="employee_type"
                        options={EMPLOYEE_TYPE_OPTIONS}
                        styles={selectStyles}
                        classNamePrefix="react-select"
                        value={EMPLOYEE_TYPE_OPTIONS.find((o) => o.value === value) || null}
                        onChange={(opt) => onChange(opt ? opt.value : "")}
                        placeholder="Select type"
                      />
                    )}
                  />
                  {errors.employee_type && (
                    <p className="text-danger-500 text-xs mt-1">{errors.employee_type.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="joining_date" className="form-label mb-1">
                    Joining Date
                  </label>
                  <Controller
                    name="joining_date"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Flatpickr
                        value={value || ""}
                        className="form-control py-2"
                        placeholder="Select date"
                        onChange={onChange}
                        options={{ altInput: true, altFormat: "M j, Y", dateFormat: "Y-m-d" }}
                      />
                    )}
                  />
                </div>
              </div>

              {canSetEmployeeTeam && (
                <div>
                  <label htmlFor="employee_team" className="form-label mb-1">
                    Team
                  </label>
                  <Controller
                    name="employee_team"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        inputId="employee_team"
                        options={EMPLOYEE_TEAM_OPTIONS}
                        styles={selectStyles}
                        classNamePrefix="react-select"
                        value={EMPLOYEE_TEAM_OPTIONS.find((o) => o.value === value) || null}
                        onChange={(opt) => onChange(opt ? opt.value : "")}
                        placeholder="No team"
                        isClearable
                      />
                    )}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Optional — used for grouping, reporting, and which Leave Policy addendum applies.
                  </p>
                </div>
              )}

              {canSetContractStatus && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("contract_status")}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Contract already accepted
                      </span>
                      <span className="block text-xs text-slate-400 mt-0.5">
                        Tick this only if the employee has already signed their contract. When
                        left unticked, they must accept the contract you send before they can log
                        in.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="probation_period_end_date" className="form-label mb-1">
                    Probation Period End Date
                  </label>
                  <Controller
                    name="probation_period_end_date"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Flatpickr
                        value={value || ""}
                        className="form-control py-2"
                        placeholder="Select date"
                        onChange={onChange}
                        options={{ altInput: true, altFormat: "M j, Y", dateFormat: "Y-m-d" }}
                      />
                    )}
                  />
                </div>
                {["Employee", "Manager", "Executive"].includes(watchedEmployeeType) && (
                  <div>
                    <label htmlFor="manager_id" className="form-label mb-1">
                      Manager
                    </label>
                    <Controller
                      name="manager_id"
                      control={control}
                      render={({ field: { onChange, value } }) => {
                        const managerOptions = allEmployees
                          .filter((emp) => emp.employee_type === "Manager")
                          .map((emp) => ({ value: emp.id, label: emp.name }));
                        return (
                          <Select
                            inputId="manager_id"
                            options={managerOptions}
                            styles={selectStyles}
                            classNamePrefix="react-select"
                            value={managerOptions.find((o) => String(o.value) === String(value)) || null}
                            onChange={(opt) => onChange(opt ? opt.value : "")}
                            placeholder="Select Manager"
                            isClearable
                          />
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              {watchedEmployeeType === "Internee" && (
                <div className="md:col-span-2">
                  <label htmlFor="internee_manager_id" className="form-label mb-1">
                    Internee Manager*
                  </label>
                  <Controller
                    name="internee_manager_id"
                    control={control}
                    rules={{ required: "Manager is required for Internee" }}
                    render={({ field: { onChange, value } }) => {
                      const managerOptions = allEmployees.map((emp) => ({ value: emp.id, label: emp.name }));
                      return (
                        <Select
                          inputId="internee_manager_id"
                          options={managerOptions}
                          styles={selectStyles}
                          classNamePrefix="react-select"
                          value={managerOptions.find((o) => String(o.value) === String(value)) || null}
                          onChange={(opt) => onChange(opt ? opt.value : "")}
                          placeholder="Select Manager"
                          isClearable
                        />
                      );
                    }}
                  />
                  {errors.internee_manager_id && (
                    <p className="text-danger-500 text-xs mt-1">{errors.internee_manager_id.message}</p>
                  )}
                </div>
              )}

              <Textinput
                label="Password*"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                hasicon
                register={register}
                validate={{
                  required: "Password is required",
                  minLength: { value: 8, message: "Minimum 8 characters" },
                }}
                error={errors.password}
              />
              <Textinput
                label="Confirm Password*"
                name="password_confirmation"
                type="password"
                placeholder="Re-enter password"
                hasicon
                register={register}
                validate={{
                  required: "Please confirm password",
                  validate: (val) => val === passwordValue || "Passwords do not match",
                }}
                error={errors.password_confirmation}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              text="Cancel"
              className="btn-outline-secondary"
              type="button"
              onClick={() => navigate("/employees")}
              disabled={loading}
            />
            <Button
              text={loading ? "Creating..." : "Add Employee"}
              className="btn-dark"
              type="submit"
              isLoading={loading}
              disabled={loading}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddEmployee;
