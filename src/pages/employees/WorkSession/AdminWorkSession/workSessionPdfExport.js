import jsPDF from "jspdf";
import {
  formatDuration,
  formatSessionTimeRange,
  formatSessionEndDateLabel,
  formatScreenshotTime,
  getIdleSeconds,
} from "./workStatsHelpers";

// Builds the report directly with jsPDF (vector text/shapes) instead of rasterizing the
// whole page with html2canvas. That approach broke in two ways that don't have simple
// tuning fixes: html2canvas can't parse the oklch() colors Tailwind v4 emits, and turning
// hundreds of sessions into one giant canvas is slow/memory-heavy and blows past any
// reasonable timeout on a month-wide range. Text has no length limit here since pages are
// just added as content overflows, and only screenshots need actual image loading.
const PAGE_MARGIN = 40;
const THUMB_WIDTH = 90;
const THUMB_HEIGHT = 60;
const THUMB_GAP = 8;
const MAX_SCREENSHOTS_PER_SESSION = 8;
const MAX_TOTAL_SCREENSHOTS = 300;
const IMAGE_CONCURRENCY = 4;
const IMAGE_TIMEOUT_MS = 6000;

// Loads one screenshot as a JPEG data URL for jsPDF.addImage. Never rejects — a failed or
// slow-to-load screenshot resolves to null so one bad image can't stall the whole export.
const loadImageOnce = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const timer = setTimeout(() => finish(null), IMAGE_TIMEOUT_MS);
    img.crossOrigin = "anonymous";
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        finish(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        finish(null); // tainted canvas (CORS) or decode failure
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(null);
    };
    img.src = url;
  });

// A month-wide export takes long enough that it can run into a transient network hiccup
// mid-way (wifi drop/reconnect, laptop sleep/wake, VPN toggle) — Chrome surfaces these as
// errors like ERR_CERT_VERIFIER_CHANGED or ERR_CONNECTION_TIMED_OUT on whatever requests
// are in flight at that moment. These normally clear up within a second, so one retry
// after a short delay recovers most of them instead of permanently losing that screenshot.
const loadImageAsDataUrl = async (url) => {
  const first = await loadImageOnce(url);
  if (first) return first;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return loadImageOnce(url);
};

// Loads a batch of screenshot URLs with a small worker pool so at most IMAGE_CONCURRENCY
// requests are ever in flight — this is what actually prevents ERR_INSUFFICIENT_RESOURCES
// on wide date ranges, rather than just capping the total count.
const loadImagesWithConcurrency = async (urls) => {
  const results = new Array(urls.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const i = next++;
      results[i] = await loadImageAsDataUrl(urls[i]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(IMAGE_CONCURRENCY, urls.length) }, worker)
  );
  return results;
};

export const generateWorkSessionPdf = async ({
  employeeDetails,
  storageUrl,
  jobName,
  periodLabel,
  generatedOn,
  dashboard,
  manualSeconds,
  sessions,
  userRole,
  fileName,
}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Work Session Report", PAGE_MARGIN, y);
  y += 22;

  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`Employee: ${employeeDetails?.name || "N/A"}`, PAGE_MARGIN, y);
  y += 16;
  doc.text(`Email: ${employeeDetails?.email || "N/A"}`, PAGE_MARGIN, y);
  y += 16;
  doc.text(`Job: ${jobName || "All Jobs"}`, PAGE_MARGIN, y);
  y += 16;
  doc.text(`Period: ${periodLabel}`, PAGE_MARGIN, y);
  y += 16;

  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text(`Generated on ${generatedOn}`, PAGE_MARGIN, y);
  doc.setTextColor(0);
  y += 20;

  // Stat cards
  const stats = dashboard?.stats || {};
  const statCards = [
    ["Total Time", formatDuration(stats.totalSeconds)],
    ["Productive", formatDuration(stats.productiveSeconds)],
    ["Idle", formatDuration(stats.idleSeconds)],
    ["Productivity", `${stats.productivePercent || 0}%`],
    ["Manual", formatDuration(manualSeconds)],
  ];
  const cardGap = 6;
  const cardW = (contentWidth - cardGap * (statCards.length - 1)) / statCards.length;
  const cardH = 40;
  ensureSpace(cardH + 24);
  statCards.forEach(([label, value], i) => {
    const x = PAGE_MARGIN + i * (cardW + cardGap);
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, y, cardW, cardH);
    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.text(label.toUpperCase(), x + 6, y + 14);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.setTextColor(20);
    doc.text(value, x + 6, y + 30);
    doc.setFont(undefined, "normal");
  });
  doc.setTextColor(0);
  y += cardH + 24;

  // Top Apps
  const topApps = dashboard?.aggregatedApps || [];
  ensureSpace(20);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Top Apps", PAGE_MARGIN, y);
  doc.setFont(undefined, "normal");
  y += 16;

  if (topApps.length === 0) {
    doc.setFontSize(9.5);
    doc.setTextColor(150);
    doc.text("No activity data.", PAGE_MARGIN, y);
    doc.setTextColor(0);
    y += 16;
  } else {
    topApps.forEach((app) => {
      ensureSpace(20);
      const pct = stats.totalSeconds > 0 ? (app.duration / stats.totalSeconds) * 100 : 0;
      doc.setFontSize(9.5);
      doc.setTextColor(30);
      doc.text(app.name, PAGE_MARGIN, y);
      doc.setTextColor(100);
      doc.text(formatDuration(app.duration), PAGE_MARGIN + contentWidth, y, { align: "right" });
      y += 5;
      doc.setFillColor(241, 245, 249);
      doc.rect(PAGE_MARGIN, y, contentWidth, 5, "F");
      doc.setFillColor(59, 130, 246);
      doc.rect(PAGE_MARGIN, y, contentWidth * Math.min(pct, 100) / 100, 5, "F");
      y += 16;
    });
  }
  doc.setTextColor(0);
  y += 10;

  // Sessions
  ensureSpace(20);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`Sessions (${sessions.length})`, PAGE_MARGIN, y);
  doc.setFont(undefined, "normal");
  y += 18;

  if (sessions.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("No work sessions found.", PAGE_MARGIN, y);
    doc.setTextColor(0);
  }

  let remainingScreenshotBudget = MAX_TOTAL_SCREENSHOTS;

  for (const session of sessions) {
    ensureSpace(16);

    const sessionIdleSec = Array.isArray(session.idle_times)
      ? session.idle_times.reduce(
          (acc, idle) => acc + getIdleSeconds(idle.start_time, idle.end_time),
          0
        )
      : 0;

    const timeLabel = formatSessionTimeRange(session);
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(20);
    doc.text(timeLabel, PAGE_MARGIN, y);
    const timeWidth = doc.getTextWidth(timeLabel);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100);
    doc.text(
      `(${session.total_time || ""})  ${formatSessionEndDateLabel(session)}`,
      PAGE_MARGIN + timeWidth + 8,
      y
    );

    let badgeX = PAGE_MARGIN + contentWidth;
    const drawBadge = (text, fill, textColor) => {
      doc.setFontSize(7.5);
      const w = doc.getTextWidth(text) + 12;
      badgeX -= w;
      doc.setFillColor(...fill);
      doc.roundedRect(badgeX, y - 9, w, 12, 3, 3, "F");
      doc.setTextColor(...textColor);
      doc.text(text, badgeX + 6, y - 0.5);
      badgeX -= 4;
    };
    if (sessionIdleSec > 0) {
      drawBadge(`Idle: ${formatDuration(sessionIdleSec)}`, [254, 243, 199], [146, 64, 14]);
    }
    if (session.type === "Manual") {
      drawBadge("Manual", [224, 242, 254], [7, 89, 133]);
    }

    doc.setTextColor(0);
    y += 14;

    if (session.memo_content) {
      doc.setFontSize(9);
      doc.setTextColor(70);
      const lines = doc.splitTextToSize(session.memo_content, contentWidth);
      lines.forEach((line) => {
        ensureSpace(12);
        doc.text(line, PAGE_MARGIN, y);
        y += 12;
      });
      doc.setTextColor(0);
    }

    const allScreenshots = Array.isArray(session.screenshots) ? session.screenshots : [];
    const perSessionCap = Math.max(
      0,
      Math.min(MAX_SCREENSHOTS_PER_SESSION, remainingScreenshotBudget)
    );
    const shownScreenshots = allScreenshots.slice(0, perSessionCap);
    remainingScreenshotBudget -= shownScreenshots.length;
    const hiddenCount = allScreenshots.length - shownScreenshots.length;

    if (shownScreenshots.length > 0) {
      const urls = shownScreenshots.map((ss) => {
        const path = userRole === "admin" ? ss.screenshot_file : ss.emp_screenshot_file;
        const base = `${storageUrl}/${path}`;
        // Cache-bust: a plain <img> elsewhere on the page (no crossOrigin) may have already
        // cached this exact URL without CORS validation, so force a distinct request here.
        return `${base}${base.includes("?") ? "&" : "?"}cors=1`;
      });
      // Sequential per-session, concurrency-limited within a session — this is what keeps
      // total in-flight requests low across a whole month of sessions.
      const dataUrls = await loadImagesWithConcurrency(urls);

      let rowX = PAGE_MARGIN;
      ensureSpace(THUMB_HEIGHT + 14);
      dataUrls.forEach((dataUrl, i) => {
        if (rowX + THUMB_WIDTH > PAGE_MARGIN + contentWidth) {
          rowX = PAGE_MARGIN;
          y += THUMB_HEIGHT + 14;
          ensureSpace(THUMB_HEIGHT + 14);
        }
        if (dataUrl) {
          try {
            doc.addImage(dataUrl, "JPEG", rowX, y, THUMB_WIDTH, THUMB_HEIGHT);
          } catch {
            doc.setDrawColor(226, 232, 240);
            doc.rect(rowX, y, THUMB_WIDTH, THUMB_HEIGHT);
          }
        } else {
          doc.setDrawColor(226, 232, 240);
          doc.rect(rowX, y, THUMB_WIDTH, THUMB_HEIGHT);
          doc.setFontSize(7);
          doc.setTextColor(180);
          doc.text("unavailable", rowX + 10, y + THUMB_HEIGHT / 2);
          doc.setTextColor(0);
        }
        doc.setFontSize(7);
        doc.setTextColor(140);
        doc.text(formatScreenshotTime(shownScreenshots[i].created_at), rowX, y + THUMB_HEIGHT + 9);
        doc.setTextColor(0);
        rowX += THUMB_WIDTH + THUMB_GAP;
      });
      y += THUMB_HEIGHT + 20;
    }

    if (hiddenCount > 0) {
      ensureSpace(12);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `+${hiddenCount} more screenshot${hiddenCount === 1 ? "" : "s"} not shown`,
        PAGE_MARGIN,
        y
      );
      doc.setTextColor(0);
      y += 14;
    }

    ensureSpace(10);
    doc.setDrawColor(240, 240, 240);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + contentWidth, y);
    y += 14;
  }

  doc.save(fileName);
};
