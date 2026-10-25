"use client";

import { useEffect, useState } from "react";

/**
 * Runs an api.ts call when deps change. Keeps the previous value while the
 * next one loads so charts don't flash empty when a toggle flips.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[]): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let live = true;
    fn().then((v) => live && setValue(v));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}
