import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { canManageEmployees, getApiPrefix, getMediaUrl, getUserRole } from "@/pages/utility/apiHelper";
import { toast } from "react-toastify";

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

const EditEmployee = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  // Deliberately narrower than who can open this form (supervisors can, but
  // were not included when this field was specced). Widen here if that changes.
  const canSetEmployeeTeam = ["admin", "executive", "manager"].includes(
    (getUserRole() || "").toLowerCase()
  );

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    watch,
    reset,
    setValue,
    control,
  } = useForm({
    mode: "onChange",
  });

  const [currentProfilePicUrl, setCurrentProfilePicUrl] = useState("");
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [interneeManagerId, setInterneeManagerId] = useState("");
  const [managerId, setManagerId] = useState("");

  const watchedProfilePicFile = watch("profile_pic");
  const passwordValue = watch("password");
  const watchedEmployeeType = watch("employee_type");
  
  const getApiBasePathForRole = (basePath) => {
    const role = getApiPrefix();
    const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
    if (role) {
      return `/api/${role}${cleanBasePath}`;
    }
    return `/api/admin${cleanBasePath}`;
  };

  useEffect(() => {
    if (!canManageEmployees()) {
      toast.error("You do not have permission to edit employees.");
      navigate(-1);
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
    let objectUrl = null;
    if (watchedProfilePicFile && watchedProfilePicFile[0]) {
      const file = watchedProfilePicFile[0];
      objectUrl = URL.createObjectURL(file);
      setProfilePicPreview(objectUrl);
    } else if (currentProfilePicUrl) {
      setProfilePicPreview(currentProfilePicUrl);
    } else {
      setProfilePicPreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [watchedProfilePicFile, currentProfilePicUrl]);

  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = Cookies.get("token");
    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const apiPath = getApiBasePathForRole("/employee-user");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.id
      ) {
        const employee = response.data;
        reset({
          name: employee.name || "",
          email: employee.email || "",
          username: employee.username || "",
          phone: employee.phone
            ? String(employee.phone).replace(/[\r\n]+/g, "")
            : "",
          employee_type: employee.employee_type || "Employee",
          employee_team: employee.employee_team || "",
          joining_date: employee.joining_date || null,
          probation_period_end_date: employee.probation_period_end_date || null,
          internee_manager_id: employee.internee_manager_id ? String(employee.internee_manager_id) : "",
          manager_id: employee.manager_id ? String(employee.manager_id) : "",
          password: "",
          password_confirmation: "",
        });
        setInterneeManagerId(employee.internee_manager_id ? String(employee.internee_manager_id) : "");
        setManagerId(employee.manager_id ? String(employee.manager_id) : "");
        if (employee.profile_pic) {
          const picUrl = getMediaUrl(employee.profile_pic);
          setCurrentProfilePicUrl(picUrl);
          setProfilePicPreview(picUrl);
        } else {
          setCurrentProfilePicUrl("");
          setProfilePicPreview(null);
        }
      } else {
        setFetchError(
          "Failed to load employee data or data is in unexpected format."
        );
      }
    } catch (err) {
      setFetchError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load employee data."
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId, reset]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  // The manager <select>'s options only exist once allEmployees has loaded.
  // If that arrives after reset() already ran, the browser can't match the
  // value to an option, so re-apply it once the options are actually there.
  useEffect(() => {
    if (interneeManagerId && allEmployees.length > 0) {
      setValue("internee_manager_id", interneeManagerId);
    }
  }, [allEmployees, interneeManagerId, setValue]);

  useEffect(() => {
    if (managerId && allEmployees.length > 0) {
      setValue("manager_id", managerId);
    }
  }, [allEmployees, managerId, setValue]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError(null);
    const token = Cookies.get("token");
    if (!token) {
      setSubmitError("Authentication token not found.");
      setSubmitting(false);
      return;
    }

    // --- UPDATED CODE ---
    // Determine the user_role ID based on the selected employee_type
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
      case "Employee":
      case "Outsource":
      default:
        userRoleId = "3";
        break;
    }
    // --- END OF UPDATE ---

    const dataToSubmit = new FormData();
    dataToSubmit.append("name", formData.name);
    dataToSubmit.append("email", formData.email);
    dataToSubmit.append("username", formData.username);
    dataToSubmit.append("phone", formData.phone || "");
    dataToSubmit.append("employee_type", formData.employee_type);
    dataToSubmit.append("user_role", userRoleId);
    if (canSetEmployeeTeam) {
      dataToSubmit.append("employee_team", formData.employee_team || "");
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

    if (formData.joining_date) {
      const date = Array.isArray(formData.joining_date)
        ? formData.joining_date[0]
        : new Date(formData.joining_date);

      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        dataToSubmit.append("joining_date", formattedDate);
      }
    }

    if (formData.probation_period_end_date) {
      const date = Array.isArray(formData.probation_period_end_date)
        ? formData.probation_period_end_date[0]
        : new Date(formData.probation_period_end_date);

      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        dataToSubmit.append("probation_period_end_date", formattedDate);
      }
    }

    dataToSubmit.append("_method", "PUT");

    if (formData.profile_pic && formData.profile_pic[0]) {
      const fileToUpload = formData.profile_pic[0];
      dataToSubmit.append("profile_pic", fileToUpload);
    }

    if (formData.password) {
      dataToSubmit.append("password", formData.password);
      dataToSubmit.append(
        "password_confirmation",
        formData.password_confirmation
      );
    }

    try {
      const apiPath = getApiBasePathForRole("/employee-user");
      await axios.post(
         `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${employeeId}`,
        dataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      toast.success("Employee updated successfully!");
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstErrorKey = Object.keys(errors)[0];
        setSubmitError(`${firstErrorKey}: ${errors[firstErrorKey][0]}`);
      } else {
        setSubmitError(
          err.response?.data?.message ||
            err.message ||
            "Failed to update employee."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card title="Loading Employee Data...">
        <div className="p-6 text-center">Please wait...</div>
      </Card>
    );
  }

  if (fetchError) {
    return (
      <Card title="Error">
        <div className="p-6">
          <Alert
            className="alert-danger light-mode mb-4"
            icon="heroicons-outline:exclamation-triangle"
          >
            {fetchError}
          </Alert>
          <Button
            text="Go Back"
            className="btn-dark mt-4"
            onClick={() => navigate("/employees")}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Edit Employee: ${watch("name") || "Details"}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-6">
        {submitError && (
          <Alert
            toggle={() => setSubmitError(null)}
            className="alert-danger light-mode"
          >
            {submitError}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textinput
            label="Full Name*"
            name="name"
            type="text"
            placeholder="Enter full name"
            register={register}
            validate={{ required: "Full Name is required" }}
            error={formErrors.name}
          />
          <Textinput
            label="Email*"
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
            error={formErrors.email}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textinput
            label="Username*"
            name="username"
            type="text"
            placeholder="Enter username"
            register={register}
            validate={{ required: "Username is required" }}
            error={formErrors.username}
          />
          <Textinput
            label="Phone"
            name="phone"
            type="tel"
            placeholder="Enter phone number"
            register={register}
            error={formErrors.phone}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="employee_type" className="form-label">
              Employee Type*
            </label>
            <Controller
              name="employee_type"
              control={control}
              rules={{ required: "Employee type is required" }}
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
            {formErrors.employee_type && (
              <p className="text-danger-500 text-xs mt-1">
                {formErrors.employee_type.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="joining_date" className="form-label">
              Joining Date
            </label>
            <Controller
              name="joining_date"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Flatpickr
                  value={value || ""}
                  className={`form-control py-2 ${
                    formErrors.joining_date ? "border-danger-500" : ""
                  }`}
                  placeholder="Select joining date"
                  onChange={onChange}
                  options={{
                    altInput: true,
                    altFormat: "M j, Y",
                    dateFormat: "Y-m-d",
                  }}
                />
              )}
            />
            {formErrors.joining_date && (
              <p className="text-danger-500 text-xs mt-1">
                {formErrors.joining_date.message}
              </p>
            )}
          </div>
        </div>

        {canSetEmployeeTeam && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="employee_team" className="form-label">
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
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="probation_period_end_date" className="form-label">
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
              <label htmlFor="manager_id" className="form-label">
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
          <div>
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
            {formErrors.internee_manager_id && (
              <p className="text-danger-500 text-xs mt-1">{formErrors.internee_manager_id.message}</p>
            )}
          </div>
        )}

        <div>
          <label
            className="form-label"
            htmlFor="profile_pic_input_edit_employee"
          >
            Profile Picture
          </label>
          <input
            type="file"
            id="profile_pic_input_edit_employee"
            className="form-control py-2 px-3"
            {...register("profile_pic")}
            accept="image/png, image/jpeg, image/gif"
          />
          {profilePicPreview && (
            <div className="mt-2 w-24 h-24 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700">
              <img
                src={profilePicPreview}
                alt="Profile Preview"
                className="object-cover w-full h-full"
              />
            </div>
          )}
          {formErrors.profile_pic && (
            <div className="text-danger-500 text-xs mt-1">
              {formErrors.profile_pic.message}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
          <h6 className="text-slate-600 dark:text-slate-300 text-base font-medium mb-4">
            Update Password (optional)
          </h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Textinput
              label="New Password"
              name="password"
              type="password"
              hasicon
              placeholder="Leave blank to keep current"
              register={register}
              validate={{
                minLength: passwordValue
                  ? {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    }
                  : undefined,
              }}
              error={formErrors.password}
            />
            <Textinput
              label="Confirm New Password"
              name="password_confirmation"
              type="password"
              hasicon
              placeholder="Confirm new password"
              register={register}
              validate={{
                validate: (value) =>
                  passwordValue
                    ? value === passwordValue || "The passwords do not match"
                    : true,
              }}
              error={formErrors.password_confirmation}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            text="Cancel"
            className="btn-outline-secondary"
            type="button"
            onClick={() => navigate("/employees")}
            disabled={submitting}
          />
          <Button
            text={submitting ? "Updating..." : "Update Employee"}
            className="btn-dark"
            type="submit"
            isLoading={submitting}
            disabled={submitting || Object.keys(formErrors).length > 0}
          />
        </div>
      </form>
    </Card>
  );
};

export default EditEmployee;