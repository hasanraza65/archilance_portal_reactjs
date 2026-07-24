import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/Icon";
import {
  getApiBasePathForRole,
  getUserRole,
  getMediaUrl,
} from "@/pages/utility/apiHelper";

const RATING_COLUMNS = [
  { key: "technical_accuracy", label: "Technical Accuracy" },
  { key: "learning_improvement", label: "Learning & Improvement" },
  { key: "ownership_initiative", label: "Ownership & Initiative" },
  { key: "communication_professionalism", label: "Communication" },
  { key: "overall_recommendation", label: "Overall Recommendation" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const scoreColor = (score) => {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return {
      text: "text-slate-500 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-700",
      bar: "bg-slate-300 dark:bg-slate-500",
    };
  }
  const value = Number(score);
  if (value >= 4)
    return {
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-500/10",
      bar: "bg-emerald-500",
    };
  if (value >= 3)
    return {
      text: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-500/10",
      bar: "bg-amber-500",
    };
  return {
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-500/10",
    bar: "bg-red-500",
  };
};

const Avatar = ({ person }) => {
  const avatar = person ? getMediaUrl(person.profile_pic, person.created_at) : null;
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={person?.name || ""}
        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {(person?.name || "?").charAt(0).toUpperCase()}
    </span>
  );
};

const ScoreRow = ({ label, score }) => {
  const color = scoreColor(score);
  const pct =
    score === null || score === undefined || Number.isNaN(Number(score))
      ? 0
      : (Number(score) / 5) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className={`text-xs font-semibold ${color.text}`}>
          {score ?? "-"}
          <span className="text-slate-400 font-normal"> / 5</span>
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${color.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const RatingCard = ({ rating, isManager }) => {
  const person = isManager ? rating.internee : rating.manager;
  const avg = scoreColor(rating.average_rating);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar person={person} />
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-white truncate">
              {person?.name || "-"}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {isManager ? "Internee" : "Manager"}
              {person?.email ? ` · ${person.email}` : ""}
            </div>
          </div>
        </div>
        <div
          className={`flex flex-col items-center justify-center rounded-lg px-3 py-1.5 flex-shrink-0 ${avg.bg}`}
          title="Average rating"
        >
          <span className={`text-lg font-bold leading-none ${avg.text}`}>
            {rating.average_rating ?? "-"}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">
            Avg
          </span>
        </div>
      </div>

      {/* Project / Task / Date */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {rating.task?.project?.project_name || "-"}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {rating.task?.task_title || "-"}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
            {formatDate(rating.rating_date)}
          </span>
        </div>
      </div>

      {/* Scores */}
      <div className="mt-4 flex-1">
        {rating.did_not_work ? (
          <div className="h-full flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700/40 py-6 text-sm text-slate-400 italic">
            Did not work on this task
          </div>
        ) : (
          <div className="space-y-3">
            {RATING_COLUMNS.map((col) => (
              <ScoreRow key={col.key} label={col.label} score={rating[col.key]} />
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      {rating.comments && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            “{rating.comments}”
          </p>
        </div>
      )}
    </div>
  );
};

const MyGrading = () => {
  const { token, isAuthenticated } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);

  const isManager = getUserRole() === "manager";

  const fetchRatings = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const url = `${
        import.meta.env.VITE_BACKEND_BASE_URL
      }${getApiBasePathForRole("/internee-rating")}?page=${currentPage}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to load grading records.");
      }
      setRatings(result.data || []);
      // Internees only: the backend tells us whether grading is unlocked yet (one month
      // after their first work session). Absent on older backends -> treated as unlocked.
      setEligibility(result.eligibility || null);
      setPaginationInfo({
        currentPage: result.current_page,
        lastPage: result.last_page,
      });
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
      setRatings([]);
      setEligibility(null);
      setPaginationInfo(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, isAuthenticated, token]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const handleNextPage = () => {
    if (paginationInfo && currentPage < paginationInfo.lastPage) {
      setCurrentPage((p) => p + 1);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          My Grading
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isManager
            ? "Ratings you have given to internees on their tasks."
            : "Ratings you have received from your manager on your tasks."}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : eligibility &&
        eligibility.applies &&
        eligibility.is_eligible === false ? (
        <div className="py-16 px-6 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-4">
            <Icon
              icon="heroicons-outline:lock-closed"
              className="text-2xl text-amber-600 dark:text-amber-400"
            />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Your grading isn&rsquo;t available yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {eligibility.available_from ? (
              <>
                Your ratings unlock on{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatDate(eligibility.available_from)}
                </span>{" "}
                &mdash; one month after your first work session.
              </>
            ) : (
              "Your ratings become visible one month after your first work session. Start tracking your work to begin the countdown."
            )}
          </p>
        </div>
      ) : ratings.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          No grading records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {ratings.map((rating) => (
            <RatingCard key={rating.id} rating={rating} isManager={isManager} />
          ))}
        </div>
      )}

      {paginationInfo && paginationInfo.lastPage > 1 && (
        <div className="flex flex-wrap justify-center items-center mt-8 gap-4">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={paginationInfo.currentPage === 1}
            className="btn btn-dark disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-slate-600 dark:text-slate-400">
            Page {paginationInfo.currentPage} of {paginationInfo.lastPage}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={paginationInfo.currentPage === paginationInfo.lastPage}
            className="btn btn-dark disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyGrading;
