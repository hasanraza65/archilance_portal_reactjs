// src/pages/WorkSession.js (ya jahan bhi aapki file hai)

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom"; // useNavigate import karein

const WorkSession = () => {
  const { token, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate(); // useNavigate hook ko initialize karein

  const [sessions, setSessions] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Image URL ko theek karein (storage path ke sath)
  const backendUrlWithStorage =
    "https://demo.aentora.com/backend/public/storage";
  const apiUrl =
    "https://demo.aentora.com/backend/public/api/employee/work-session";

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchWorkSessions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}?page=${currentPage}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          logout();
          return;
        }
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Failed to fetch data");

        setSessions(result.data || []);
        setPaginationInfo({
          currentPage: result.current_page,
          lastPage: result.last_page,
        });
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkSessions();
  }, [currentPage, isAuthenticated, token, logout]);

  const handleCardClick = (sessionId) => {
    navigate(`/work-sessions/${sessionId}`); // Click par detail page par navigate karein
  };

  // Baqi pagination functions (handleNextPage, handlePrevPage) waise hi rahenge...
  const handleNextPage = () => {
    if (paginationInfo.currentPage < paginationInfo.lastPage)
      setCurrentPage((p) => p + 1);
  };
  const handlePrevPage = () => {
    if (paginationInfo.currentPage > 1) setCurrentPage((p) => p - 1);
  };

  if (loading && sessions.length === 0)
    return (
      <div style={styles.container}>
        <h2>Loading...</h2>
      </div>
    );
  if (!isAuthenticated)
    return (
      <div style={styles.container}>
        <h2 style={styles.noDataText}>Please log in.</h2>
      </div>
    );

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Work Sessions</h1>

      {sessions.length > 0 ? (
        <>
          <div style={styles.sessionsGrid}>
            {sessions.map((session) => (
              // Card ko clickable banayein
              <div
                key={session.id}
                style={styles.card}
                onClick={() => handleCardClick(session.id)}
              >
                <div style={styles.cardHeader}>
                  <img
                    src={`${backendUrlWithStorage}/${session.user_detail.profile_pic}`}
                    alt={session.user_detail.name}
                    style={styles.profilePic}
                  />
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>
                    {session.user_detail.name}
                  </h3>
                </div>
                <div style={styles.cardBody}>
                  <p>
                    <strong>Date:</strong> {session.start_date}
                  </p>
                  <p>
                    <strong>Time:</strong> {session.start_time} -{" "}
                    {session.end_time || "Running"}
                  </p>
                  <p>
                    <strong>Screenshots:</strong> {session.screenshots.length}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div style={styles.paginationControls}>
            <button
              onClick={handlePrevPage}
              disabled={paginationInfo.currentPage === 1}
              style={styles.button(paginationInfo.currentPage === 1)}
            >
              Prev
            </button>
            <span>
              Page {paginationInfo.currentPage} of {paginationInfo.lastPage}
            </span>
            <button
              onClick={handleNextPage}
              disabled={paginationInfo.currentPage === paginationInfo.lastPage}
              style={styles.button(
                paginationInfo.currentPage === paginationInfo.lastPage
              )}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        !loading && <p style={styles.noDataText}>No work sessions found.</p>
      )}
    </div>
  );
};

// Styles ko thora update kiya hai clickable effect ke liye
const styles = {
  // ... baqi styles waise hi rakhein
  container: {
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
    backgroundColor: "#f9fafb",
  },
  header: {
    textAlign: "center",
    color: "#111827",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  sessionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
  },
  profilePic: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    marginRight: "1rem",
    objectFit: "cover",
  },
  cardBody: { padding: "1rem", fontSize: "0.9rem", color: "#374151" },
  paginationControls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "2.5rem",
    gap: "1rem",
  },
  button: (disabled) => ({
    padding: "0.5rem 1rem",
    border: "none",
    backgroundColor: disabled ? "#d1d5db" : "#3b82f6",
    color: "white",
    borderRadius: "0.375rem",
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  noDataText: {
    textAlign: "center",
    fontSize: "1.1rem",
    color: "#6b7280",
    marginTop: "3rem",
  },
};

// hover effect
const hoverStyle = `
  .sessionsGrid > div:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = hoverStyle;
document.head.appendChild(styleSheet);

export default WorkSession;
