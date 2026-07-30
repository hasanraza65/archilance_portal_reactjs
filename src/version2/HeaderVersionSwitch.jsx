import React, { useEffect, useState } from "react";
import VersionSwitcher from "./VersionSwitcher";
import {
  V2_BASE, switchUrl, canUseVersionSwitch, hasSession, readRole, setVersionChoice,
} from "./versionPrefs";
import { classicToV2 } from "./routeMap";

/**
 * The switch button, dropped into the classic header's tool row.
 *
 * Renders nothing at all unless the signed-in user is allowed to switch, so on
 * every other account the classic header is byte-identical to before.
 */
const HeaderVersionSwitch = () => {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => setAllowed(hasSession() && canUseVersionSwitch(readRole()));
    check();
    const t = setInterval(check, 1500);
    return () => clearInterval(t);
  }, []);

  if (!allowed) return null;

  const switchToV2 = () => {
    setVersionChoice("v2");
    const target = classicToV2(window.location.pathname);
    window.location.href = switchUrl(V2_BASE, target);
  };

  return (
    <VersionSwitcher
      side="classic"
      onSwitch={switchToV2}
      onOpenTour={() => window.dispatchEvent(new CustomEvent("archilance:open-tour"))}
    />
  );
};

export default HeaderVersionSwitch;
