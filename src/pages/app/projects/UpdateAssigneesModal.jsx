import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import Select from "react-select";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { toggleUpdateAssigneesModal, updateProjectAssigneesAPI } from "./store";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const selectStyles = {
  control: (base) => ({...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '38px', '&:hover': {borderColor: '#cbd5e1',}, boxShadow: 'none', }),
  valueContainer: (base) => ({...base, padding: '2px 8px',}),
  input: (base) => ({...base, margin: '0px', padding: '0px',}),
  indicatorSeparator: () => ({display: 'none',}),
  indicatorsContainer: (base) => ({...base, height: '38px',}),
  option: (provided, state) => ({...provided, fontSize: "14px", backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f1f5f9' : null, color: state.isSelected ? 'white' : '#0f172a', ':active': {backgroundColor: '#e2e8f0',},}),
};

const UpdateAssigneesModal = () => {
  const { updateAssigneesModal, projectToUpdateAssignees, isUpdating } = useSelector((state) => state.project);
  const dispatch = useDispatch();
  const userRole = getApiPrefix();

  const [mode, setMode] = useState("view");
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    if (updateAssigneesModal && projectToUpdateAssignees?.project_assignees) {
      const currentAssignees = projectToUpdateAssignees.project_assignees
        .filter(assignee => assignee.user)
        .map(assignee => ({
          value: assignee.user.id.toString(),
          label: assignee.user.name,
        }));
      setSelectedEmployees(currentAssignees);
    }
    
    if (!updateAssigneesModal) {
      setMode("view");
      setAllEmployees([]);
    }
  }, [updateAssigneesModal, projectToUpdateAssignees]);

  const fetchAllEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const token = Cookies.get("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/employee-user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllEmployees(res.data.map(e => ({ value: e.id.toString(), label: e.name })));
    } catch (error) {
      toast.error("Failed to load employee list.");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleSwitchToEdit = () => {
    setMode("edit");
    if (allEmployees.length === 0) {
      fetchAllEmployees();
    }
  };

  const handleClose = () => {
    dispatch(toggleUpdateAssigneesModal({ open: false, project: null }));
  };
  
  const handleUpdate = () => {
    const payload = {
      project_id: projectToUpdateAssignees.id,
      employee_ids: selectedEmployees.map(emp => emp.value),
    };
    dispatch(updateProjectAssigneesAPI(payload)).unwrap().then(() => {
        toast.success("Assignees updated successfully!");
        handleClose();
    }).catch((err) => {
        toast.error(err || "Failed to update assignees.");
    });
  };

  const project = projectToUpdateAssignees;

  return (
    <Modal
      title={mode === 'view' ? `Assignees for "${project?.name}"` : `Update Assignees for "${project?.name}"`}
      activeModal={updateAssigneesModal}
      onClose={handleClose}
    >
      {mode === 'view' && (
        <div>
          <div className="flex justify-end mb-4">
            {userRole === 'admin' && (
              <button
                className="btn btn-outline-dark text-sm"
                onClick={handleSwitchToEdit}
              >
                <Icon icon="heroicons-outline:pencil-alt" className="w-4 h-4 mr-2" />
                Update Assignees
              </button>
            )}
          </div>
          <ul className="space-y-3">
            {project?.project_assignees && project.project_assignees.length > 0 ? (
              project.project_assignees.map(({ id, user }) => {
                if (!user) return null;
                const avatarUrl = user.profile_pic ? `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${user.profile_pic}` : null;
                return (
                  <li key={id} className="flex items-center space-x-3 p-2 rounded-md bg-slate-50 dark:bg-slate-700">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                      {avatarUrl ? (
                         <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="font-bold text-slate-700 dark:text-slate-300">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </li>
                );
              })
            ) : (
              <p className="text-center text-slate-500 py-4">No employees assigned to this project.</p>
            )}
          </ul>
        </div>
      )}

      {mode === 'edit' && (
        <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
                Select employees to assign to this project. The existing list will be replaced with your new selection.
            </p>
            <Select
                isMulti
                options={allEmployees}
                value={selectedEmployees}
                onChange={setSelectedEmployees}
                isLoading={isLoadingEmployees}
                placeholder={isLoadingEmployees ? "Loading employees..." : "Select employees..."}
                styles={selectStyles}
                closeMenuOnSelect={false}
                isDisabled={isUpdating}
            />
            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setMode('view')}
                    disabled={isUpdating}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn btn-dark"
                    onClick={handleUpdate}
                    disabled={isUpdating || isLoadingEmployees}
                >
                    {isUpdating ? "Updating..." : "Save Changes"}
                </button>
            </div>
        </div>
      )}
    </Modal>
  );
};

export default UpdateAssigneesModal;