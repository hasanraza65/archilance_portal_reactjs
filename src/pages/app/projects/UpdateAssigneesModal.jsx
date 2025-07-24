import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { toggleUpdateAssigneesModal, updateProjectAssigneesAPI } from "./store";

const UpdateAssigneesModal = () => {
  const { updateAssigneesModal, projectToUpdateAssignees, isUpdating } = useSelector((state) => state.project);
  const dispatch = useDispatch();

  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(new Set());
  const [initialEmployeeIds, setInitialEmployeeIds] = useState(new Set());
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Function to map API user data to a consistent local format
  const mapApiUserToLocal = (user) => {
    if (!user) return null;
    const name = user.name || "Unknown User";
    const avatarChar = name?.charAt(0).toUpperCase() || "U";
    let profilePic = null;
    if (user.profile_pic) {
        profilePic = user.profile_pic.startsWith('http') ? user.profile_pic : `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${user.profile_pic}`;
    }
    let color = 'bg-slate-500';
    if (user.id) {
        const colors = ["bg-red-500", "bg-orange-500", "bg-green-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500"];
        color = colors[user.id % colors.length];
    }
    return { id: user.id, name, profilePic, avatar: avatarChar, color };
  };

  // Effect to fetch employees and set initial state when modal opens
  useEffect(() => {
    if (updateAssigneesModal) {
      // Set initial and selected IDs from the project data
      const currentIds = new Set(
        projectToUpdateAssignees?.project_assignees
          ?.filter(a => a.user)
          .map(a => String(a.user.id)) || []
      );
      setSelectedEmployeeIds(currentIds);
      setInitialEmployeeIds(currentIds);

      // Fetch all employees if the list is empty
      if (allEmployees.length === 0) {
        fetchAllEmployees();
      }
    } else {
      // Reset state when modal closes
      setSearchTerm("");
      setAllEmployees([]);
    }
  }, [updateAssigneesModal]);

  // Fetches the full list of employees from the API
  const fetchAllEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const token = Cookies.get("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/employee-user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const employeesData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const mapped = employeesData.map(mapApiUserToLocal).filter(Boolean);
      setAllEmployees(mapped);
    } catch (error) {
      toast.error("Failed to load employee list.");
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

  const handleClose = () => {
    dispatch(toggleUpdateAssigneesModal({ open: false, project: null }));
  };
  
  // Dispatches the update action to the Redux store
  const handleUpdate = () => {
    const payload = {
      project_id: projectToUpdateAssignees.id,
      employee_ids: Array.from(selectedEmployeeIds).map(id => parseInt(id, 10)),
    };
    dispatch(updateProjectAssigneesAPI(payload)).unwrap().then(() => {
        toast.success("Assignees updated successfully!");
        handleClose();
    }).catch((err) => {
        toast.error(err?.message || err || "Failed to update assignees.");
    });
  };

  // Filter employees based on the search term
  const filteredEmployees = allEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if any changes have been made to disable the save button
  const noChangesMade = 
    selectedEmployeeIds.size === initialEmployeeIds.size &&
    [...selectedEmployeeIds].every(id => initialEmployeeIds.has(id));

  const modalTitle = `Update Assignees for "${projectToUpdateAssignees?.project_name || 'Project'}"`;

  return (
    <Modal
      title={modalTitle}
      activeModal={updateAssigneesModal}
      onClose={handleClose}
      className="max-w-lg"
    >
        <div className="flex flex-col max-h-[70vh]">
            {/* Search Input */}
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

            {/* Employee List */}
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
                            disabled={isUpdating}
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

            {/* Footer with Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={isUpdating}
                    className="btn btn-light"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={isUpdating || noChangesMade || isLoadingEmployees}
                    className="btn btn-dark"
                >
                    {isUpdating ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default UpdateAssigneesModal;