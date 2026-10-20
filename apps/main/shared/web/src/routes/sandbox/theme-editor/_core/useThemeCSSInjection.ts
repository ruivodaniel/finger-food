import { useState, useEffect, useRef } from "react";
import type { Theme } from "../../../../../../../../../shared/libs/ui/types";
import { themeToCSS } from "../../../../../../../../../shared/libs/ui/web/theme-engine";

/**
 * Generates CSS from the draft theme (debounced) and returns it as a string.
 * The caller injects it as a <style> tag into the preview container.
 */
export function useThemeCSSInjection(draft: Theme) {
  const [css, setCss] = useState(() => themeToCSS(draft));
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setCss(themeToCSS(draft));
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft]);

  return css;
}
