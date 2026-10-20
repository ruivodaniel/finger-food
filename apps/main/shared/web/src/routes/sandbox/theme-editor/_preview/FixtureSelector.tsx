import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FIXTURES } from "../_fixtures/generated";
import { COMPONENT_FIXTURES } from "../_fixtures/components";
import { getSnapshotFixtures } from "../../_snapshots/reader";
import { usePopoverPlacement } from "../_editors/shared/usePopoverPlacement";

/** Picker only needs id/path/label — kind is irrelevant to the tree. */
type FixtureMeta = { id: string; path: string[]; label: string };

/**
 * Fixture picker — a tree-menu popover that mirrors the folder structure
 * under `_fixtures/html/`. Folders are collapsible; leaves are picks.
 *
 * THEME ISOLATION RULE: lives in the editor chrome — static palette only.
 */
type Props = {
  value: string;
  onChange: (fixtureId: string) => void;
};

// ── Tree shape ──────────────────────────────────────────────

type TreeNode = {
  /** Last segment in the path — used as label for folder rows. */
  segment: string;
  /** Full path-segments from root. */
  path: string[];
  /** Folders only — children. Leaves have an empty children array. */
  children: TreeNode[];
  /** Set on leaves only. */
  fixture?: FixtureMeta;
};

function buildTree(fixtures: FixtureMeta[]): TreeNode {
  const root: TreeNode = { segment: "", path: [], children: [] };
  for (const f of fixtures) {
    let cursor = root;
    for (let i = 0; i < f.path.length; i++) {
      const seg = f.path[i]!;
      const isLeaf = i === f.path.length - 1;
      const cur = cursor;
      let child = cur.children.find((c) => c.segment === seg);
      if (!child) {
        child = {
          segment: seg,
          path: [...cur.path, seg],
          children: [],
        };
        cur.children.push(child);
      }
      if (isLeaf) child.fixture = f;
      cursor = child;
    }
  }
  return root;
}

// ── Component ───────────────────────────────────────────────

export function FixtureSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Merge component fixtures + handcrafted HTML + snapshot-derived into one
  // tree. Component fixtures (live React) come first so colliding ids win
  // over stale HTML counterparts. Not memoized — new snapshots HMR in via
  // the reader's glob; a memo with empty deps would lock first-mount value.
  const componentMeta: FixtureMeta[] = COMPONENT_FIXTURES.map(({ id, path, label }) => ({ id, path, label }));
  const allFixtures: FixtureMeta[] = [
    ...componentMeta,
    ...[...FIXTURES, ...getSnapshotFixtures()].filter(
      (f) => !componentMeta.some((c) => c.id === f.id),
    ),
  ];
  const tree = useMemo(() => buildTree(allFixtures), [allFixtures.length]);
  const active = allFixtures.find((f) => f.id === value);

  if (allFixtures.length === 0) {
    return (
      <span className="text-xs text-zinc-400 italic">
        No fixtures — run <code className="font-mono">pnpm theme:fixtures</code>
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-zinc-400 shrink-0">
          Fixture
        </span>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="bg-white text-zinc-900 text-xs rounded px-2 py-1 border border-zinc-200 outline-none focus:border-zinc-400 min-w-0 max-w-[320px] truncate flex items-center gap-1.5"
          title={active?.id ?? "Pick a fixture"}
        >
          <span className="truncate">{labelFor(active)}</span>
          <span className="text-zinc-400 text-[10px] shrink-0">▾</span>
        </button>
      </div>

      {open &&
        createPortal(
          <FixtureMenu
            triggerRef={triggerRef}
            tree={tree}
            value={value}
            onPick={(id) => {
              onChange(id);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </>
  );
}

function labelFor(active: FixtureMeta | undefined): string {
  if (!active) return "Pick a fixture…";
  // Show breadcrumb-style: "Elements > Foundation > Typography"
  if (active.path.length <= 1) return active.label;
  const parents = active.path.slice(0, -1).map(titleCase).join(" › ");
  return `${parents} › ${active.label}`;
}

function titleCase(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Menu popover ────────────────────────────────────────────

function FixtureMenu({
  triggerRef,
  tree,
  value,
  onPick,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  tree: TreeNode;
  value: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { style } = usePopoverPlacement(triggerRef, true, {
    width: 280,
    maxHeight: 480,
    align: "left",
  });

  // Auto-expand the path to the active fixture so the user lands oriented.
  const initialOpen = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (!value) return set;
    const segs = value.split("/");
    for (let i = 1; i < segs.length; i++) {
      set.add(segs.slice(0, i).join("/"));
    }
    return set;
  }, [value]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(initialOpen);
  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className="overflow-y-auto bg-white border border-zinc-200 rounded-lg shadow-xl py-1"
        style={{ ...style, zIndex: 9999 }}
      >
        {tree.children.map((node) => (
          <TreeRow
            key={node.segment}
            node={node}
            depth={0}
            value={value}
            openFolders={openFolders}
            onToggleFolder={toggleFolder}
            onPick={onPick}
          />
        ))}
      </div>
    </>
  );
}

function TreeRow({
  node,
  depth,
  value,
  openFolders,
  onToggleFolder,
  onPick,
}: {
  node: TreeNode;
  depth: number;
  value: string;
  openFolders: Set<string>;
  onToggleFolder: (key: string) => void;
  onPick: (id: string) => void;
}) {
  const isLeaf = !!node.fixture;
  const folderKey = node.path.join("/");
  const expanded = openFolders.has(folderKey);
  const padding = { paddingLeft: 8 + depth * 12 };

  if (isLeaf) {
    const active = node.fixture!.id === value;
    return (
      <button
        type="button"
        onClick={() => onPick(node.fixture!.id)}
        className={`w-full text-left text-[11px] px-2 py-1 flex items-center gap-1.5 hover:bg-zinc-100 ${
          active ? "bg-blue-100 text-blue-700 font-medium" : "text-zinc-800"
        }`}
        style={padding}
      >
        <span className="text-[9px] text-zinc-400 w-3 shrink-0 text-center">
          {active ? "●" : "○"}
        </span>
        <span className="truncate">{node.fixture!.label}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onToggleFolder(folderKey)}
        className="w-full text-left text-[10px] uppercase tracking-wider text-zinc-500 px-2 py-1 flex items-center gap-1.5 hover:bg-zinc-100"
        style={padding}
      >
        <span className="text-[9px] text-zinc-400 w-3 shrink-0 text-center">
          {expanded ? "▾" : "▸"}
        </span>
        <span className="truncate font-semibold">{titleCase(node.segment)}</span>
      </button>
      {expanded &&
        node.children.map((child) => (
          <TreeRow
            key={child.segment}
            node={child}
            depth={depth + 1}
            value={value}
            openFolders={openFolders}
            onToggleFolder={onToggleFolder}
            onPick={onPick}
          />
        ))}
    </>
  );
}
