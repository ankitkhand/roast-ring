"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { EnteringArena } from "./theatrical-loading";

export function BattleLaunchLink() {
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (!entering) return;
    const recoveryTimer = window.setTimeout(() => setEntering(false), 15_000);
    return () => window.clearTimeout(recoveryTimer);
  }, [entering]);

  function beginEntry(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    try {
      sessionStorage.setItem("roast-arena:battle-clicked-at", String(Date.now()));
    } catch {
      // Storage is only used for development timing; navigation must still work without it.
    }
    flushSync(() => setEntering(true));
  }

  return (
    <>
      <Link className="button button-primary button-xl" href="/battle" onClick={beginEntry} aria-disabled={entering}>
        BATTLE NOW <span aria-hidden="true">↗</span>
      </Link>
      {entering && <EnteringArena />}
    </>
  );
}
