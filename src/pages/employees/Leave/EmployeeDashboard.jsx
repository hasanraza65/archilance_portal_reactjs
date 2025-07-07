import React from 'react';
import LeaveApplicationForm from './LeaveApplicationForm';
import LeaveHistoryTable from './LeaveHistoryTable';

const EmployeeDashboard = ({ leaves, onApplyLeave }) => {
  return (
    <div className="container mx-auto">
      <LeaveApplicationForm onApplyLeave={onApplyLeave} />
      {/* Horizontal line ko is tarah style karein */}
      <div className="my-8 border-t border-gray-200"></div>
      <LeaveHistoryTable leaves={leaves} />
    </div>
  );
};

export default EmployeeDashboard;