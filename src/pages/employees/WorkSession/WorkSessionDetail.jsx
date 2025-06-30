// src/pages/WorkSessionDetail.js

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const WorkSessionDetail = () => {
  const { id } = useParams(); // URL se session ID hasil karein
  const navigate = useNavigate();
  const { token, logout, isAuthenticated } = useAuth();

  const [sessionDetail, setSessionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false); // Button hover state ke liye

  // Corrected base URL for images
  const backendUrlWithStorage =
    "https://demo.aentora.com/backend/public/storage";
  const apiUrl = `https://demo.aentora.com/backend/public/api/employee/work-session/${id}`;

  useEffect(() => {
    if (!isAuthenticated) {
      toast.warn("Please log in to view details.");
      navigate("/login");
      return;
    }

    const fetchSessionDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          toast.error("Session expired. Logging out.");
          logout();
          return;
        }

        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Could not fetch session details.");

        // API se profile_pic null anay par ek default icon set karein
        if (result.user_detail && !result.user_detail.profile_pic) {
          result.user_detail.profile_pic = 'path/to/default/avatar.png'; // Yahan default image ka path dein, ya isse khali chhor dein
        }
        
        setSessionDetail(result);
      } catch (err) {
        toast.error(err.message);
        navigate("/work-sessions"); // Agar error aye to wapis list page par bhej dein
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetail();
  }, [id, token, isAuthenticated, logout, navigate, apiUrl]);

  if (loading)
    return (
      <div style={detailStyles.container}>
        <h2 style={detailStyles.sectionTitle}>Loading Session Details...</h2>
      </div>
    );
  if (!sessionDetail)
    return (
      <div style={detailStyles.container}>
        <p>Session not found.</p>
      </div>
    );

  const {
    user_detail,
    start_date,
    start_time,
    end_time,
    memo_content,
    screenshots,
  } = sessionDetail;
  
  // Ek fallback user object agar user_detail null ho
  const safeUserDetail = user_detail || { name: 'Employee', email: 'N/A', profile_pic: null };
  const profilePicSrc = safeUserDetail.profile_pic 
    ? `${backendUrlWithStorage}/${safeUserDetail.profile_pic}`
    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EwYTVhZCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgMy4zcy0xLjM0IDMtMyAzLTMtMS4zNC0zLTMgMS4zNC0zIDMtM3ptMCAxNC4yYy0yLjUgMC00LjcxLTEuMjgtNi0zLjIyLjAzLTEuOTkgNC0zLjA4IDYtMy4wOHM1Ljk3IDEuMDkgNiAzLjA4Yy0xLjI5IDEuOTQtMy41IDMuMjItNiAzLjIyeiIvPjwvc3ZnPg=='; // Generic avatar icon as fallback

  return (
    <div style={detailStyles.container}>
      <button
        onClick={() => navigate(-1)}
        style={{
          ...detailStyles.backButton,
          ...(isBackButtonHovered ? detailStyles.backButtonHover : {}),
        }}
        onMouseEnter={() => setIsBackButtonHovered(true)}
        onMouseLeave={() => setIsBackButtonHovered(false)}
      >
        ← Back to List
      </button>

      <div style={detailStyles.header}>
        <img
          src={profilePicSrc}
          alt={safeUserDetail.name}
          style={detailStyles.profilePic}
        />
        <div>
          <h1 style={detailStyles.userName}>
            {safeUserDetail.name}'s Work Session
          </h1>
          <p style={detailStyles.userEmail}>{safeUserDetail.email}</p>
        </div>
      </div>

      <div style={detailStyles.contentGrid}>
        <div style={detailStyles.card}>
          <h3 style={detailStyles.cardTitle}>Session Timing</h3>
          <div style={detailStyles.cardContent}>
            <p><strong style={detailStyles.cardLabel}>Date:</strong> {start_date}</p>
            <p><strong style={detailStyles.cardLabel}>Start Time:</strong> {start_time}</p>
            <p><strong style={detailStyles.cardLabel}>End Time:</strong> {end_time || "In Progress"}</p>
          </div>
        </div>
        <div style={detailStyles.card}>
          <h3 style={detailStyles.cardTitle}>Memo</h3>
          <p style={detailStyles.cardContent}>
            {memo_content || "No memo was added for this session."}
          </p>
        </div>
      </div>

      <div style={detailStyles.screenshotSection}>
        <h2 style={detailStyles.sectionTitle}>Screenshots</h2>
        {screenshots && screenshots.length > 0 ? (
          <div style={detailStyles.screenshotGrid}>
            {screenshots.map((ss) => (
              <a
                key={ss.id}
                href={`${backendUrlWithStorage}/${ss.screenshot_file}`}
                target="_blank"
                rel="noopener noreferrer"
                style={detailStyles.screenshotLink}
                title={`View Screenshot from ${ss.created_at}`}
              >
                <img
                  src={`${backendUrlWithStorage}/${ss.screenshot_file}`}
                  alt={`Screenshot at ${ss.created_at}`}
                  style={detailStyles.screenshotImage}
                />
              </a>
            ))}
          </div>
        ) : (
          <p>No screenshots were taken during this session.</p>
        )}
      </div>
    </div>
  );
};

// Styles for the detail page (Behtar design ke liye update kiye gaye hain)
const detailStyles = {
  container: {
    padding: "2rem",
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    backgroundColor: "#f9fafb", // Thora sa off-white background
    maxWidth: "1200px",
    margin: "0 auto",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "2rem",
    padding: "0.6rem 1.2rem",
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: "500",
    color: "#374151",
    transition: "background-color 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
  backButtonHover: {
    backgroundColor: "#f3f4f6",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "2.5rem",
  },
  profilePic: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    marginRight: "1.5rem",
    objectFit: "cover",
    border: "3px solid white",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    backgroundColor: '#e5e7eb', // Placeholder color agar image load na ho
  },
  userName: { margin: 0, fontSize: "2.25rem", fontWeight: "700", color: "#111827" },
  userEmail: { margin: 0, color: "#6b7280", fontSize: "1rem" },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    marginBottom: "3rem",
  },
  card: {
    padding: "1rem 2rem 2rem 2rem",
    backgroundColor: "#ffffff",
    borderRadius: "0.75rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e5e7eb",
  },
  cardTitle: {
    marginTop: "1.5rem",
    marginBottom: "1.5rem",
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#111827",
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "1rem",
  },
  cardContent: {
    lineHeight: "1.7",
    color: "#374151",
    margin: 0,
  },
  cardLabel: {
    fontWeight: "600",
    color: "#111827",
    marginRight: '0.5rem',
  },
  screenshotSection: { marginTop: "2rem" },
  sectionTitle: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#111827",
    paddingBottom: "1rem",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "1.5rem",
  },
  screenshotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.5rem",
  },
  screenshotLink: {
    display: "block",
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease, box-shadow 0.3s ease",
    border: "1px solid #e5e7eb",
    // Note: Is par hover effect ke liye CSS file use karna behtar hai.
    // Example: .screenshot-link:hover { transform: scale(1.05); }
  },
  screenshotImage: {
    width: "100%",
    height: "auto",
    display: "block",
  },
};

export default WorkSessionDetail;