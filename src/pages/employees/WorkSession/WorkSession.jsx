// src/pages/WorkSession.js

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import Swal from 'sweetalert2';

// Helper component for Icons
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Helper functions
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date(0, 0, 0, hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const calculateDuration = (start, end) => {
    if (!start || !end) return '(N/A)';
    const startTime = new Date(`1970-01-01T${start}Z`);
    const endTime = new Date(`1970-01-01T${end}Z`);
    if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) return '(N/A)';

    let diff = (endTime.getTime() - startTime.getTime()) / 1000;
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const minutes = Math.floor(diff / 60);

    let durationStr = '';
    if (hours > 0) durationStr += `${hours}h `;
    durationStr += `${minutes}m`;
    return `(${durationStr})`;
};

const WorkSession = () => {
  const { token, logout, isAuthenticated } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const backendUrlWithStorage = "https://demo.aentora.com/backend/public/storage";
  const apiUrl = "https://demo.aentora.com/backend/public/api/employee/work-session";

  useEffect(() => {
    // CHANGE 1: Page change hone par upar scroll karein
    window.scrollTo(0, 0);

    if (!isAuthenticated) { setLoading(false); return; }

    const fetchWorkSessions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}?page=${currentPage}`, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
        if (response.status === 401) { toast.error("Session expired."); logout(); return; }
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to fetch data");
        
        setSessions(result.data?.reverse() || []);
        setPaginationInfo({ currentPage: result.current_page, lastPage: result.last_page });
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkSessions();
  }, [currentPage, isAuthenticated, token, logout]);
  
  const handleDelete = (sessionId) => {
    Swal.fire({
      title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`${apiUrl}/${sessionId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
          if (!response.ok) throw new Error('Failed to delete session.');
          Swal.fire('Deleted!', 'The session has been deleted.', 'success');
          setSessions(prev => prev.filter(session => session.id !== sessionId));
        } catch (error) {
          Swal.fire('Error!', error.message, 'error');
        }
      }
    });
  };

  const handleNextPage = () => { if (paginationInfo?.currentPage < paginationInfo?.lastPage) setCurrentPage(p => p + 1); };
  const handlePrevPage = () => { if (paginationInfo?.currentPage > 1) setCurrentPage(p => p - 1); };

  if (loading) return <div className="p-8 text-center"><p>Loading Work Diary...</p></div>;
  if (!isAuthenticated) return <div className="p-8 text-center"><p>Please log in.</p></div>;

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">Work Diary</h1>
        
        <div className="border-t border-slate-200 dark:border-slate-700">
          {sessions.length > 0 ? (
            <div>
              {sessions.map((session, index) => (
                <div key={session.id} className="relative group flex items-start space-x-4 py-8">
                  
                  <div className="flex flex-col items-center h-full">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                    <div className="w-px flex-grow bg-slate-200 dark:bg-slate-700 mt-2"></div>
                  </div>
                  
                  <div className={`flex-1 ${index < sessions.length - 1 ? 'border-b border-slate-200 dark:border-slate-700 pb-8' : ''}`}>
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatTime(session.start_time)} – {formatTime(session.end_time)}
                        <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                          {calculateDuration(session.start_time, session.end_time)}
                        </span>
                      </p>
                      <button onClick={() => handleDelete(session.id)} title="Delete Session" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-red-500">
                        <TrashIcon />
                      </button>
                    </div>
                    {session.memo_content && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{session.memo_content}</p>
                    )}

                    <div className="mt-4">
                      {session.screenshots.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {session.screenshots.map(ss => (
                            <div key={ss.id} className="text-center">
                              <a href={`${backendUrlWithStorage}/${ss.screenshot_file}`} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={`${backendUrlWithStorage}/${ss.screenshot_file}`}
                                  alt={`Screenshot at ${formatTime(ss.created_at.split('T')[1])}`}
                                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors"
                                />
                              </a>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                {formatTime(ss.created_at.split('T')[1])}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No screenshots were taken for this session.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
                <p className="text-slate-500">No work sessions found for this day.</p>
            </div>
          )}

          {/* CHANGE 2: Pagination Controls wapis neeche hain */}
          {paginationInfo && paginationInfo.lastPage > 1 && (
            <div className="flex justify-center items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-x-4">
              <button onClick={handlePrevPage} disabled={paginationInfo.currentPage === 1} className="px-4 py-2 bg-slate-800 text-white rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed">
                Prev
              </button>
              <span className="text-slate-600 dark:text-slate-400">
                Page {paginationInfo.currentPage} of {paginationInfo.lastPage}
              </span>
              <button onClick={handleNextPage} disabled={paginationInfo.currentPage === paginationInfo.lastPage} className="px-4 py-2 bg-slate-800 text-white rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkSession;