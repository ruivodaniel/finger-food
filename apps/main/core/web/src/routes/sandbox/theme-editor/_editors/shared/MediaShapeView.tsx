import { AccordionSection, useMultiExpand } from "./AccordionSection";
import { SurfaceShapeView } from "./SurfaceShapeView";
import { Section } from "./Section";
import { Row } from "./Row";
import { ColorField } from "./ColorField";
import { NumberField } from "./NumberField";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import { get, getObj, num, str } from "./_types";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";

type Rec = Record<string, unknown>;

const OBJECT_FIT_OPTS = ["cover", "contain", "fill", "none", "scale-down"] as const;

/**
 * Editor for `MediaTokens`:
 *   { surface, objectFit, aspectRatio, overlay, filter }.
 *
 * One surface accordion + a flat "Other Properties" section for the
 * media-specific configuration.
 */
export function MediaShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;
  const ax = useMultiExpand({ surface: true });

  const overlay = getObj(tokens, "overlay");
  const inhOverlay = getObj(inh, "overlay");
  const filter = getObj(tokens, "filter");
  const inhFilter = getObj(inh, "filter");

  return (
    <>
      <AccordionSection
        title="Surface"
        glyph="⊞"
        expanded={ax.isOpen("surface")}
        onToggle={() => ax.toggle("surface")}
      >
        <SurfaceShapeView
          data={(tokens.surface ?? {}) as Rec}
          inherited={(inh?.surface as Rec | undefined) ?? undefined}
          onChange={(p, v) => onChange(["surface", ...p], v)}
          effectKeys={effectKeys}
        />
      </AccordionSection>

      <Section title="Other Properties">
        <Row label="object fit">
          <SelectField
            value={str(get(tokens, "objectFit"))}
            inherited={str(get(inh, "objectFit"))}
            onChange={(v) => onChange(["objectFit"], v)}
            options={OBJECT_FIT_OPTS}
          />
        </Row>
        <Row label="object pos">
          <TextField
            value={str(get(tokens, "objectPosition"))}
            inherited={str(get(inh, "objectPosition"))}
            onChange={(v) => onChange(["objectPosition"], v)}
            placeholder="50% 50%"
          />
        </Row>
        <Row label="aspect">
          <TextField
            value={str(get(tokens, "aspectRatio"))}
            inherited={str(get(inh, "aspectRatio"))}
            onChange={(v) => onChange(["aspectRatio"], v)}
            placeholder="16/9"
          />
        </Row>
      </Section>

      <Section title="Overlay">
        <Row label="color">
          <ColorField
            mode="token"
            value={str(get(overlay, "color"))}
            inherited={str(get(inhOverlay, "color"))}
            onChange={(v) => onChange(["overlay", "color"], v)}
          />
        </Row>
        <Row label="opacity">
          <NumberField
            value={num(get(overlay, "opacity"))}
            inherited={num(get(inhOverlay, "opacity"))}
            onChange={(v) => onChange(["overlay", "opacity"], v)}
            step={0.05}
            min={0}
            max={1}
          />
        </Row>
        <Row label="blur">
          <TextField
            value={str(get(overlay, "blur"))}
            inherited={str(get(inhOverlay, "blur"))}
            onChange={(v) => onChange(["overlay", "blur"], v)}
            placeholder="0px"
          />
        </Row>
      </Section>

      <Section title="Filter">
        <Row label="grayscale">
          <NumberField
            value={num(get(filter, "grayscale"))}
            inherited={num(get(inhFilter, "grayscale"))}
            onChange={(v) => onChange(["filter", "grayscale"], v)}
            step={0.05}
            min={0}
            max={1}
          />
        </Row>
        <Row label="brightness">
          <NumberField
            value={num(get(filter, "brightness"))}
            inherited={num(get(inhFilter, "brightness"))}
            onChange={(v) => onChange(["filter", "brightness"], v)}
            step={0.05}
            min={0}
          />
        </Row>
        <Row label="contrast">
          <NumberField
            value={num(get(filter, "contrast"))}
            inherited={num(get(inhFilter, "contrast"))}
            onChange={(v) => onChange(["filter", "contrast"], v)}
            step={0.05}
            min={0}
          />
        </Row>
        <Row label="blur">
          <TextField
            value={str(get(filter, "blur"))}
            inherited={str(get(inhFilter, "blur"))}
            onChange={(v) => onChange(["filter", "blur"], v)}
            placeholder="0px"
          />
        </Row>
      </Section>
    </>
  );
}
