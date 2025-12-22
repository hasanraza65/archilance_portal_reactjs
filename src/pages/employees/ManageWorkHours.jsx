import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import Swal from "sweetalert2";
import "sweetalert2/src/sweetalert2.scss";

const ManageWorkHours = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [workSlots, setWorkSlots] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const getApiBasePathForRole = (basePath) => {
    const role = getApiPrefix();
    const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
    if (role) {
      return `/api/${role}${cleanBasePath}`;
    }
    return `/api/admin${cleanBasePath}`;
  };

  const fetchEmployeeDetails = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) return;
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
      if (response.data && response.data.id) {
        setEmployee(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch employee name", err);
      // We don't block the UI if name fetch fails, just show generic title
    }
  }, [employeeId]);

  const fetchWorkHours = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication token not found.");
      setLoading(false);
      return;
    }

    try {
      const apiPath = getApiBasePathForRole(`/working-hours/${employeeId}`);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.data.data) {
        setWorkSlots(response.data.data);
      } else if (Array.isArray(response.data)) {
        setWorkSlots(response.data);
      } else {
        setWorkSlots([]);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch work hours."
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) {
      fetchWorkHours();
      fetchEmployeeDetails();
    }
  }, [fetchWorkHours, fetchEmployeeDetails, employeeId]);

  const onSubmit = async (data) => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication details missing.");
      return;
    }

    try {
      const payload = {
        start_time: data.start_time,
        end_time: data.end_time,
        employee_id: employeeId,
      };

      if (isEditing) {
        const apiPath = getApiBasePathForRole(
          `/working-hours/${editingSlotId}`
        );
        await axios.put(
          `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        toast.success("Work slot updated successfully.");
      } else {
        const apiPath = getApiBasePathForRole("/working-hours");
        await axios.post(
          `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        toast.success("Work slot added successfully.");
      }

      reset({ start_time: "", end_time: "" });
      setIsEditing(false);
      setEditingSlotId(null);
      fetchWorkHours();
    } catch (err) {
      const msg = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      let errorDisplay = msg || "An error occurred.";

      if (validationErrors) {
        const details = Object.values(validationErrors).flat().join(" ");
        errorDisplay = details; // Often validation errors are more descriptive on their own
      }
      toast.error(errorDisplay);
    }
  };

  const handleEdit = (slot) => {
    setIsEditing(true);
    setEditingSlotId(slot.id);
    setValue("start_time", slot.start_time);
    setValue("end_time", slot.end_time);
    // Scroll to form if needed, or if it's sticky/visible not needed.
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingSlotId(null);
    reset({ start_time: "", end_time: "" });
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = Cookies.get("token");
        try {
          const apiPath = getApiBasePathForRole(`/working-hours/${id}`);
          await axios.delete(
            `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

          Swal.fire("Deleted!", "Work slot has been deleted.", "success");
          fetchWorkHours();
        } catch (err) {
          Swal.fire(
            "Error!",
            err.response?.data?.message ||
              err.message ||
              "Failed to delete work slot.",
            "error"
          );
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h4 className="font-semibold text-xl text-slate-900 dark:text-white leading-tight">
            Manage Work Hours
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
            {employee
              ? `Schedule for ${employee.name} (${employee.email})`
              : "Loading employee details..."}
          </p>
        </div>
        <Button
          icon="heroicons-outline:arrow-left"
          text="Back to Employees"
          className="btn-outline-dark w-full md:w-auto text-sm py-2 px-4 bg-white dark:bg-slate-800"
          onClick={() => navigate("/employees")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <Card title={isEditing ? "Edit Work Slot" : "Add New Slot"}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {isEditing
                  ? "Update the time range for this slot."
                  : "Define a new working time range for this employee."}
              </div>
              <Textinput
                name="start_time"
                label="Start Time"
                type="time"
                register={register}
                error={errors.start_time}
                required
                placeholder="Select start time"
              />
              <Textinput
                name="end_time"
                label="End Time"
                type="time"
                register={register}
                error={errors.end_time}
                required
                placeholder="Select end time"
              />

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  text={isEditing ? "Update Slot" : "Add Work Slot"}
                  className={`w-full ${
                    isEditing ? "btn-warning" : "btn-primary"
                  }`}
                  isLoading={isSubmitting}
                  type="submit"
                  icon={
                    isEditing ? "heroicons:pencil-square" : "heroicons:plus"
                  }
                />
                {isEditing && (
                  <Button
                    text="Cancel Edit"
                    className="btn-outline-danger w-full"
                    onClick={handleCancelEdit}
                    type="button"
                    icon="heroicons:x-mark"
                  />
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* List Card */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <Card title="Current Work Schedule" noPadding>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                      <p className="mt-2 text-slate-500 text-sm">
                        Loading slots...
                      </p>
                    </div>
                  ) : workSlots.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <Icon
                          icon="heroicons:clock"
                          className="text-3xl text-slate-400"
                        />
                      </div>
                      <h5 className="text-slate-600 dark:text-slate-300 font-medium mb-1">
                        No work slots found
                      </h5>
                      <p className="text-slate-500 text-sm">
                        Add a new slot using the form to get started.
                      </p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th
                            scope="col"
                            className="table-th text-left p-3 md:p-4 text-xs md:text-sm"
                          >
                            Start Time
                          </th>
                          <th
                            scope="col"
                            className="table-th text-left p-3 md:p-4 text-xs md:text-sm"
                          >
                            End Time
                          </th>
                          <th
                            scope="col"
                            className="table-th text-left p-3 md:p-4 text-xs md:text-sm w-24"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                        {workSlots.map((slot) => (
                          <tr
                            key={slot.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="table-td p-3 md:p-4 text-xs md:text-sm font-medium text-slate-900 dark:text-slate-200">
                              {slot.start_time}
                            </td>
                            <td className="table-td p-3 md:p-4 text-xs md:text-sm font-medium text-slate-900 dark:text-slate-200">
                              {slot.end_time}
                            </td>
                            <td className="table-td p-3 md:p-4 text-left">
                              <div className="flex justify-start space-x-2 md:space-x-3 rtl:space-x-reverse">
                                <Tooltip
                                  content="Edit"
                                  placement="top"
                                  arrow
                                  animation="shift-away"
                                >
                                  <button
                                    className="action-btn h-8 w-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-all duration-200"
                                    type="button"
                                    onClick={() => handleEdit(slot)}
                                  >
                                    <Icon
                                      icon="heroicons:pencil-square"
                                      className="text-lg text-slate-500 dark:text-slate-300"
                                    />
                                  </button>
                                </Tooltip>
                                <Tooltip
                                  content="Delete"
                                  placement="top"
                                  arrow
                                  animation="shift-away"
                                  theme="danger"
                                >
                                  <button
                                    className="action-btn h-8 w-8 flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-md transition-all duration-200"
                                    type="button"
                                    onClick={() => handleDelete(slot.id)}
                                  >
                                    <Icon
                                      icon="heroicons:trash"
                                      className="text-lg text-red-500"
                                    />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManageWorkHours;
