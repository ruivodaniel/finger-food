// The host of a previewer's editor, when the previewer sits where the host draws its own hover buttons (the canvas): the previewer's own edit button and double click are off, the
// host opens the sheet (`open`) and learns from the shell that this previewer has an editor (`register`).
import { createContext } from "react";
export type EditHostValue = { open: boolean; setOpen: (open: boolean) => void; register: (has: boolean) => void };
export const EditHost = createContext<EditHostValue | null>(null);
