import type { Theme, ThemeRule } from "../../../../../../../../../shared/libs/ui/types";
import type { NavSelection, OnChange } from "../_core/types";
import {
  PropertyPanelShell,
  PropertyPanelEmpty,
} from "../_chrome/PropertyPanelShell";
import {
  selectionToPath,
  resolveShape,
  resolveInheritedPath,
  readPath,
  lookupEditor,
  UnsupportedShape,
} from "../_core/shape-system";
import { ThemeRefsProvider } from "../_editors/shared/ThemeRefsContext";

type Props = {
  theme: Theme;
  selection: NavSelection | null;
  onChange: OnChange;
};

/**
 * Right-column property panel — pure shape-dispatch.
 *
 * Selection → absolute path → shape resolution → editor lookup.
 * Override pills, scoped writes, and override-meta sections all live INSIDE
 * the shape editor (e.g. SurfaceShapeView), not at the panel level.
 *
 * Shapes that aren't yet registered render `<UnsupportedShape />` — the
 * editor never crashes on unknown shapes; it surfaces them as a known
 * "no editor yet" state with the raw value visible.
 */
export function PropertyPanel({ theme, selection, onChange }: Props) {
  if (!selection) return <PropertyPanelEmpty />;

  const path = selectionToPath(selection);
  const shape = resolveShape(path);
  const data = readPath(theme, path);
  const inheritedPath = resolveInheritedPath(path);
  const inherited =
    inheritedPath != null ? readPath(theme, inheritedPath) : undefined;

  const editorOnChange: OnChange = (subPath, value) => {
    onChange([...path, ...subPath], value);
  };

  const effectKeys = Object.keys(theme.effects ?? {});

  const Editor = shape ? lookupEditor(shape) : null;

  const { breadcrumb, title } = headerLabels(theme, selection);

  return (
    <ThemeRefsProvider gradients={theme.gradients}>
      <PropertyPanelShell breadcrumb={breadcrumb} title={title}>
        {Editor ? (
          <Editor
            data={data}
            inherited={inherited}
            onChange={editorOnChange}
            effectKeys={effectKeys}
          />
        ) : (
          <UnsupportedShape path={path} raw={data} />
        )}
      </PropertyPanelShell>
    </ThemeRefsProvider>
  );
}

/**
 * Compute the panel's breadcrumb + title for the current selection.
 * Most selections render `selection.path.join(" > ")` directly. Rules
 * are special: their `path` is a numeric index, so we look up the rule
 * and render its chain text.
 */
function headerLabels(
  theme: Theme,
  selection: NavSelection,
): { breadcrumb: string; title: string } {
  if (selection.category === "rules") {
    const idx = Number(selection.path[0]);
    const rule = (theme.rules ?? [])[idx];
    return {
      breadcrumb: "rules",
      title: rule ? chainText(rule) : `rule #${selection.path[0]}`,
    };
  }
  return {
    breadcrumb: selection.category,
    title: selection.path.join(" > "),
  };
}

/** Render a rule's chain as `[concept] key > [concept] key > …`. */
function chainText(rule: ThemeRule): string {
  return rule.chain
    .map((seg) => (seg.concept ? `${seg.concept} ${seg.key}` : seg.key))
    .join(" > ");
}
