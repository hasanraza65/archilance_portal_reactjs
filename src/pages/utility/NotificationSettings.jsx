import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Switch from "@/components/ui/Switch";
import Loading from "@/components/Loading";

const API_BASE = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/notification-preferences`;

// Per-category icon (purely presentational; the backend owns the catalog itself).
const CATEGORY_ICON = {
  assignment: "heroicons-outline:clipboard-check",
  status_change: "heroicons-outline:refresh",
  comment: "heroicons-outline:chat-alt-2",
  due_reminder: "heroicons-outline:clock",
  chat_message: "heroicons-outline:chat",
  project_message: "heroicons-outline:chat-alt",
};

const GROUP_ICON = {
  Work: "heroicons-outline:briefcase",
  Reminders: "heroicons-outline:bell",
  Messages: "heroicons-outline:mail",
};

const authHeaders = () => ({
  Authorization: `Bearer ${Cookies.get("token")}`,
  Accept: "application/json",
});

const NotificationSettings = () => {
  const [categories, setCategories] = useState([]);
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null); // key currently persisting

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await axios.get(API_BASE, { headers: authHeaders() });
        if (!active) return;
        setCategories(data.categories || []);
        setPrefs(data.preferences || {});
        setError(null);
      } catch (e) {
        if (active) setError("Could not load your notification settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Categories grouped in display order, preserving first-seen group order.
  const grouped = useMemo(() => {
    const order = [];
    const byGroup = {};
    for (const c of categories) {
      const g = c.group || "Other";
      if (!byGroup[g]) {
        byGroup[g] = [];
        order.push(g);
      }
      byGroup[g].push(c);
    }
    return order.map((g) => ({ group: g, items: byGroup[g] }));
  }, [categories]);

  const persist = async (nextPrefs, key, prevValue) => {
    setSavingKey(key);
    try {
      const { data } = await axios.put(
        API_BASE,
        { preferences: nextPrefs },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } }
      );
      // Trust the server's resolved map (keeps us in sync if anything was coerced).
      if (data && data.preferences) setPrefs(data.preferences);
    } catch (e) {
      // Revert the single toggle that failed and let the user know.
      setPrefs((p) => ({ ...p, [key]: prevValue }));
      toast.error("Couldn't save that change. Please try again.");
    } finally {
      setSavingKey(null);
    }
  };

  // Optimistic: flip locally right away, then save the full map in the background.
  const toggle = (key) => {
    const prevValue = !!prefs[key];
    const next = { ...prefs, [key]: !prevValue };
    setPrefs(next);
    persist(next, key, prevValue);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Email Notifications
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose which emails you want to receive. Changes save automatically.
          Your in-app notifications are not affected.
        </p>
      </div>

      {error ? (
        <Card>
          <div className="p-2 text-center">
            <Icon
              icon="heroicons-outline:exclamation-circle"
              className="mx-auto h-10 w-10 text-red-400"
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ group, items }) => (
            <Card key={group} bodyClass="p-0">
              {/* Group header */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                <Icon
                  icon={GROUP_ICON[group] || "heroicons-outline:bell"}
                  className="w-4 h-4 text-slate-400"
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {group}
                </span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.map((c) => {
                  const on = !!prefs[c.key];
                  return (
                    <div
                      key={c.key}
                      className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${
                            on
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                          }`}
                        >
                          <Icon
                            icon={CATEGORY_ICON[c.key] || "heroicons-outline:bell"}
                            className="w-5 h-5"
                          />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {c.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {c.description}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 pt-1">
                        {savingKey === c.key && (
                          <Icon
                            icon="eos-icons:loading"
                            className="w-4 h-4 text-slate-400 animate-spin"
                          />
                        )}
                        <Switch
                          value={on}
                          onChange={() => toggle(c.key)}
                          id={`notif-${c.key}`}
                          disabled={savingKey === c.key}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-1">
            You'll always receive essential account emails (e.g. password resets),
            regardless of these settings.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
