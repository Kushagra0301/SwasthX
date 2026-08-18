"use client";

import { useEffect } from "react";

// Shared lock count so multiple independent components (the disclaimer modal,
// the mobile nav menu) can each request a scroll lock without one's cleanup
// prematurely un-locking scroll while another still needs it locked.
let lockCount = 0;

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    lockCount += 1;
    document.body.style.overflow = "hidden";

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [locked]);
}
