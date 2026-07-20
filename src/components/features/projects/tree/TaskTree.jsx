// src/components/features/projects/tree/TaskTree.jsx
//
// Reusable, ClickUp-style expand/collapse task tree.
//
// A task ("Project" or "Task" in the frontend vocabulary) can be expanded to
// reveal its direct children (sub-tasks). Children are lazy-loaded on first
// expand via GET /{role}/project-task/{id} (which returns the node + one level
// of `sub_tasks`), so the tree supports unlimited depth without ever loading a
// whole subtree up front.
//
// Status and due-date are edited inline through the existing, battle-tested
// EditableTaskStatus / EditableDueDate components — no page reload, the change
// is reflected locally the moment it succeeds.
//
// The component degrades gracefully: if the backend hasn't been updated to send
// `sub_tasks_count`, every node shows a chevron and simply reveals "No sub-tasks"
// when expanded on a leaf. Once the backend sends the count, leaves render flat.

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import EditableTaskStatus from "@/pages/app/projects/EditableTaskStatus";
import EditableDueDate from "@/pages/app/projects/EditTaskDate/EditableDueDate";
import EditablePriority from "@/pages/app/projects/EditablePriority";
import {
  mapApiAssigneeToLocal,
  getApiBasePathForRole,
} from "@/components/features/projects/details/utils";

const VITE_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const COLSPAN = 6; // Name | Status | Assignees | Due Date | Priority | Actions
const INDENT_STEP = 22; // px added per depth level

const authHeaders = () => ({
  Authorization: `Bearer ${Cookies.get("token")}`,
  Accept: "application/json",
});

// --- Data primitives -------------------------------------------------------

// Direct children of a task. GET /project-task/{id} returns the node plus one
// level of `sub_tasks` (each with its own assignees + sub_tasks_count).
export const fetchTaskChildren = async (taskId) => {
  const url = `${VITE_BASE_URL}${getApiBasePathForRole(`/project-task/${taskId}`)}`;
  const res = await axios.get(url, { headers: authHeaders() });
  const data = res.data || {};
  return data.sub_tasks || data.subTasks || [];
};

// Parent tasks ("Projects") of a Job. The project-task index accepts a
// project_id filter and returns only top-level tasks (parent_task_id NULL) with
// assignees — lighter than the full project show endpoint.
export const fetchJobChildren = async (jobId) => {
  const url = `${VITE_BASE_URL}${getApiBasePathForRole(`/project-task`)}?project_id=${jobId}`;
  const res = await axios.get(url, { headers: authHeaders() });
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// --- Small presentational helpers -----------------------------------------

const AssigneeAvatars = ({ assignees, max = 2 }) => {
  const mapped = (assignees || [])
    .map((a) => mapApiAssigneeToLocal(a.user || a))
    .filter(Boolean);

  if (mapped.length === 0) {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400 italic">
        Unassigned
      </span>
    );
  }

  return (
    <div className="flex -space-x-2 overflow-hidden items-center">
      {mapped.slice(0, max).map((a) =>
        a.profilePic ? (
          <img
            key={a.id}
            src={a.profilePic}
            alt={a.name}
            title={a.name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-white dark:ring-slate-700"
          />
        ) : (
          <span
            key={a.id}
            title={a.name}
            className={`w-7 h-7 ${a.color} text-white rounded-full flex items-center justify-center text-xs font-semibold ring-1 ring-white dark:ring-slate-700`}
          >
            {a.avatar}
          </span>
        )
      )}
      {mapped.length > max && (
        <span className="w-7 h-7 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full flex items-center justify-center ring-1 ring-white dark:ring-slate-700">
          +{mapped.length - max}
        </span>
      )}
    </div>
  );
};

const HeaderCells = () => (
  <tr>
    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
      Name
    </th>
    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
      Status
    </th>
    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
      Assignees
    </th>
    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
      Due Date
    </th>
    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
      Priority
    </th>
    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
      Actions
    </th>
  </tr>
);

// --- Recursive row ---------------------------------------------------------

const TaskNodeRow = ({
  task,
  depth = 0,
  isEditable,
  canDelete = isEditable,
  jobId,
  onEditTask, // optional (task) => void — opens the surface's edit modal
  onDeleted, // (id) => void — parent removes this node from its list
  onStatusUpdate, // optional (id, status) => void — bubble to a grouping surface
  onDateUpdate, // optional (id, date) => void — bubble to a grouping surface
  onDescendantUrgent, // optional () => void — tell the parent an urgent task is nested here
  onPatch, // optional (id, patch) => void — keep the PARENT's cached copy of this node in sync
}) => {
  const [node, setNode] = useState(task);
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  // Whether an Urgent task is nested somewhere below this row. Seeded from the
  // backend roll-up (has_urgent_descendant) and flipped live when an inline
  // priority edit below makes a descendant Urgent.
  const [localUrgent, setLocalUrgent] = useState(!!task.has_urgent_descendant);

  // Keep local node in sync when the surface refetches and passes a new object.
  useEffect(() => {
    setNode(task);
    setLocalUrgent(!!task.has_urgent_descendant);
  }, [task]);

  // A node is a definite leaf only when the backend told us so (count === 0) —
  // then we render no chevron at all. When the count is undefined (backend not
  // yet updated to send sub_tasks_count), we optimistically show a chevron; if
  // it turns out empty on expand we still keep the chevron so it stays
  // collapsible and simply reveal a "No sub-tasks" row.
  const rawCount = node.sub_tasks_count;
  const definitelyLeaf = rawCount === 0;
  const childCount =
    children !== null ? children.length : rawCount != null ? rawCount : null;

  const toggle = useCallback(async () => {
    if (definitelyLeaf) return;
    if (!expanded && children === null) {
      setLoading(true);
      try {
        const kids = await fetchTaskChildren(node.id);
        setChildren(kids);
      } catch (e) {
        setChildren([]);
        toast.error("Could not load sub-tasks.");
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  }, [definitelyLeaf, expanded, children, node.id]);

  const handleStatus = (id, status) => {
    setNode((p) => ({ ...p, task_status: status }));
    onStatusUpdate?.(id, status);
    onPatch?.(node.id, { task_status: status });
  };
  const handleDue = (id, date) => {
    setNode((p) => ({ ...p, due_date: date }));
    onDateUpdate?.(id, date);
    onPatch?.(node.id, { due_date: date });
  };

  // A child (or deeper) became Urgent — light up the "urgent inside" badge, keep
  // it in the parent's cache so it survives a collapse/re-expand, and keep
  // propagating up the currently-expanded chain.
  const markDescendantUrgent = useCallback(() => {
    setLocalUrgent(true);
    onPatch?.(node.id, { has_urgent_descendant: true });
    onDescendantUrgent?.();
  }, [onDescendantUrgent, onPatch, node.id]);

  const handlePriority = (id, priority) => {
    setNode((p) => ({ ...p, priority }));
    onPatch?.(node.id, { priority });
    if (String(priority).toLowerCase() === "urgent") onDescendantUrgent?.();
  };

  // Keep this node's cached children in sync when one of them edits a field, so
  // a collapse/re-expand (which remounts the children) shows the new values
  // instead of the stale cached ones.
  const patchChild = useCallback((id, patch) => {
    setChildren((c) =>
      c ? c.map((x) => (x.id === id ? { ...x, ...patch } : x)) : c
    );
  }, []);

  const removeChild = (id) => {
    setChildren((c) => (c ? c.filter((x) => x.id !== id) : c));
    setNode((p) => ({
      ...p,
      sub_tasks_count:
        typeof p.sub_tasks_count === "number"
          ? Math.max(0, p.sub_tasks_count - 1)
          : p.sub_tasks_count,
    }));
  };

  const handleDelete = () => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete "${node.task_title || "this task"}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6e7881",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (!result.isConfirmed) return;
      axios
        .delete(
          `${VITE_BASE_URL}${getApiBasePathForRole(`/project-task/${node.id}`)}`,
          { headers: authHeaders() }
        )
        .then(() => {
          toast.success("Task deleted.");
          onDeleted?.(node.id);
        })
        .catch((error) =>
          Swal.fire(
            "Failed!",
            error.response?.data?.message || "Could not delete task.",
            "error"
          )
        );
    });
  };

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
        {/* Name + expand toggle */}
        <td
          className="px-4 py-3 align-middle"
          style={{ paddingLeft: 12 + depth * INDENT_STEP }}
        >
          <div className="flex items-center min-w-0">
            {definitelyLeaf ? (
              <span className="inline-block w-6 mr-2 shrink-0" />
            ) : (
              <button
                type="button"
                onClick={toggle}
                aria-label={expanded ? "Collapse" : "Expand"}
                aria-expanded={expanded}
                title={expanded ? "Collapse" : "Expand"}
                className={`mr-2 shrink-0 inline-flex items-center gap-0.5 h-6 min-w-[1.5rem] px-1 rounded-md border transition-colors ${
                  expanded
                    ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "border-slate-300 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {loading ? (
                  <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon
                    icon={
                      expanded
                        ? "heroicons:chevron-down"
                        : "heroicons:chevron-right"
                    }
                    className="w-4 h-4"
                  />
                )}
                {childCount > 0 && (
                  <span className="text-[11px] font-bold leading-none pr-0.5">
                    {childCount}
                  </span>
                )}
              </button>
            )}
            <Link
              to={`/project/${node.id}`}
              state={{ jobId: jobId }}
              title={node.task_title}
              className="text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate"
            >
              {node.task_title || "Untitled"}
            </Link>
            {localUrgent && (
              <span
                className="ml-2 shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800"
                title="A task or sub-task nested inside is marked Urgent"
              >
                <span aria-hidden="true">⚠️</span> Urgent inside
              </span>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3 align-middle">
          <EditableTaskStatus
            taskId={node.id}
            currentStatus={node.task_status}
            onStatusUpdate={handleStatus}
            isEditable={isEditable}
          />
        </td>

        {/* Assignees */}
        <td className="px-4 py-3 align-middle">
          <AssigneeAvatars assignees={node.assignees} />
        </td>

        {/* Due date */}
        <td className="px-4 py-3 align-middle text-sm">
          <EditableDueDate
            taskId={node.id}
            currentDueDate={node.due_date}
            onDateUpdate={handleDue}
            isEditable={isEditable}
          />
        </td>

        {/* Priority */}
        <td className="px-4 py-3 align-middle text-sm">
          <EditablePriority
            taskId={node.id}
            currentPriority={node.priority}
            onPriorityUpdate={handlePriority}
            isEditable={isEditable}
          />
        </td>

        {/* Actions */}
        <td className="px-4 py-3 align-middle">
          <div className="flex items-center justify-center space-x-1">
            {isEditable && onEditTask && (
              <button
                type="button"
                onClick={() => onEditTask(node)}
                title="Edit"
                className="p-1.5 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-600"
              >
                <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                title="Delete"
                className="p-1.5 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-slate-600"
              >
                <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Children */}
      {expanded &&
        children &&
        children.map((child) => (
          <TaskNodeRow
            key={child.id}
            task={child}
            depth={depth + 1}
            isEditable={isEditable}
            canDelete={canDelete}
            jobId={jobId}
            onEditTask={onEditTask}
            onDeleted={removeChild}
            onDescendantUrgent={markDescendantUrgent}
            onPatch={patchChild}
          />
        ))}

      {expanded && children && children.length === 0 && !loading && (
        <tr>
          <td
            colSpan={COLSPAN}
            className="px-4 py-2 text-xs italic text-slate-400 dark:text-slate-500"
            style={{ paddingLeft: 12 + (depth + 1) * INDENT_STEP + 20 }}
          >
            No sub-tasks
          </td>
        </tr>
      )}
    </>
  );
};

// --- Table wrapper ---------------------------------------------------------

// `nodes` is the already-fetched first level (parent tasks for a Job, or the
// sub-tasks of a task). Deeper levels are lazy-loaded by each row.
const TaskTree = ({
  nodes,
  isEditable = false,
  canDelete = isEditable,
  jobId = null,
  depth = 0,
  showHeader = true,
  onEditTask,
  onNodeDeleted, // optional (id) => void — lets the surface sync its own state
  onStatusUpdate, // optional (id, status) => void — bubbled from TOP-LEVEL rows only
  onDateUpdate, // optional (id, date) => void — bubbled from TOP-LEVEL rows only
  emptyLabel = "No items to display.",
  className = "",
}) => {
  const [rows, setRows] = useState(nodes || []);

  useEffect(() => {
    setRows(nodes || []);
  }, [nodes]);

  const removeRow = (id) => {
    setRows((r) => r.filter((x) => x.id !== id));
    onNodeDeleted?.(id);
  };

  // Keep the top-level cache in sync when a row edits a field, so it survives a
  // re-render / remount without reverting to the originally-fetched value.
  const patchRow = (id, patch) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        {showHeader && (
          <thead className="bg-slate-50 dark:bg-slate-700/60">
            <HeaderCells />
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={COLSPAN}
                className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((task) => (
              <TaskNodeRow
                key={task.id}
                task={task}
                depth={depth}
                isEditable={isEditable}
                canDelete={canDelete}
                jobId={jobId}
                onEditTask={onEditTask}
                onDeleted={removeRow}
                onStatusUpdate={onStatusUpdate}
                onDateUpdate={onDateUpdate}
                onPatch={patchRow}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Loads its first level on mount (used inside an expanded Job / member-task row),
// then hands off to TaskTree. `loader` returns a promise of the node array.
const LazyTaskTree = ({
  loader,
  isEditable = false,
  canDelete = isEditable,
  jobId = null,
  showHeader = true,
  onEditTask,
  emptyLabel = "No items to display.",
}) => {
  const [state, setState] = useState({ loading: true, nodes: [], error: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, nodes: [], error: null });
    loader()
      .then((nodes) => active && setState({ loading: false, nodes, error: null }))
      .catch(
        () =>
          active &&
          setState({ loading: false, nodes: [], error: "Failed to load." })
      );
    return () => {
      active = false;
    };
    // loader is derived from a stable id per instance; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-slate-500 dark:text-slate-400">
        <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin mr-2" />
        Loading…
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="py-4 text-center text-sm text-red-500">{state.error}</div>
    );
  }
  return (
    <TaskTree
      nodes={state.nodes}
      isEditable={isEditable}
      canDelete={canDelete}
      jobId={jobId}
      showHeader={showHeader}
      onEditTask={onEditTask}
      emptyLabel={emptyLabel}
    />
  );
};

export { TaskNodeRow, LazyTaskTree };
export default TaskTree;
