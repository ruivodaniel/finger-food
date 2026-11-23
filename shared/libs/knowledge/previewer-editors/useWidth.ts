import { useLayoutEffect, useRef, useState } from "react";

/** the width of the previewer's own box, so a layout can rearrange its parts when its space is short (a canvas, a phone). Unknown on the first render: the wide arrangement. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setWidth(Math.round(el.getBoundingClientRect().width));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/** below this width the item layouts stack their parts, top to bottom */
export const STACK_AT = 760;
