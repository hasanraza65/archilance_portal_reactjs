// src/components/TaskDetails/PartialTask/AssigneeModal.jsx
import React, { useState, useEffect } from "react";
import { mapApiUserToLocal } from "./taskDetailsUtils"; // Assuming this path is correct relative to AssigneeModal

const AssigneeModal = ({
  isOpen,
  onClose,
  allEmployees, // Raw employee objects from API
  currentAssigneeIds, // Array of user IDs currently assigned
  onSaveAssignees, // Function to call: (taskId, selectedEmployeeIdsArray) => {}
  taskId,
  isUpdating, // Boolean, true if save operation is in progress
}) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState(''); // State for the search term

  useEffect(() => {
    if (isOpen) {
      setSelectedEmployeeIds(new Set(currentAssigneeIds.map(id => String(id))));
      setSearchTerm(''); // Reset search term when modal opens
    }
  }, [isOpen, currentAssigneeIds]);

  const handleToggleEmployee = (employeeId) => {
    const idStr = String(employeeId);
    setSelectedEmployeeIds((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(idStr)) {
        newSelected.delete(idStr);
      } else {
        newSelected.add(idStr);
      }
      return newSelected;
    });
  };

  const handleSave = () => {
    onSaveAssignees(taskId, Array.from(selectedEmployeeIds).map(id => parseInt(id, 10)));
  };

  if (!isOpen) return null;

  // Map all employees once
  const allMappedEmployees = allEmployees.map(emp => mapApiUserToLocal(emp)).filter(Boolean);

  // Filter employees based on search term
  const filteredMappedEmployees = allMappedEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentIdsSet = new Set(currentAssigneeIds.map(id => String(id)));
  const noChangesMade = selectedEmployeeIds.size === currentIdsSet.size &&
                        Array.from(selectedEmployeeIds).every(id => currentIdsSet.has(id));

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800">Assign Users to Task</h3>
        </div>

        {/* Search Input Field */}
        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="p-1 space-y-1 overflow-y-auto flex-grow">
          {filteredMappedEmployees.length > 0 ? (
            filteredMappedEmployees.map((employee) => (
              <label
                key={employee.id}
                className="flex items-center space-x-3 p-3 mx-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 focus:ring-2"
                  checked={selectedEmployeeIds.has(String(employee.id))}
                  onChange={() => handleToggleEmployee(employee.id)}
                  disabled={isUpdating}
                />
                <div className="flex items-center space-x-3">
                   {employee.profilePic ? (
                    <img src={employee.profilePic} alt={employee.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className={`w-8 h-8 ${employee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold`}>
                      {employee.avatar}
                    </span>
                  )}
                  <span className="text-slate-700 font-medium">{employee.name}</span>
                </div>
              </label>
            ))
          ) : (
            <p className="text-slate-500 text-center py-6">
              {allMappedEmployees.length > 0 ? 'No employees match your search.' : 'No employees available or failed to load.'}
            </p>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              setSearchTerm(''); // Also clear search on cancel
            }}
            disabled={isUpdating}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating || noChangesMade}
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:bg-blue-400"
          >
            {isUpdating ? "Saving..." : "Save Assignees"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssigneeModal;