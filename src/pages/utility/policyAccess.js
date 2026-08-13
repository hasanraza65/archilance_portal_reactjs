// Access rules for the "Leave Policies" feature — a plain module (no
// React/hooks) so it can be imported from Navmenu.jsx, ProtectedRoute.jsx,
// and page components alike. Kept separate from apiHelper.js since it
// introduces a fairly large new vocabulary (teams, policy view modes) that
// doesn't belong in the generic role/API helper file.
//
// `employee_team` values (set via Employees → Add/Edit → Team): "BIM Team",
// "3D Team", "Outsource Department", "Business Team", or empty/unset.

export const TEAM_NAMES = ["BIM Team", "3D Team", "Outsource Department", "Business Team"];

const RESTRICTED_POLICY_TEAMS = ["Outsource Department", "Business Team"];
const POLICY_MANAGE_ROLES = ["admin", "manager", "supervisor"];

/**
 * Who can see the Leave Policies page at all.
 *  - Internees never get it — see My Grading instead.
 *  - Outsource Department / Business Team aren't covered by this policy
 *    either, so their members can't see it — admin/manager/supervisor are
 *    exempt since they browse any team's policy for management purposes.
 */
export function canViewPolicies(user) {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  if (role === "internee") return false;

  const team = (user.employee_team || "").trim();
  const isRestrictedTeam = RESTRICTED_POLICY_TEAMS.includes(team);
  const isManagementExempt = POLICY_MANAGE_ROLES.includes(role);
  if (isRestrictedTeam && !isManagementExempt) return false;

  return true;
}

/**
 * Which layout LeavePoliciesPage should render. Call only once
 * canViewPolicies(user) is true.
 *  - "switcher"      — admin/manager/supervisor: a tab switcher, any team.
 *  - "executive-all" — Executive with no team assigned: every team's
 *                       addendum stacked at once, no switcher.
 *  - "scoped"        — a team is assigned (or being previewed): that
 *                       team's policy only.
 *  - "no-team"       — no team assigned, not an Executive: general policy
 *                       + a "you're not on a team yet" notice.
 */
export function getPolicyViewMode(user) {
  const role = (user?.role || "").toLowerCase();
  const team = (user?.employee_team || "").trim();
  if (POLICY_MANAGE_ROLES.includes(role)) return "switcher";
  if (role === "executive") return team ? "scoped" : "executive-all";
  return team ? "scoped" : "no-team";
}

/**
 * Who can use the "My Leaves" apply/track flow at all.
 *  - Internee — see My Grading instead.
 *  - "outsource" role (employee_type = Outsource, external contractor) —
 *    arranges leave directly with their manager.
 *  - "Outsource Department" team — independent of role — same reason.
 */
export function canUseMyLeaves(user) {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  if (role === "internee") return false;
  if (role === "outsource") return false;
  if ((user.employee_team || "").trim() === "Outsource Department") return false;
  return true;
}
