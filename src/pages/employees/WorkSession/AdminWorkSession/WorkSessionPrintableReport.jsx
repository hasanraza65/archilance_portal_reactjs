import React from "react";
import {
  formatDuration,
  formatSessionTimeRange,
  formatSessionEndDateLabel,
  formatScreenshotTime,
  getIdleSeconds,
} from "./workStatsHelpers";

// A wide date range can span hundreds of sessions, each with its own screenshots.
// Mounting all of them as <img> tags at once fires that many simultaneous network
// requests, which blows past the browser's connection pool (ERR_INSUFFICIENT_RESOURCES)
// before html2canvas even gets a chance to run. These caps bound the total regardless
// of how broad a range the user picks.
const MAX_SCREENSHOTS_PER_SESSION = 8;
const MAX_TOTAL_SCREENSHOTS = 150;

// Off-screen document rendered purely for html2canvas-pro to rasterize into
// the exported PDF. Always light-themed (no `dark:` classes) regardless of the
// app's current theme, since it is never actually shown to the user on screen.
const WorkSessionPrintableReport = ({
  employeeDetails,
  storageUrl,
  jobName,
  periodLabel,
  generatedOn,
  dashboard,
  manualSeconds,
  sessions,
  userRole,
}) => {
  const stats = dashboard?.stats || {};
  const topApps = dashboard?.aggregatedApps || [];

  let remainingScreenshotBudget = MAX_TOTAL_SCREENSHOTS;
  const sessionsWithCappedScreenshots = sessions.map((session) => {
    const allScreenshots = Array.isArray(session.screenshots) ? session.screenshots : [];
    const perSessionCap = Math.max(0, Math.min(MAX_SCREENSHOTS_PER_SESSION, remainingScreenshotBudget));
    const shownScreenshots = allScreenshots.slice(0, perSessionCap);
    remainingScreenshotBudget -= shownScreenshots.length;
    return {
      ...session,
      shownScreenshots,
      hiddenScreenshotsCount: allScreenshots.length - shownScreenshots.length,
    };
  });

  const statCards = [
    { label: "Total Time", value: formatDuration(stats.totalSeconds) },
    { label: "Productive Time", value: formatDuration(stats.productiveSeconds) },
    { label: "Idle Time", value: formatDuration(stats.idleSeconds) },
    { label: "Productivity %", value: `${stats.productivePercent || 0}%` },
    { label: "Manual Time", value: formatDuration(manualSeconds) },
  ];

  return (
    <div
      style={{
        width: "780px",
        background: "#ffffff",
        color: "#1e293b",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "32px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
          Work Session Report
        </h1>
        <p style={{ fontSize: "13px", margin: "10px 0 2px", fontWeight: "bold" }}>
          {employeeDetails?.name || "Employee"}
        </p>
        <p style={{ fontSize: "12px", margin: "0 0 2px", color: "#475569" }}>
          {employeeDetails?.email || ""}
        </p>
        <p style={{ fontSize: "12px", margin: "0 0 2px", color: "#475569" }}>
          Job: {jobName || "All Jobs"} &nbsp;|&nbsp; Period: {periodLabel}
        </p>
        <p style={{ fontSize: "10px", margin: "6px 0 0", color: "#94a3b8" }}>
          Generated on {generatedOn}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              flex: 1,
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                color: "#64748b",
                margin: "0 0 4px",
              }}
            >
              {card.label}
            </p>
            <p style={{ fontSize: "15px", fontWeight: "bold", margin: 0 }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top Apps */}
      <div style={{ marginBottom: "28px" }}>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "6px",
            marginBottom: "10px",
          }}
        >
          Top Apps
        </h3>
        {topApps.length === 0 ? (
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>No activity data.</p>
        ) : (
          topApps.map((app, i) => {
            const pct =
              stats.totalSeconds > 0 ? (app.duration / stats.totalSeconds) * 100 : 0;
            return (
              <div key={app.name + i} style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    marginBottom: "3px",
                  }}
                >
                  <span>{app.name}</span>
                  <span style={{ color: "#64748b" }}>{formatDuration(app.duration)}</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "#f1f5f9",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#3b82f6",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sessions */}
      <div>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "6px",
            marginBottom: "10px",
          }}
        >
          Sessions ({sessions.length})
        </h3>

        {sessions.length === 0 ? (
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>No work sessions found.</p>
        ) : (
          sessionsWithCappedScreenshots.map((session) => {
            const sessionIdleSec = Array.isArray(session.idle_times)
              ? session.idle_times.reduce(
                  (acc, idle) => acc + getIdleSeconds(idle.start_time, idle.end_time),
                  0
                )
              : 0;

            return (
              <div
                key={session.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "12px",
                  breakInside: "avoid",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      {formatSessionTimeRange(session)}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>
                      ({session.total_time})
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "8px" }}>
                      {formatSessionEndDateLabel(session)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {session.type === "Manual" && (
                      <span
                        style={{
                          fontSize: "9px",
                          background: "#e0f2fe",
                          color: "#075985",
                          borderRadius: "999px",
                          padding: "2px 8px",
                        }}
                      >
                        Manual
                      </span>
                    )}
                    {sessionIdleSec > 0 && (
                      <span
                        style={{
                          fontSize: "9px",
                          background: "#fef3c7",
                          color: "#92400e",
                          borderRadius: "999px",
                          padding: "2px 8px",
                        }}
                      >
                        Idle: {formatDuration(sessionIdleSec)}
                      </span>
                    )}
                  </div>
                </div>

                {session.memo_content && (
                  <p style={{ fontSize: "11px", color: "#475569", margin: "6px 0 0" }}>
                    {session.memo_content}
                  </p>
                )}

                {session.shownScreenshots.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "10px",
                    }}
                  >
                    {session.shownScreenshots.map((ss) => {
                      const screenshotPath =
                        userRole === "admin" ? ss.screenshot_file : ss.emp_screenshot_file;
                      const screenshotUrl = `${storageUrl}/${screenshotPath}`;
                      // The plain <img> elsewhere on the page (no crossOrigin) may have already
                      // cached this exact URL without CORS validation. Appending a query param
                      // forces a distinct cache entry so the browser actually re-requests it in
                      // CORS mode instead of silently reusing the tainted cached copy.
                      const corsBustedUrl = `${screenshotUrl}${screenshotUrl.includes("?") ? "&" : "?"}cors=1`;
                      return (
                        <div key={ss.id} style={{ width: "110px", textAlign: "center" }}>
                          <img
                            src={corsBustedUrl}
                            crossOrigin="anonymous"
                            alt="Screenshot"
                            style={{
                              width: "110px",
                              height: "70px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                          <p style={{ fontSize: "8px", color: "#94a3b8", margin: "3px 0 0" }}>
                            {formatScreenshotTime(ss.created_at)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {session.hiddenScreenshotsCount > 0 && (
                  <p style={{ fontSize: "9px", color: "#94a3b8", margin: "6px 0 0" }}>
                    +{session.hiddenScreenshotsCount} more screenshot
                    {session.hiddenScreenshotsCount === 1 ? "" : "s"} not shown — view in app, or export a shorter date range.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WorkSessionPrintableReport;
