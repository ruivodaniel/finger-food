import { useState } from "react";
import { SurfaceEditor } from "./SurfaceEditor";
import { OverrideMetaSection } from "./OverrideMetaSection";
import {
  OverrideAxisSelector,
  whereEqual,
  whereIsEmpty,
  type CombinedWhere,
  type CombinedEntryShape,
} from "./OverrideAxisSelector";
import type { ShapeEditorProps } from "../../_core/shape-system/ShapeId";
import type { OnChange } from "../../_core/types";

type Rec = Record<string, unknown>;

/**
 * Editor for the `surfaceContainer` shape.
 *
 * Selection is a `CombinedWhere` clause built from three independent rows
 * (Emphasis / State / Status). When the where is empty we edit the root
 * surface tokens. When non-empty we read the matching `combined[i]` entry —
 * if it exists, scope to its `partialSurface`; otherwise present an empty
 * editor and lazily materialize the entry on the first write.
 */
export function SurfaceShapeView({
  data,
  inherited,
  onChange,
  effectKeys,
}: ShapeEditorProps) {
  const [selectedWhere, setSelectedWhere] = useState<CombinedWhere>({});

  const tokens = (data ?? {}) as Rec;
  const inh = (inherited as Rec | undefined) ?? undefined;

  const tokCombined = (tokens.combined as CombinedEntryShape[] | undefined) ?? [];
  const inhCombined = (inh?.combined as CombinedEntryShape[] | undefined) ?? [];

  const isOverride = !whereIsEmpty(selectedWhere);

  const tokIdx = isOverride
    ? tokCombined.findIndex((e) => whereEqual(e.where, selectedWhere))
    : -1;
  const tokEntry = tokIdx >= 0 ? tokCombined[tokIdx] : null;
  const inhEntry = isOverride
    ? inhCombined.find((e) => whereEqual(e.where, selectedWhere)) ?? null
    : null;

  // Existing wheres (across tokens + inherited) — feeds dot indicators.
  const existingWheres: CombinedWhere[] = [];
  for (const e of [...tokCombined, ...inhCombined]) {
    if (!existingWheres.some((w) => whereEqual(w, e.where))) {
      existingWheres.push(e.where);
    }
  }

  const bodyData: Rec = isOverride
    ? ((tokEntry?.partialSurface ?? {}) as Rec)
    : tokens;
  const bodyInherited: Rec | undefined = isOverride
    ? (inhEntry?.partialSurface as Rec | undefined)
    : inh;

  // Materialize-then-write: when no entry exists yet for the active where,
  // append a seed first so the index path is stable.
  const writeWithMaterialize = (suffix: string[], value: unknown) => {
    const idx = tokIdx >= 0 ? tokIdx : tokCombined.length;
    if (tokIdx < 0) {
      const seed: CombinedEntryShape = { where: selectedWhere, partialSurface: {} };
      onChange(["combined"], [...tokCombined, seed]);
    }
    onChange(["combined", String(idx), ...suffix], value);
  };

  const surfaceOnChange: OnChange = (path, value) => {
    if (!isOverride) {
      onChange(path, value);
      return;
    }
    writeWithMaterialize(["partialSurface", ...path], value);
  };

  const metaOnChange: OnChange = (path, value) => {
    if (!isOverride) return;
    writeWithMaterialize(path, value);
  };

  const handleRemove = () => {
    if (tokIdx < 0) return;
    const next = tokCombined.filter((_, i) => i !== tokIdx);
    onChange(["combined"], next);
    setSelectedWhere({});
  };

  return (
    <div>
      <OverrideAxisSelector
        selectedWhere={selectedWhere}
        onSelect={setSelectedWhere}
        existingWheres={existingWheres}
        canRemove={tokIdx >= 0}
        onRemove={handleRemove}
      />
      <SurfaceEditor
        data={bodyData}
        inherited={bodyInherited}
        onChange={surfaceOnChange}
        effectKeys={effectKeys}
      />
      {isOverride && (
        <OverrideMetaSection
          data={(tokEntry ?? {}) as Rec}
          inherited={(inhEntry ?? undefined) as Rec | undefined}
          onChange={metaOnChange}
        />
      )}
    </div>
  );
}
