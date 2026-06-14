import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import { getApiBasePathForRole, getMediaUrl } from "@/pages/utility/apiHelper";

const getAuthToken = () => Cookies.get("token");

const mapApiUserToLocal = (user) => {
    if (!user) return null;
    const name = user.name || "Unknown User";
    const avatarChar = name?.charAt(0).toUpperCase() || "U";
    let profilePic = null;
    if (user.profile_pic) {
        profilePic = getMediaUrl(user.profile_pic);
    }
    let color = 'bg-slate-500';
    if (user.id) {
        const colors = ["bg-red-500", "bg-orange-500", "bg-green-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500"];
        color = colors[user.id % colors.length];
    }
    return { id: user.id, name, profilePic, avatar: avatarChar, color };
};

const TaskListAssignee = ({ activeModal, onClose, task, onUpdate }) => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(new Set());
  const [initialEmployeeIds, setInitialEmployeeIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (activeModal) {
      const currentIds = new Set(
        task?.assignees
          ?.filter(a => a.user)
          .map(a => String(a.user.id)) || []
      );
      setSelectedEmployeeIds(currentIds);
      setInitialEmployeeIds(currentIds);
      fetchAllEmployees();
    } else {
      setSearchTerm("");
      setAllEmployees([]);
    }
  }, [activeModal, task]);

  const fetchAllEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const token = getAuthToken();
      const apiPath = getApiBasePathForRole("/employee-user");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const employeesData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const mapped = employeesData.map(mapApiUserToLocal).filter(Boolean);
      setAllEmployees(mapped);
    } catch (error) {
      Swal.fire("Error!", "Failed to load employee list.", "error");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleToggleEmployee = (employeeId) => {
    const idStr = String(employeeId);
    setSelectedEmployeeIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(idStr)) {
        newSelected.delete(idStr);
      } else {
        newSelected.add(idStr);
      }
      return newSelected;
    });
  };

  // --- YAHAN API CALL KO SAHI KIYA GAYA HAI ---
  const handleUpdateAssignees = async () => {
    if (!task) return;
    setIsLoading(true);
    const token = getAuthToken();

    try {
      // 1. Sahi API Endpoint Istemal Karein
      const apiPath = getApiBasePathForRole(`/bulk-assign`);

      // 2. Naye format (FormData) mein Payload banayein
      const formData = new FormData();
      formData.append('task_id', task.id);
      
      // Sabhi selected IDs ko 'employee_ids[]' ke naam se append karein
      const employeeIds = Array.from(selectedEmployeeIds);
      if (employeeIds.length > 0) {
        employeeIds.forEach(id => {
            formData.append('employee_ids[]', id);
        });
      } else {
        // Agar koi bhi select nahi hai, toh ek khaali array bhejein
        // Taa ki backend sabhi assignees ko हटा de
        formData.append('employee_ids[]', '');
      }
      
      await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        formData, // FormData object ko bhejein
        { 
            headers: { 
                Authorization: `Bearer ${token}`,
                // Content-Type header yahan set na karein. Axios FormData ke liye
                // 'multipart/form-data' aur boundary khud set kar dega.
            } 
        }
      );

      Swal.fire("Success!", "Assignees updated successfully.", "success");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Update failed:", error.response);
      Swal.fire("Failed!", error.response?.data?.message || "Could not update assignees.", "error");
    } finally {
      setIsLoading(false);
    }
  };
  // --- BADLAV KHATAM ---
  
  const filteredEmployees = allEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const noChangesMade = 
    selectedEmployeeIds.size === initialEmployeeIds.size &&
    [...selectedEmployeeIds].every(id => initialEmployeeIds.has(id));

  return (
    <Modal
      title={`Update Assignees for "${task?.task_title || "Task"}"`}
      activeModal={activeModal}
      onClose={onClose}
      className="max-w-lg"
    >
        <div className="flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <Icon icon="heroicons-outline:search" className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        className="form-input w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto flex-grow">
                {isLoadingEmployees ? (
                    <div className="text-center py-10 text-slate-500">Loading employees...</div>
                ) : filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                    <label
                        key={employee.id}
                        className="flex items-center space-x-3 p-3 mx-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                    >
                        <input
                            type="checkbox"
                            className="h-5 w-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0 focus:ring-2"
                            checked={selectedEmployeeIds.has(String(employee.id))}
                            onChange={() => handleToggleEmployee(employee.id)}
                            disabled={isLoading}
                        />
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {employee.profilePic ? (
                                <img src={employee.profilePic} alt={employee.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <span className={`w-8 h-8 ${employee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold`}>
                                {employee.avatar}
                                </span>
                            )}
                            <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{employee.name}</span>
                        </div>
                    </label>
                    ))
                ) : (
                    <p className="text-slate-500 text-center py-10">
                    {allEmployees.length > 0 ? 'No employees match your search.' : 'No employees available.'}
                    </p>
                )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="btn btn-light"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleUpdateAssignees}
                    disabled={isLoading || noChangesMade || isLoadingEmployees}
                    className="btn btn-dark"
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default TaskListAssignee;