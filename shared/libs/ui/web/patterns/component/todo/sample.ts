import type { TodoNode } from "@libs/knowledge/previewer-editors/todo-tree";

// The items the two examples start from. An item has `createdAt` (set when it is made) and `completedAt` (set when it is ticked); a few are already done, with their dates.
const d = (day: string) => `2026-10-${day}T09:00:00.000Z`;
const l = (id: string, title: string, o: { detail?: string; created?: string; completed?: string } = {}): TodoNode => ({ id, title, detail: o.detail, done: !!o.completed, createdAt: o.created ?? d("20"), completedAt: o.completed, children: [] });
const g = (id: string, title: string, children: TodoNode[], detail?: string): TodoNode => ({ id, title, detail, createdAt: d("15"), children });
export const sample = (): TodoNode[] => [
  g("launch", "Launch the beta", [
    g("launch-build", "Build", [
      l("b1", "Sign-in and invitations", { detail: "Magic link first; passwords later.", created: d("16"), completed: d("19") }),
      l("b2", "The first project template"),
      g("b3", "Billing", [l("b3a", "Plans and limits", { created: d("17"), completed: d("18") }), l("b3b", "Invoices as PDF"), l("b3c", "Failed payments: the retry rules", { detail: "Three tries over a week, then the account is paused." })]),
    ]),
    g("launch-test", "Test", [l("t1", "Walk through with five customers"), l("t2", "Fix what they stumble on")]),
    l("launch-date", "Choose the date", { detail: "After the pricing is settled.", created: d("15"), completed: d("24") }),
  ]),
  g("docs", "Documentation", [l("d1", "Getting started"), l("d2", "The API reference", { detail: "Generated from the models." }), l("d3", "Release notes template", { created: d("21"), completed: d("22") })]),
  l("idea", "Think about an affiliate programme"),
];
