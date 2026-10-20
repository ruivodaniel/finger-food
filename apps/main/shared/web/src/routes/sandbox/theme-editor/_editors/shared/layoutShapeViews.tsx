// =============================================================================
// Layout shape views — one component per layout shape from layouts.ts.
//
// Bundled in one file because each is small (rows over a tiny shape) and
// they share the same accordion-+-Other-Properties pattern as families.
// =============================================================================

import { AccordionSection, useSingleExpand } from "./AccordionSection";
import { SurfaceShapeView } from "./SurfaceShapeView";
import { Section } from "./Section";
import { Row } from "./Row";
import { TextField } from "./TextField";
import { ColorField } from "./ColorField";
import { get, getObj, str } from "./_types";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

// ── Header scale (HeaderScaleTokens) ────────────────────────────────────────
// `{ surface, height, sm: {height}, md: {height}, lg: {height} }`
export function HeaderScaleShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const t = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const ax = useSingleExpand("surface");
  const sm = getObj(t, "sm");
  const md = getObj(t, "md");
  const lg = getObj(t, "lg");
  const inhSm = getObj(inh, "sm");
  const inhMd = getObj(inh, "md");
  const inhLg = getObj(inh, "lg");

  return (
    <>
      <AccordionSection
        title="Surface"
        glyph="⊞"
        expanded={ax.isOpen("surface")}
        onToggle={() => ax.toggle("surface")}
      >
        <SurfaceShapeView
          data={(t.surface ?? {}) as Rec}
          inherited={(inh?.surface as Rec | undefined) ?? undefined}
          onChange={(p, v) => onChange(["surface", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>
      <Section title="Other Properties">
        <Row label="height">
          <TextField
            value={str(get(t, "height"))}
            inherited={str(get(inh, "height"))}
            onChange={(v) => onChange(["height"], v)}
            placeholder="56px"
          />
        </Row>
        <Row label="sm">
          <TextField
            value={str(get(sm, "height"))}
            inherited={str(get(inhSm, "height"))}
            onChange={(v) => onChange(["sm", "height"], v)}
            placeholder="48px"
          />
        </Row>
        <Row label="md">
          <TextField
            value={str(get(md, "height"))}
            inherited={str(get(inhMd, "height"))}
            onChange={(v) => onChange(["md", "height"], v)}
            placeholder="56px"
          />
        </Row>
        <Row label="lg">
          <TextField
            value={str(get(lg, "height"))}
            inherited={str(get(inhLg, "height"))}
            onChange={(v) => onChange(["lg", "height"], v)}
            placeholder="64px"
          />
        </Row>
      </Section>
    </>
  );
}

// ── LeftSidebarTokens — surface + collapsed surface + width + scale ────────
export function LeftSidebarShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const t = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const ax = useSingleExpand("surface");
  const sm = getObj(t, "sm");
  const md = getObj(t, "md");
  const lg = getObj(t, "lg");
  const inhSm = getObj(inh, "sm");
  const inhMd = getObj(inh, "md");
  const inhLg = getObj(inh, "lg");

  return (
    <>
      <AccordionSection
        title="Surface"
        glyph="⊞"
        expanded={ax.isOpen("surface")}
        onToggle={() => ax.toggle("surface")}
      >
        <SurfaceShapeView
          data={(t.surface ?? {}) as Rec}
          inherited={(inh?.surface as Rec | undefined) ?? undefined}
          onChange={(p, v) => onChange(["surface", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>
      <AccordionSection
        title="Collapsed Surface"
        glyph="⊞"
        expanded={ax.isOpen("collapsed")}
        onToggle={() => ax.toggle("collapsed")}
      >
        <SurfaceShapeView
          data={((getObj(t, "collapsed").surface as Rec | undefined) ?? {}) as Rec}
          inherited={
            (getObj(inh, "collapsed").surface as Rec | undefined) ?? undefined
          }
          onChange={(p, v) => onChange(["collapsed", "surface", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>
      <Section title="Other Properties">
        <Row label="width">
          <TextField
            value={str(get(t, "width"))}
            inherited={str(get(inh, "width"))}
            onChange={(v) => onChange(["width"], v)}
          />
        </Row>
        <Row label="w. coll.">
          <TextField
            value={str(get(t, "widthCollapsed"))}
            inherited={str(get(inh, "widthCollapsed"))}
            onChange={(v) => onChange(["widthCollapsed"], v)}
          />
        </Row>
        <Row label="sm">
          <TextField
            value={str(get(sm, "width"))}
            inherited={str(get(inhSm, "width"))}
            onChange={(v) => onChange(["sm", "width"], v)}
          />
        </Row>
        <Row label="md">
          <TextField
            value={str(get(md, "width"))}
            inherited={str(get(inhMd, "width"))}
            onChange={(v) => onChange(["md", "width"], v)}
          />
        </Row>
        <Row label="lg">
          <TextField
            value={str(get(lg, "width"))}
            inherited={str(get(inhLg, "width"))}
            onChange={(v) => onChange(["lg", "width"], v)}
          />
        </Row>
      </Section>
    </>
  );
}

// ── SidebarTokens — surface + width + scale (no collapsed) ─────────────────
export function SidebarShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const t = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const ax = useSingleExpand("surface");
  const sm = getObj(t, "sm");
  const md = getObj(t, "md");
  const lg = getObj(t, "lg");
  const inhSm = getObj(inh, "sm");
  const inhMd = getObj(inh, "md");
  const inhLg = getObj(inh, "lg");

  return (
    <>
      <AccordionSection
        title="Surface"
        glyph="⊞"
        expanded={ax.isOpen("surface")}
        onToggle={() => ax.toggle("surface")}
      >
        <SurfaceShapeView
          data={(t.surface ?? {}) as Rec}
          inherited={(inh?.surface as Rec | undefined) ?? undefined}
          onChange={(p, v) => onChange(["surface", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>
      <Section title="Other Properties">
        <Row label="width">
          <TextField
            value={str(get(t, "width"))}
            inherited={str(get(inh, "width"))}
            onChange={(v) => onChange(["width"], v)}
          />
        </Row>
        <Row label="sm">
          <TextField
            value={str(get(sm, "width"))}
            inherited={str(get(inhSm, "width"))}
            onChange={(v) => onChange(["sm", "width"], v)}
          />
        </Row>
        <Row label="md">
          <TextField
            value={str(get(md, "width"))}
            inherited={str(get(inhMd, "width"))}
            onChange={(v) => onChange(["md", "width"], v)}
          />
        </Row>
        <Row label="lg">
          <TextField
            value={str(get(lg, "width"))}
            inherited={str(get(inhLg, "width"))}
            onChange={(v) => onChange(["lg", "width"], v)}
          />
        </Row>
      </Section>
    </>
  );
}

// ── ContainerTokens — xs/sm/md/lg/xl maxWidth ──────────────────────────────
const CONTAINER_SCALE_KEYS = ["xs", "sm", "md", "lg", "xl"] as const;
const DIALOG_SCALE_KEYS = ["sm", "md", "lg"] as const;

function MaxWidthScaleView({
  data,
  inherited,
  onChange,
  keys,
}: ShapeEditorProps & { keys: readonly string[] }) {
  const t = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  return (
    <Section title="Max Width">
      {keys.map((k) => {
        const entry = getObj(t, k);
        const inhEntry = getObj(inh, k);
        return (
          <Row key={k} label={k}>
            <TextField
              value={str(get(entry, "maxWidth"))}
              inherited={str(get(inhEntry, "maxWidth"))}
              onChange={(v) => onChange([k, "maxWidth"], v)}
            />
          </Row>
        );
      })}
    </Section>
  );
}

export function ContainerScaleShapeView(props: ShapeEditorProps) {
  return <MaxWidthScaleView {...props} keys={CONTAINER_SCALE_KEYS} />;
}

// ── DialogScaleTokens — sm/md/lg maxWidth ──────────────────────────────────
export function DialogScaleShapeView(props: ShapeEditorProps) {
  return <MaxWidthScaleView {...props} keys={DIALOG_SCALE_KEYS} />;
}

// ── SheetScaleTokens — sm/md/lg/full size ──────────────────────────────────
export function SheetScaleShapeView({ data, inherited, onChange }: ShapeEditorProps) {
  const t = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const keys = ["sm", "md", "lg", "full"] as const;

  return (
    <Section title="Size">
      {keys.map((key) => {
        const o = getObj(t, key);
        const inhO = getObj(inh, key);
        return (
          <Row key={key} label={key}>
            <TextField
              value={str(get(o, "size"))}
              inherited={str(get(inhO, "size"))}
              onChange={(v) => onChange([key, "size"], v)}
            />
          </Row>
        );
      })}
    </Section>
  );
}

// ── { scrollbar: ScrollbarTokens } ─────────────────────────────────────────
export function ScrollAreaShapeView({ data, inherited, onChange }: ShapeEditorProps) {
  const t = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const sb = getObj(t, "scrollbar");
  const inhSb = getObj(inh, "scrollbar");

  return (
    <Section title="Scrollbar">
      <Row label="thumb">
        <ColorField
          mode="token"
          value={str(get(sb, "thumbColor"))}
          inherited={str(get(inhSb, "thumbColor"))}
          onChange={(v) => onChange(["scrollbar", "thumbColor"], v)}
        />
      </Row>
      <Row label="track">
        <ColorField
          mode="token"
          value={str(get(sb, "trackColor"))}
          inherited={str(get(inhSb, "trackColor"))}
          onChange={(v) => onChange(["scrollbar", "trackColor"], v)}
        />
      </Row>
      <Row label="width">
        <TextField
          value={str(get(sb, "width"))}
          inherited={str(get(inhSb, "width"))}
          onChange={(v) => onChange(["scrollbar", "width"], v)}
          placeholder="6px"
        />
      </Row>
    </Section>
  );
}
