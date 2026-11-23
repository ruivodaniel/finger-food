import { Avatar, AvatarFallback, Badge, Button, Card, RichTable, type RichTableColumn, type RichTableQuery, type RichTableRow, type RichTableView } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance, instances } from "../../../../lib/instance";

// the fixtures below the first are in this file too

// ── queried: 45 customers in the store; the table pages them 20 at a time through a fake API that reads the store (sort, filters and pages on its side, after a short wait)
const STATUS = ["active", "pending", "paused", "churned"];
const CUSTOMERS: RichTableRow[] = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1, name: `Customer ${String(i + 1).padStart(2, "0")}`, revenue: ((i * 7919) % 9000) + 500, status: STATUS[i % 4], since: `20${15 + (i % 10)}-0${1 + (i % 9)}-1${i % 9}`, vip: i % 7 === 0, site: `https://example.com/c/${i + 1}`,
}));
const QID = "rich-table-queried";
const api = async (q: RichTableQuery) => {
  await new Promise((r) => setTimeout(r, 300));
  let rows = (instances.get(QID)?.data.records as RichTableRow[] | undefined) ?? [];
  for (const [k, t] of Object.entries(q.filters)) rows = rows.filter((r) => String(r[k] ?? "").toLowerCase().includes(t.toLowerCase()));
  for (const s of [...q.sort].reverse()) rows = [...rows].sort((a, b) => { const x = a[s.key], y = b[s.key]; const d = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)); return s.direction === "asc" ? d : -d; });
  return { rows: rows.slice((q.page - 1) * q.size, q.page * q.size), total: rows.length };
};
type SavedView = { id: string; name: string; view: Partial<RichTableView> };
const VIEWS: SavedView[] = [
  { id: "all", name: "All customers", view: {} },
  { id: "active", name: "Active, best first", view: { sort: [{ key: "revenue", direction: "desc" }], filters: { status: "active" } } },
  { id: "vip", name: "Names first, wide", view: { order: ["name", "vip", "revenue", "status", "since", "site", "open"], widths: { name: 260 } } },
];
const QUERIED: RichTableColumn[] = [
  { key: "name", name: "Name", width: 170, filterable: true, frozen: "start" },
  { key: "revenue", name: "Revenue", type: "number", width: 120, validate: (v) => v === null || (typeof v === "number" && v >= 0) || "revenue cannot be negative" },
  { key: "status", name: "Status", type: "tag", options: STATUS, width: 130, filterable: true },
  { key: "since", name: "Since", type: "date", width: 130 },
  { key: "vip", name: "VIP", type: "boolean", width: 80 },
  { key: "site", name: "Site", type: "link", width: 220 },
  { key: "open", name: "", width: 90, sortable: false, resizable: false, editable: false, frozen: "end", render: (row) => <Button emphasis="tertiary" scale="xs" onClick={() => alert(`open ${row.name}`)}>Open</Button> },
];

// ── authored: a working dataset the person writes: an enum column with the library dropdown, and components inside cells
const PEOPLE = ["Ana Costa", "Bruno Reis", "Carla Lima", "Diogo Pires"];
const STAGES = ["idea", "design", "build", "review", "done"];
const AID = "rich-table-authored";
const AUTHORED_COLUMNS: RichTableColumn[] = [
  { key: "task", name: "Task", width: 220, frozen: "start" },
  { key: "owner", name: "Owner", type: "tag", options: PEOPLE, width: 190,
    render: (row) => row.owner ? <Stack dir="row" gap={8} align="center"><Avatar><AvatarFallback>{String(row.owner).split(" ").map((w) => w[0]).join("")}</AvatarFallback></Avatar><span>{String(row.owner)}</span></Stack> : null },
  { key: "stage", name: "Stage", type: "tag", options: STAGES, width: 140 },
  { key: "points", name: "Points", type: "number", width: 100, validate: (v) => v === null || (typeof v === "number" && Number.isInteger(v) && v >= 0) || "points are a whole number from 0" },
  { key: "due", name: "Due", type: "date", width: 140 },
  { key: "blocked", name: "Blocked", type: "boolean", width: 90 },
  { key: "labels", name: "Labels", width: 200, editable: false, render: (row) => <Stack dir="row" gap={4}>{String(row.labels ?? "").split(",").filter(Boolean).map((l) => <Badge key={l}>{l.trim()}</Badge>)}</Stack> },
];
const AUTHORED_ROWS: RichTableRow[] = [
  { id: 1, task: "Draw the data model", owner: "Ana Costa", stage: "done", points: 5, due: "2026-11-03", blocked: false, labels: "model,core" },
  { id: 2, task: "Rich table fixtures", owner: "Bruno Reis", stage: "build", points: 3, due: "2026-11-08", blocked: false, labels: "ui" },
  { id: 3, task: "Versioning of explorations", owner: "Carla Lima", stage: "review", points: 8, due: "2026-11-12", blocked: true, labels: "core,risk" },
  { id: 4, task: "Dark mode of the canvas", owner: "", stage: "idea", points: 2, due: "", blocked: false, labels: "canvas" },
];

// ── wide: twelve months and more, so the sideways scroll shows
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WIDE_COLUMNS: RichTableColumn[] = [
  { key: "region", name: "Region", width: 160, frozen: "start" },
  ...MONTHS.map<RichTableColumn>((m) => ({ key: m, name: m, type: "number", width: 100 })),
  { key: "target", name: "Target", type: "number", width: 110 },
  { key: "gap", name: "Gap", type: "number", width: 100 },
  { key: "owner", name: "Owner", width: 160 },
  { key: "note", name: "Note", width: 240 },
  { key: "total", name: "Total", type: "number", width: 120, frozen: "end" },
];
const WIDE_ROWS: RichTableRow[] = Array.from({ length: 14 }, (_, i) => {
  const months = Object.fromEntries(MONTHS.map((m, j) => [m, 100 + ((i * 37 + j * 53) % 400)]));
  const total = Object.values(months).reduce((a, b) => a + b, 0);
  return { id: i + 1, region: `Region ${i + 1}`, ...months, target: 3600, gap: total - 3600, owner: PEOPLE[i % 4], note: i % 3 ? "" : "review the plan", total };
});

// ── sheet: five columns of text, the cells hold numbers and formulas
const SID = "rich-table-sheet";
const SHEET_COLUMNS: RichTableColumn[] = ["a", "b", "c", "d", "e"].map((k) => ({ key: k, name: k, type: "text", width: 120 }));
const SHEET_ROWS: RichTableRow[] = [
  { id: 1, a: 10, b: 20, c: "=A1+B1", d: "=C1*2", e: "=SUM(A1:D1)" },
  { id: 2, a: 5, b: 15, c: "=A2+B2", d: "=C2*2", e: "=SUM(A2:D2)" },
  { id: 3, a: 7, b: 3, c: "=A3*B3", d: "=C3/2", e: "=AVG(A3:D3)" },
  { id: 4, a: "=SUM(A1:A3)", b: "=SUM(B1:B3)", c: "=SUM(C1:C3)", d: "=MAX(D1:D3)", e: "=COUNT(A1:D3)" },
  ...Array.from({ length: 4 }, (_, i) => ({ id: 5 + i })),
];

export default function RichTableFixture() {
  return (
    <FixtureBody>
      <Row label="queried: 45 records in the store, 20 a page, everything on: sort and filter in the headers, saved views in the card's header, our page bar, select, edit (revenue rejects a negative), copy, fill">
        <Instance id={QID} initial={{ data: { records: CUSTOMERS, page: 1, views: VIEWS, viewId: "all", live: {} } }}>
          {(x) => {
            const views = x.data.views as SavedView[], viewId = x.data.viewId as string;
            const current = views.find((v) => v.id === viewId) ?? views[0];
            const patch = (d: Record<string, unknown>) => instances.patch(QID, "data", d);
            return (
              <Card className="w-full">
                <Stack dir="row" gap={4} align="center" pad="8px 12px" style={{ flexWrap: "wrap" }}>
                  <span element="type--body-small" emphasis="quiet" style={{ marginRight: 8 }}>Views</span>
                  {views.map((v) => <Button key={v.id} emphasis={v.id === current.id ? "primary" : "tertiary"} scale="sm" onClick={() => patch({ viewId: v.id, page: 1 })}>{v.name}</Button>)}
                  <Button emphasis="tertiary" scale="sm" startIcon="add" onClick={() => { const id = `v${views.length + 1}`; patch({ views: [...views, { id, name: `View ${views.length + 1}`, view: x.data.live as Partial<RichTableView> }], viewId: id }); }}>Save this view</Button>
                </Stack>
                <RichTable
                  key={current.id}
                  source={{ kind: "queried", fetch: api, pageSize: 20 }}
                  columns={QUERIED}
                  initialView={current.view}
                  onViewChange={(live) => patch({ live })}
                  page={x.data.page as number}
                  onPageChange={(page) => patch({ page })}
                  onCellEdited={(row) => patch({ records: (x.data.records as RichTableRow[]).map((r) => (r.id === row.id ? row : r)) })}
                  editable selection="row" striped density="compact" height={440}
                />
              </Card>
            );
          }}
        </Instance>
      </Row>
      <Row label="authored: the whole dataset in the store; Owner and Stage are our dropdown, the owner cell holds an avatar, Labels are badges; add and delete rows, add a column">
        <Instance id={AID} initial={{ data: { rows: AUTHORED_ROWS, columns: AUTHORED_COLUMNS } }}>
          {(x) => (
            <RichTable
              source={{ kind: "authored", rows: x.data.rows as RichTableRow[], onChange: (rows) => instances.patch(AID, "data", { rows }) }}
              columns={x.data.columns as RichTableColumn[]}
              onColumnsChange={(columns) => instances.patch(AID, "data", { columns })}
              newRow={() => ({ id: Date.now(), task: "", owner: "", stage: "idea", points: 1, due: "", blocked: false, labels: "" })}
              selection="row" height={360} frozenColumns={1} rowHeight={72}
            />
          )}
        </Instance>
      </Row>
      <Row label="wide: eighteen columns in a container 720px wide and 300px high; the header stays, the first column and the total stick, the rest scrolls sideways (read-only)">
        <div style={{ width: 720 }}>
          <RichTable
            source={{ kind: "authored", rows: WIDE_ROWS, onChange: () => undefined }}
            columns={WIDE_COLUMNS}
            editable={false} striped density="compact" height={300}
          />
        </div>
      </Row>
      <Row label="sheet: A B C D E and 1 2 3, formulas (=A1+B1, =SUM(A1:C1), =AVG, =MAX, =COUNT); right click a row or a header; a formula shows its result and edits as text">
        <Instance id={SID} initial={{ data: { rows: SHEET_ROWS, columns: SHEET_COLUMNS } }}>
          {(x) => (
            <RichTable
              source={{ kind: "authored", rows: x.data.rows as RichTableRow[], onChange: (rows) => instances.patch(SID, "data", { rows }) }}
              columns={x.data.columns as RichTableColumn[]}
              onColumnsChange={(columns) => instances.patch(SID, "data", { columns })}
              newRow={() => ({ id: Date.now() })}
              columnLetters rowNumbers formulas reorderRows={false} height={360}
            />
          )}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
