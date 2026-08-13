import React, { useCallback, useEffect, useRef, useState } from "react";
import VersionChooser from "./VersionChooser";
import OnboardingTour from "./OnboardingTour";
import {
  V2_BASE, switchUrl, canUseVersionSwitch, getVersionChoice, hasSeenChooser,
  hasSession, markChooserSeen, readRole, setVersionChoice, isHandoff, clearHandoffParam,
} from "./versionPrefs";
import { classicToV2 } from "./routeMap";

/**
 * Mounted ONCE in the classic app. Owns the first-run chooser and the tour.
 *
 * Everything about the version switch lives under src/version2/ — this file and
 * the switcher button are the only two things the classic app imports, so the
 * existing code and design are untouched.
 *
 * Listens for a `archilance:open-tour` window event so the header button can
 * open the tour without prop-drilling through the classic layout.
 */
const VersionExperience = () => {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [ready, setReady] = useState(false);
  // A redirect is a full page load; this stops a second one being queued while
  // the browser is already navigating.
  const redirectingRef = useRef(false);

  // Only decide once the session cookie exists — showing the chooser to a
  // logged-out visitor on the login screen would be nonsense.
  useEffect(() => {
    const decide = () => {
      if (!hasSession()) { setReady(false); return; }
      const role = readRole();
      if (!canUseVersionSwitch(role)) { setReady(false); return; }
      setReady(true);
      if (!hasSeenChooser() && !getVersionChoice()) setChooserOpen(true);
    };
    decide();
    // The login flow writes the cookie without a reload, so re-check briefly.
    const t = setInterval(decide, 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const openTour = () => setTourOpen(true);
    window.addEventListener("archilance:open-tour", openTour);
    return () => window.removeEventListener("archilance:open-tour", openTour);
  }, []);

  const goToV2 = useCallback(() => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    setVersionChoice("v2");
    const target = classicToV2(window.location.pathname);
    window.location.href = switchUrl(V2_BASE, target);
  }, []);

  /**
   * Honour the saved preference on every visit.
   *
   * Choosing a version has to STICK - otherwise the classic app (which owns
   * "/") silently wins every time you open the portal, and the choice only
   * ever applied to that one click. Switching back in the new app writes
   * "classic" here, so this stops firing. The current path is carried across,
   * so a bookmarked job opens as that job.
   */
  useEffect(() => {
    if (!ready || redirectingRef.current) return;
    // Arrived via a deliberate switch BACK to classic - respect that and tidy
    // the marker out of the address bar.
    if (isHandoff()) { clearHandoffParam(); return; }
    if (getVersionChoice() === "v2") goToV2();
  }, [ready, goToV2]);

  const pick = useCallback((choice) => {
    markChooserSeen();
    if (choice === "v2") { goToV2(); return; }
    setVersionChoice("classic");
    setChooserOpen(false);
  }, [goToV2]);

  if (!ready) return null;

  return (
    <>
      <VersionChooser
        open={chooserOpen && !tourOpen}
        onPick={pick}
        onPreviewTour={() => setTourOpen(true)}
      />
      <OnboardingTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onChooseV2={goToV2}
        showChooseCta
      />
    </>
  );
};

export default VersionExperience;
