import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

import {
  fetchContracts,
  fetchTemplates,
  deleteContract,
  deleteTemplate,
  updateContractStatus,
  resendContract,
} from "./contractsApi";
import {
  formatDate,
  formatDateTime,
  statusBadgeClass,
  CONTRACT_STATUSES,
} from "./contractUtils";

const ContractsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("contracts");

  /* ------------------------- Sent contracts ------------------------- */
  const [contracts, setContracts] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingContracts, setLoadingContracts] = useState(true);

  /* ---------------------------- Templates --------------------------- */
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  /* ----------------------------- Modals ----------------------------- */
  const [statusTarget, setStatusTarget] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name }
  const [deleting, setDeleting] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadContracts = useCallback(async () => {
    setLoadingContracts(true);
    try {
      const params = { page, per_page: 15 };
      if (debounced) params.search = debounced;
      if (statusFilter) params.status = statusFilter;
      const res = await fetchContracts(params);
      const data = res.data;
      setContracts(Array.isArray(data?.data) ? data.data : []);
      setMeta({
        currentPage: data?.current_page ?? 1,
        lastPage: data?.last_page ?? 1,
        total: data?.total ?? 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load contracts.");
    } finally {
      setLoadingContracts(false);
    }
  }, [page, debounced, statusFilter]);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetchTemplates();
      setTemplates(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load templates.");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied — paste it into WhatsApp or anywhere.");
    } catch {
      // Fallback for browsers without clipboard permission
      window.prompt("Copy this contract link:", url);
    }
  };

  const handleResend = async (id) => {
    setResendingId(id);
    try {
      const res = await resendContract(id);
      toast.success(res.data?.message || "Contract re-sent.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend.");
    } finally {
      setResendingId(null);
    }
  };

  const applyStatus = async (status) => {
    if (!statusTarget) return;
    setSavingStatus(true);
    try {
      await updateContractStatus(statusTarget.id, status);
      toast.success(`Status changed to ${status}.`);
      setStatusTarget(null);
      loadContracts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "contract") {
        await deleteContract(deleteTarget.id);
        toast.success("Contract deleted.");
        loadContracts();
      } else {
        await deleteTemplate(deleteTarget.id);
        toast.success("Template deleted.");
        loadTemplates();
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        tab === id
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      }`}
    >
      <Icon icon={icon} />
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Contracts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create templates, send employment contracts, and track acceptances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            text="New Template"
            icon="heroicons-outline:document-add"
            className="btn-outline-secondary"
            onClick={() => navigate("/contracts/templates/new")}
          />
          <Button
            text="Send Contract"
            icon="heroicons-outline:paper-airplane"
            className="btn-dark"
            onClick={() => navigate("/contracts/send")}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex gap-1">
        <TabButton id="contracts" label="Sent Contracts" icon="heroicons-outline:inbox-in" />
        <TabButton id="templates" label="Templates" icon="heroicons-outline:template" />
      </div>

      {tab === "contracts" ? (
        <Card bodyClass="p-0">
          {/* Filters */}
          <div className="p-4 flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-700">
            <div className="relative flex-1 min-w-[200px]">
              <Icon
                icon="heroicons-outline:search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email or title…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-select py-2 text-sm w-[150px]"
            >
              <option value="">All statuses</option>
              {CONTRACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/40">
                <tr>
                  {["Recipient", "Contract", "Status", "Sent", "Accepted", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {loadingContracts ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      No contracts yet. Click <b>Send Contract</b> to create the first one.
                    </td>
                  </tr>
                ) : (
                  contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {c.recipient_name || c.recipient?.name || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {c.recipient_email || c.recipient?.email || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 max-w-[220px] truncate">
                        {c.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(c.sent_at || c.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {c.accepted_at ? formatDateTime(c.accepted_at) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn
                            icon="heroicons-outline:eye"
                            title="Open public view"
                            onClick={() => window.open(c.public_url, "_blank", "noopener")}
                          />
                          <IconBtn
                            icon="heroicons-outline:link"
                            title="Copy public link"
                            onClick={() => copyLink(c.public_url)}
                          />
                          <IconBtn
                            icon="heroicons-outline:refresh"
                            title="Resend email"
                            loading={resendingId === c.id}
                            onClick={() => handleResend(c.id)}
                          />
                          <IconBtn
                            icon="heroicons-outline:adjustments"
                            title="Change status"
                            onClick={() => setStatusTarget(c)}
                          />
                          <IconBtn
                            icon="heroicons-outline:trash"
                            title="Delete"
                            danger
                            onClick={() =>
                              setDeleteTarget({
                                type: "contract",
                                id: c.id,
                                name: `${c.title} — ${c.recipient_name || ""}`,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.lastPage > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400">{meta.total} total</span>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                  disabled={meta.currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span className="text-sm text-slate-500">
                  {meta.currentPage} / {meta.lastPage}
                </span>
                <button
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                  disabled={meta.currentPage >= meta.lastPage}
                  onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        /* Templates tab */
        <div>
          {loadingTemplates ? (
            <div className="p-10 text-center text-slate-400">Loading templates…</div>
          ) : templates.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <Icon
                  icon="heroicons-outline:template"
                  className="text-4xl text-slate-300 mx-auto mb-3"
                />
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  No templates yet. Create your first contract template.
                </p>
                <Button
                  text="New Template"
                  icon="heroicons-outline:plus"
                  className="btn-dark"
                  onClick={() => navigate("/contracts/templates/new")}
                />
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-none">
                      <Icon
                        icon="heroicons-outline:document-text"
                        className="text-xl text-indigo-500"
                      />
                    </span>
                    <div className="min-w-0">
                      <h3
                        className="text-[15px] font-semibold text-slate-800 dark:text-white truncate leading-snug"
                        title={t.title}
                      >
                        {t.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Updated {formatDate(t.updated_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <Button
                      text="Send"
                      icon="heroicons-outline:paper-airplane"
                      className="btn-dark btn-sm"
                      onClick={() => navigate(`/contracts/send?template=${t.id}`)}
                    />
                    <Button
                      text="Edit"
                      icon="heroicons-outline:pencil"
                      className="btn-outline-secondary btn-sm"
                      onClick={() => navigate(`/contracts/templates/${t.id}/edit`)}
                    />
                    <button
                      type="button"
                      title="Delete"
                      onClick={() =>
                        setDeleteTarget({ type: "template", id: t.id, name: t.title })
                      }
                      className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Icon icon="heroicons-outline:trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Change-status modal */}
      <Modal
        title="Change contract status"
        activeModal={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        className="max-w-md"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {statusTarget?.recipient_name} — {statusTarget?.title}
        </p>
        <div className="space-y-2">
          {CONTRACT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={savingStatus}
              onClick={() => applyStatus(s)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                statusTarget?.status === s
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(
                    s
                  )}`}
                >
                  {s}
                </span>
                {s === "Accepted" && (
                  <span className="text-xs text-slate-400">Unlocks the employee's login</span>
                )}
              </span>
              {statusTarget?.status === s && (
                <Icon icon="heroicons-outline:check" className="text-indigo-500" />
              )}
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name}
        isLoading={deleting}
      />
    </div>
  );
};

const IconBtn = ({ icon, title, onClick, danger, loading }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={loading}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
      danger
        ? "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        : "text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
    } disabled:opacity-40`}
  >
    <Icon icon={loading ? "heroicons-outline:refresh" : icon} className={loading ? "animate-spin" : ""} />
  </button>
);

export default ContractsPage;
