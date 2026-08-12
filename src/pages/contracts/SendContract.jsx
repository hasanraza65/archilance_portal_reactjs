import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { toast } from "react-toastify";

import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import ContractDocument from "./ContractDocument";
import ContractEditorStyles from "./ContractEditorStyles";
import {
  quillModules,
  quillFormats,
  renderTemplate,
  extractPlaceholders,
  isDateKey,
  formatPrettyDate,
} from "./contractUtils";
import {
  fetchContractVariables,
  fetchTemplates,
  fetchTemplate,
  fetchEmployeesForPicker,
  createContract,
} from "./contractsApi";

const selectStyles = {
  control: (b) => ({ ...b, minHeight: 44, borderRadius: 10 }),
  menu: (b) => ({ ...b, zIndex: 30 }),
};

const SendContract = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetTemplateId = searchParams.get("template");
  const quillRef = useRef(null);

  const [catalog, setCatalog] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateBody, setTemplateBody] = useState("");
  const [title, setTitle] = useState("");
  const [values, setValues] = useState({});
  const [dateValues, setDateValues] = useState({}); // Date objects backing the date pickers
  const [body, setBody] = useState("");
  const [manualEdit, setManualEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [varsRes, empRes, tplRes] = await Promise.all([
          fetchContractVariables(),
          fetchEmployeesForPicker(),
          fetchTemplates(),
        ]);
        if (!active) return;

        setCatalog(varsRes.data?.catalog || []);
        setValues(varsRes.data?.defaults || {});
        // contract_date defaults to today (its string default is today formatted),
        // so back the picker with today's Date.
        setDateValues({ contract_date: new Date() });

        const empData = Array.isArray(empRes.data?.data)
          ? empRes.data.data
          : Array.isArray(empRes.data)
          ? empRes.data
          : [];
        setEmployees(
          empData.map((e) => ({
            value: e.id,
            label: `${e.name}${e.email ? ` · ${e.email}` : ""}`,
            employee: e,
          }))
        );

        const tpls = Array.isArray(tplRes.data) ? tplRes.data : tplRes.data?.data || [];
        const tplOptions = tpls.map((t) => ({ value: t.id, label: t.title, template: t }));
        setTemplates(tplOptions);

        if (presetTemplateId) {
          const found = tplOptions.find((o) => String(o.value) === String(presetTemplateId));
          if (found) await applyTemplate(found);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load the send form.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelByKey = useMemo(() => {
    const map = {};
    catalog.forEach((g) => g.items.forEach((it) => (map[it.key] = it.label)));
    return map;
  }, [catalog]);

  // All keys to collect: catalog keys + any extra placeholders present in the template.
  const groupedInputs = useMemo(() => {
    const extra = extractPlaceholders(templateBody).filter((k) => !labelByKey[k]);
    const groups = catalog.map((g) => ({ group: g.group, keys: g.items.map((i) => i.key) }));
    if (extra.length) groups.push({ group: "Other", keys: extra });
    return groups;
  }, [catalog, templateBody, labelByKey]);

  // Regenerate the editable body from template + values, unless the sender has
  // started hand-editing the content.
  useEffect(() => {
    if (manualEdit) return;
    setBody(renderTemplate(templateBody, values));
  }, [templateBody, values, manualEdit]);

  const applyTemplate = async (option) => {
    setSelectedTemplate(option);
    setManualEdit(false);
    let tpl = option?.template;
    // list endpoint already returns body, but fetch fresh to be safe
    try {
      const res = await fetchTemplate(option.value);
      tpl = res.data || tpl;
    } catch (_) {
      /* fall back to the option's template */
    }
    setTemplateBody(tpl?.body || "");
    setTitle((prev) => prev || tpl?.title || "");
  };

  const handleEmployee = (option) => {
    setSelectedEmployee(option);
    const e = option?.employee;
    setValues((v) => ({
      ...v,
      employee_name: e?.name || "",
      employee_email: e?.email || "",
      employee_phone: e?.phone || "",
    }));
  };

  const handleSend = async () => {
    if (!selectedEmployee) return toast.error("Please choose an employee.");
    if (!selectedTemplate) return toast.error("Please choose a template.");
    if (!title.trim()) return toast.error("Please enter a contract title.");
    if (!body || !body.replace(/<[^>]*>/g, "").trim())
      return toast.error("The contract content is empty.");

    setSending(true);
    try {
      const res = await createContract({
        recipient_id: selectedEmployee.value,
        template_id: selectedTemplate.value,
        title: title.trim(),
        body,
        variables: values,
      });
      toast.success(res.data?.message || "Contract sent.");
      navigate("/contracts");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send the contract.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="pb-6">
      <ContractEditorStyles />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/contracts")}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Back to Contracts"
          >
            <Icon icon="heroicons-outline:arrow-left" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Send a Contract</h1>
            <p className="text-xs text-slate-400">
              Pick an employee and a template, review the filled contract, then send.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((s) => !s)}
            className="lg:hidden px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          >
            {showPreview ? "Edit fields" : "Preview"}
          </button>
          <Button
            text={sending ? "Sending…" : "Generate & Send"}
            icon="heroicons-outline:paper-airplane"
            className="btn-dark"
            onClick={handleSend}
            isLoading={sending}
            disabled={sending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-4">
        {/* Left: form */}
        <div
          className={`${
            showPreview ? "hidden" : "block"
          } lg:block space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 h-fit`}
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Employee
            </label>
            <Select
              options={employees}
              value={selectedEmployee}
              onChange={handleEmployee}
              placeholder="Search employees…"
              styles={selectStyles}
              classNamePrefix="react-select"
              isClearable
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Template
            </label>
            <Select
              options={templates}
              value={selectedTemplate}
              onChange={applyTemplate}
              placeholder="Choose a template…"
              styles={selectStyles}
              classNamePrefix="react-select"
              noOptionsMessage={() => "No templates yet — create one first."}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Contract Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employment Contract"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {selectedTemplate && (
            <div className="pt-1 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Contract details
              </div>
              {groupedInputs.map((g) => (
                <div key={g.group}>
                  <div className="text-[11px] text-slate-400 mb-1.5">{g.group}</div>
                  <div className="space-y-2">
                    {g.keys.map((k) => (
                      <div key={k}>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                          {labelByKey[k] || k}
                        </label>
                        {isDateKey(k) ? (
                          <Flatpickr
                            value={dateValues[k] || ""}
                            options={{
                              dateFormat: "Y-m-d",
                              // Flatpickr has no ordinal token ("S" means seconds, which
                              // rendered "2900 July"), so format the visible value with the
                              // same helper the preview uses → "20th July, 2026".
                              formatDate: (date) => formatPrettyDate(date),
                            }}
                            placeholder="Select a date"
                            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            onChange={(selected) => {
                              const d = selected && selected[0];
                              setDateValues((p) => ({ ...p, [k]: d || "" }));
                              setValues((v) => ({
                                ...v,
                                [k]: d ? formatPrettyDate(d) : "",
                              }));
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={values[k] ?? ""}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [k]: e.target.value }))
                            }
                            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: editable preview */}
        <div
          className={`${
            showPreview ? "block" : "hidden"
          } lg:block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden`}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Icon icon="heroicons-outline:document-text" className="text-indigo-500" />
              Contract Preview
              {manualEdit && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                  edited
                </span>
              )}
            </div>
            {manualEdit && (
              <button
                type="button"
                onClick={() => {
                  setManualEdit(false);
                  setBody(renderTemplate(templateBody, values));
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Icon icon="heroicons-outline:refresh" className="text-xs" />
                Reset to template
              </button>
            )}
          </div>

          {!selectedTemplate ? (
            <div className="p-16 text-center text-slate-400 text-sm">
              Choose an employee and a template to see the contract here. You can fine-tune
              the wording before sending — edits only affect this contract, not the template.
            </div>
          ) : (
            <div className="contract-quill p-3">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={body}
                onChange={(content, _delta, source) => {
                  setBody(content);
                  if (source === "user") setManualEdit(true);
                }}
                modules={quillModules}
                formats={quillFormats}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendContract;
