/**
 * Calls back when an element scrolls into view — how a list reads its next
 * page as the user scrolls near its end. Put the returned ref on a small
 * element at the end of the list (or at the top of the thread).
 */

import { useCallback, useRef } from "react";

export function useWhenVisible(onVisible: () => void, enabled: boolean) {
  const observer = useRef<IntersectionObserver | null>(null);
  const callback = useRef(onVisible);
  callback.current = onVisible;

  return useCallback(
    (element: HTMLElement | null) => {
      observer.current?.disconnect();
      if (!element || !enabled) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callback.current();
      });
      observer.current.observe(element);
    },
    [enabled],
  );
}
