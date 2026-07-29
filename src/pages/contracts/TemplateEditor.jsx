import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";

import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import VariableSidebar from "./VariableSidebar";
import ContractDocument from "./ContractDocument";
import ContractEditorStyles from "./ContractEditorStyles";
import {
  quillModules,
  quillFormats,
  insertVariableAtCursor,
  renderTemplate,
  extractPlaceholders,
} from "./contractUtils";
import {
  fetchContractVariables,
  fetchTemplate,
  createTemplate,
  updateTemplate,
} from "./contractsApi";

// Readable sample values so the preview looks like a real contract before any
// employee is chosen. Only used inside the template editor's preview.
const PREVIEW_SAMPLE = {
  employee_name: "John Doe",
  employee_email: "john.doe@example.com",
  employee_phone: "+92 300 0000000",
  employee_location: "Lahore, Pakistan",
  position: "Architect",
  start_date: "1st August, 2026",
  salary: "PKR 75,000 per month",
  probation_period: "3 months",
  work_location: "Remote",
  working_days: "Monday to Friday",
  notice_period: "10 days",
};

const TemplateEditor = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const quillRef = useRef(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [previewValues, setPreviewValues] = useState({});
  const [mode, setMode] = useState("edit"); // "edit" | "preview"
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [varsRes, tplRes] = await Promise.all([
          fetchContractVariables(),
          isEdit ? fetchTemplate(id) : Promise.resolve(null),
        ]);
        if (!active) return;

        const cat = varsRes.data?.catalog || [];
        const defaults = varsRes.data?.defaults || {};
        setCatalog(cat);
        // seed preview values: readable sample, overridden by any non-empty default
        const seed = { ...PREVIEW_SAMPLE };
        Object.entries(defaults).forEach(([k, v]) => {
          if (v !== "" && v != null) seed[k] = v;
        });
        setPreviewValues(seed);

        if (tplRes) {
          setTitle(tplRes.data?.title || "");
          setBody(tplRes.data?.body || "");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load the editor.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const labelByKey = useMemo(() => {
    const map = {};
    catalog.forEach((g) => g.items.forEach((it) => (map[it.key] = it.label)));
    return map;
  }, [catalog]);

  const usedKeys = useMemo(() => extractPlaceholders(body), [body]);

  const effectiveValues = useMemo(() => {
    const out = { ...previewValues };
    usedKeys.forEach((k) => {
      if (out[k] === undefined || out[k] === "") {
        out[k] = previewValues[k] ?? `[${labelByKey[k] || k}]`;
      }
    });
    return out;
  }, [previewValues, usedKeys, labelByKey]);

  const previewHtml = useMemo(
    () => renderTemplate(body, effectiveValues),
    [body, effectiveValues]
  );

  const handleInsert = (key) => {
    if (mode !== "edit") setMode("edit");
    // defer so the editor is mounted/focused before inserting
    setTimeout(() => insertVariableAtCursor(quillRef, key), 0);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please give the template a title.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateTemplate(id, { title: title.trim(), body });
        toast.success("Template updated.");
      } else {
        await createTemplate({ title: title.trim(), body });
        toast.success("Template created.");
      }
      navigate("/contracts");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save the template.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Loading editor…</div>;
  }

  return (
    <div className="pb-6">
      <ContractEditorStyles />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/contracts")}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Back to Contracts"
          >
            <Icon icon="heroicons-outline:arrow-left" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">
              {isEdit ? "Edit Template" : "New Template"}
            </h1>
            <p className="text-xs text-slate-400">
              Build the contract body and drop in variables — fill them when you send.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
            {["edit", "preview"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                  mode === m
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {m === "edit" ? "Edit" : "Preview"}
              </button>
            ))}
          </div>
          <Button
            text="Cancel"
            className="btn-outline-secondary"
            onClick={() => navigate("/contracts")}
            disabled={saving}
          />
          <Button
            text={saving ? "Saving…" : "Save Template"}
            icon="heroicons-outline:check"
            className="btn-dark"
            onClick={handleSave}
            isLoading={saving}
            disabled={saving}
          />
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Template title (e.g. 3D Team — Employment Contract)"
          className="w-full px-4 py-3 text-base font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      {/* Body: variables rail + editor/preview */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden h-[600px]">
          <VariableSidebar catalog={catalog} onInsert={handleInsert} />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          {mode === "edit" ? (
            <div className="contract-quill p-3">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={body}
                onChange={setBody}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write the contract here. Use the variables on the left for anything that changes per employee…"
              />
            </div>
          ) : (
            <div className="flex flex-col h-[600px]">
              {usedKeys.length > 0 && (
                <div className="border-b border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/40">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Sample values (preview only)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {usedKeys.map((k) => (
                      <div key={k}>
                        <label className="block text-[10px] text-slate-400 mb-0.5">
                          {labelByKey[k] || k}
                        </label>
                        <input
                          type="text"
                          value={previewValues[k] ?? ""}
                          onChange={(e) =>
                            setPreviewValues((p) => ({ ...p, [k]: e.target.value }))
                          }
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-900/40">
                <div className="mx-auto max-w-3xl bg-white shadow-sm rounded-lg p-8 md:p-12">
                  {body ? (
                    <ContractDocument html={previewHtml} />
                  ) : (
                    <p className="text-center text-slate-400 text-sm py-10">
                      Nothing to preview yet — add some content in the editor.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
