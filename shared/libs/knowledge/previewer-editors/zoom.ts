// What a previewer may ask of the canvas it sits in: is a size of `px` too small to read at the zoom the canvas has? The canvas provides it (a hook that re-renders only when the answer changes);
// anywhere else nothing is too small. A previewer uses it to draw a simpler picture of itself far away (the code snippet's skeleton).
import { createContext, useContext } from "react";
export const UnreadableContext = createContext<(px: number) => boolean>(() => false);
export const useUnreadable = (px: number) => useContext(UnreadableContext)(px);
