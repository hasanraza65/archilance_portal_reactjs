import React, { useState } from "react";
import { useSelector } from "react-redux";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import {
  canViewPolicies,
  getPolicyViewMode,
  TEAM_NAMES,
} from "@/pages/utility/policyAccess";
import {
  POLICY_META,
  GENERAL_SECTIONS,
  TEAM_ADDENDA,
  BASE_TOTALS,
} from "@/constant/leavePolicyContent";
import PolicyBlock from "./PolicyBlock";

const TEAM_TABS = [{ value: "", label: "General" }, ...TEAM_NAMES.map((t) => ({ value: t, label: t }))];

const StatChip = ({ label, value }) => (
  <div className="rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2.5 text-center">
    <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
  </div>
);

// One general section, plus (if a team addendum applies) its note and any
// extra sections that belong right after it.
const PolicySection = ({ section, notes, extras }) => (
  <>
    <Card title={section.title} className="mb-4">
      <div className="space-y-3">
        {section.blocks.map((block, i) => (
          <PolicyBlock key={i} block={block} />
        ))}
      </div>
      {notes?.map((n, i) => (
        <div key={i} className="mt-4 rounded-lg border border-primary-200 bg-primary-50 dark:border-primary-500/30 dark:bg-primary-500/10 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-400 mb-1">
            {n.label} note
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.text}</p>
        </div>
      ))}
    </Card>
    {extras?.map((extra) => (
      <Card
        key={extra.id}
        title={
          <span className="flex items-center gap-2 flex-wrap">
            {extra.title}
            <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300" label={`${extra.teamLabel} only`} />
          </span>
        }
        className="mb-4 border border-primary-200 dark:border-primary-500/30"
      >
        <div className="space-y-3">
          {extra.blocks.map((block, i) => (
            <PolicyBlock key={i} block={block} />
          ))}
        </div>
      </Card>
    ))}
  </>
);

const LeavePoliciesPage = () => {
  const user = useSelector((state) => state.auth.user);
  const canManage = getPolicyViewMode(user) === "switcher";

  const [manageTeam, setManageTeam] = useState("");

  if (!canViewPolicies(user)) {
    return (
      <Card title="Leave Policies">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Icon icon="heroicons-outline:no-symbol" className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No leave policy applies to you
          </h3>
          <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            {(user?.role || "").toLowerCase() === "internee"
              ? "Internees aren't covered by this leave policy — see My Grading for how your track works instead."
              : `${user?.employee_team || "Your team"} isn't covered by this leave policy. Reach out to HR if you think that's wrong.`}
          </p>
        </div>
      </Card>
    );
  }

  const mode = getPolicyViewMode(user);
  const allTeamsMode = mode === "executive-all";
  const selectedTeam = canManage ? manageTeam : user?.employee_team || "";

  // The team addenda in play: one (or none) normally, or every team at once
  // in an Executive's "all teams" view.
  const activeAddenda = allTeamsMode
    ? Object.entries(TEAM_ADDENDA).map(([key, cfg]) => ({ key, ...cfg }))
    : TEAM_ADDENDA[selectedTeam]
    ? [{ key: selectedTeam, ...TEAM_ADDENDA[selectedTeam] }]
    : [];

  const activeLabel = allTeamsMode
    ? "All Teams — Executive Access"
    : selectedTeam || "General (All Teams)";

  const totals = allTeamsMode
    ? BASE_TOTALS
    : {
        ...BASE_TOTALS,
        casual: TEAM_ADDENDA[selectedTeam]?.casualTotal ?? BASE_TOTALS.casual,
        total: TEAM_ADDENDA[selectedTeam]?.totalLeaveDays ?? BASE_TOTALS.total,
      };

  return (
    <div>
      <Card title={POLICY_META.title} subtitle={`Effective ${POLICY_META.effectiveDate} · Policy Owner: ${POLICY_META.owner}`}>
        {canManage && (
          <div className="flex flex-wrap gap-2 mb-2">
            {TEAM_TABS.map((t) => (
              <button
                key={t.value || "general"}
                type="button"
                onClick={() => setManageTeam(t.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTeam === t.value
                    ? "bg-primary-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {!canManage && allTeamsMode && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Icon icon="heroicons-outline:shield-check" className="text-[14px] flex-none text-primary-500" />
            <span>
              You're not tied to one team, so as an <strong className="text-slate-700 dark:text-slate-200">Executive</strong> you
              see every team's policy below.
            </span>
          </div>
        )}
        {!canManage && !allTeamsMode && selectedTeam && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Icon icon="heroicons-outline:information-circle" className="text-[14px] flex-none" />
            <span>
              Showing the policy that applies to you — <strong className="text-slate-700 dark:text-slate-200">{activeLabel}</strong>.
            </span>
          </div>
        )}
        {!canManage && !allTeamsMode && !selectedTeam && (
          <div className="rounded-lg border border-warning-300 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10 px-4 py-3 flex items-start gap-3 mb-2">
            <Icon icon="heroicons-outline:exclamation-triangle" className="text-warning-600 dark:text-warning-400 text-[18px] flex-none mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning-800 dark:text-warning-300">You're not added to a team yet</p>
              <p className="text-xs text-warning-700/80 dark:text-warning-300/70 mt-0.5">
                Some leave rules (like the BIM Team's extra Casual Leave days) only apply once your admin adds you to
                a team. Below is the general company policy — check back after you've been added to a team.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-4" bodyClass="p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          {activeLabel} — Entitlement Summary
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label="Annual" value={totals.annual} />
          <StatChip label="Casual" value={totals.casual} />
          <StatChip label="Sick" value={totals.sick} />
          <StatChip label="Marriage" value={totals.marriage} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
          {totals.total} leave days + {totals.marriage} Marriage Leaves per leave year.
        </p>
        {allTeamsMode && activeAddenda.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Team-specific totals</p>
            {activeAddenda.map((a) => (
              <p key={a.key} className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white">{a.label}:</strong>{" "}
                {a.totalLeaveDays ?? BASE_TOTALS.total} total leave days ({a.casualTotal ?? BASE_TOTALS.casual} Casual)
              </p>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-4">
        {GENERAL_SECTIONS.map((section) => {
          const notes = activeAddenda
            .filter((a) => a.sectionNotes?.[section.id])
            .map((a) => ({ label: a.label, text: a.sectionNotes[section.id] }));
          const extras = activeAddenda.flatMap((a) =>
            (a.extraSections || [])
              .filter((extra) => extra.insertAfter === section.id)
              .map((extra) => ({ ...extra, teamLabel: a.label }))
          );
          return <PolicySection key={section.id} section={section} notes={notes} extras={extras} />;
        })}
      </div>
    </div>
  );
};

export default LeavePoliciesPage;
