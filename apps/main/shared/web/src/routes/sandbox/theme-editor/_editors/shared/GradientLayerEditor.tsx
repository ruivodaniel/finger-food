import { useState } from "react";
import type {
  GradientDef,
  GradientLayer,
  GradientStop,
} from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "./_types";
import { ColorField } from "./ColorField";
import { TextField } from "./TextField";
import { NumberField } from "./NumberField";
import { SegmentedSelect } from "./SegmentedSelect";
import { Row } from "./Row";
import { gradientCss, gradientLayerCss } from "./gradientCss";
import {
  GradientMeshCanvas,
  blobSize,
  formatPoint,
  pointOf,
  setBlobSize,
} from "./GradientMeshCanvas";

type Props = {
  /** Gradient body. Omitted on first edit; defaults to a single linear layer. */
  data: GradientDef | undefined;
  onChange: OnChange;
};

const TYPE_OPTIONS = [
  { value: "linear", label: "linear" },
  { value: "radial", label: "radial" },
  { value: "conic", label: "conic" },
] as const;

const SHAPE_OPTIONS = [
  { value: "ellipse", label: "ellipse" },
  { value: "circle", label: "circle" },
] as const;

const VIEW_OPTIONS = [
  { value: "stack", label: "Stack" },
  { value: "canvas", label: "Canvas" },
] as const;

/**
 * Editor for a `GradientDef` — single-layer OR multi-layer stack.
 *
 * Normalizes to `GradientLayer[]` internally; emits a single object when
 * the stack collapses to one layer (keeps existing tidy themes tidy).
 *
 * Two views:
 *   Stack  — per-layer block list (works for any layer type)
 *   Canvas — Mesher-style: drag radial points around a live preview, click
 *            empty area to add a new radial. Non-radial / non-percentage
 *            layers still paint into the background but aren't draggable.
 */
export function GradientLayerEditor({ data, onChange }: Props) {
  const layers = toLayers(data);
  const [view, setView] = useState<"stack" | "canvas">("stack");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  function emit(next: GradientLayer[]): void {
    if (next.length === 0) {
      onChange([], defaultLayer());
      return;
    }
    if (next.length === 1) onChange([], next[0]);
    else onChange([], next);
  }

  function patchLayer(i: number, patch: Partial<GradientLayer>): void {
    const next = layers.map((l, idx) =>
      idx === i ? ({ ...l, ...patch } as GradientLayer) : l,
    );
    emit(next);
  }

  function replaceLayer(i: number, layer: GradientLayer): void {
    emit(layers.map((l, idx) => (idx === i ? layer : l)));
  }

  function addLayer(): void {
    const newLayer: GradientLayer =
      layers.length === 0
        ? defaultLayer()
        : { type: "radial", shape: "ellipse", position: "50% 50%", stops: [] };
    emit([...layers, newLayer]);
  }

  function removeLayer(i: number): void {
    if (selectedIdx === i) setSelectedIdx(null);
    emit(layers.filter((_, idx) => idx !== i));
  }

  function moveLayer(i: number, delta: -1 | 1): void {
    const j = i + delta;
    if (j < 0 || j >= layers.length) return;
    const next = layers.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    emit(next);
  }

  // ── Canvas-specific operations ──────────────────────────────────────────

  function handleMovePoint(idx: number, x: number, y: number) {
    patchLayer(idx, { position: formatPoint(x, y) } as Partial<GradientLayer>);
  }

  function handleAddPointAt(x: number, y: number) {
    const newLayer: GradientLayer = {
      type: "radial",
      shape: "ellipse",
      position: formatPoint(x, y),
      stops: [
        { color: "primary" },
        { color: "transparent", position: "50%" },
      ],
    };
    emit([...layers, newLayer]);
    setSelectedIdx(layers.length); // newly appended index
  }

  return (
    <div className="space-y-2">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          {layers.length} {layers.length === 1 ? "layer" : "layers"}
        </span>
        <SegmentedSelect
          value={view}
          onChange={(v) => v && setView(v as "stack" | "canvas")}
          options={VIEW_OPTIONS}
        />
      </div>

      {view === "stack" ? (
        <StackView
          layers={layers}
          onChangeType={(i, t) => replaceLayer(i, changeType(layers[i]!, t))}
          onPatchLayer={patchLayer}
          onAddLayer={addLayer}
          onRemoveLayer={removeLayer}
          onMoveLayer={moveLayer}
        />
      ) : (
        <CanvasView
          layers={layers}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          onMovePoint={handleMovePoint}
          onAddPoint={handleAddPointAt}
          onPatchLayer={patchLayer}
          onRemoveLayer={removeLayer}
          onAddLayer={addLayer}
        />
      )}
    </div>
  );
}

// ── Stack view ─────────────────────────────────────────────────────────────

function StackView({
  layers,
  onChangeType,
  onPatchLayer,
  onAddLayer,
  onRemoveLayer,
  onMoveLayer,
}: {
  layers: GradientLayer[];
  onChangeType: (i: number, next: string) => void;
  onPatchLayer: (i: number, patch: Partial<GradientLayer>) => void;
  onAddLayer: () => void;
  onRemoveLayer: (i: number) => void;
  onMoveLayer: (i: number, d: -1 | 1) => void;
}) {
  return (
    <>
      <div
        className="h-10 rounded border border-zinc-200"
        style={{ background: gradientCss(layers.length === 1 ? layers[0] : layers) }}
      />

      <div className="space-y-1.5">
        {layers.map((layer, i) => (
          <LayerBlock
            key={i}
            index={i}
            layer={layer}
            total={layers.length}
            onChangeType={(t) => onChangeType(i, t)}
            onPatch={(p) => onPatchLayer(i, p)}
            onMove={(d) => onMoveLayer(i, d)}
            onRemove={() => onRemoveLayer(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddLayer}
        className="w-full text-[11px] py-1 rounded border border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-500 hover:bg-zinc-50"
      >
        + Layer
      </button>
    </>
  );
}

// ── Canvas view ────────────────────────────────────────────────────────────

function CanvasView({
  layers,
  selectedIdx,
  onSelect,
  onMovePoint,
  onAddPoint,
  onPatchLayer,
  onRemoveLayer,
  onAddLayer,
}: {
  layers: GradientLayer[];
  selectedIdx: number | null;
  onSelect: (i: number | null) => void;
  onMovePoint: (i: number, x: number, y: number) => void;
  onAddPoint: (x: number, y: number) => void;
  onPatchLayer: (i: number, patch: Partial<GradientLayer>) => void;
  onRemoveLayer: (i: number) => void;
  onAddLayer: () => void;
}) {
  const selected = selectedIdx != null ? layers[selectedIdx] : null;
  const pointCount = layers.filter((l) => pointOf(l)).length;

  return (
    <>
      <GradientMeshCanvas
        layers={layers}
        selectedIdx={selectedIdx}
        onSelect={onSelect}
        onMovePoint={onMovePoint}
        onAddPoint={onAddPoint}
      />

      <div className="text-[10px] text-zinc-400">
        {pointCount === 0
          ? "Click anywhere on the canvas to add a color point."
          : "Click empty area to add a point · drag to move · click a point to edit."}
      </div>

      {selected && pointOf(selected) && (
        <SelectedPointControls
          layer={selected}
          onPatch={(p) => onPatchLayer(selectedIdx!, p)}
          onRemove={() => onRemoveLayer(selectedIdx!)}
        />
      )}

      <button
        type="button"
        onClick={onAddLayer}
        className="w-full text-[11px] py-1 rounded border border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-500 hover:bg-zinc-50"
      >
        + Layer (other than mesh point)
      </button>
    </>
  );
}

function SelectedPointControls({
  layer,
  onPatch,
  onRemove,
}: {
  layer: GradientLayer;
  onPatch: (patch: Partial<GradientLayer>) => void;
  onRemove: () => void;
}) {
  if (layer.type !== "radial") return null;
  const size = blobSize(layer);
  const colorStop = layer.stops.find((s) => s.color !== "transparent");
  return (
    <div className="border border-zinc-200 rounded p-2 space-y-1.5 bg-zinc-50">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          Selected point
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-zinc-400 hover:text-red-600 text-[11px]"
          title="Remove point"
        >
          × remove
        </button>
      </div>
      <Row label="Color">
        <ColorField
          mode="token"
          value={colorStop?.color === "transparent" ? "" : (colorStop?.color ?? "")}
          onChange={(v) => {
            const nextStops = layer.stops.slice();
            const idx = nextStops.findIndex((s) => s.color !== "transparent");
            const newStop: GradientStop = { color: (v as string) || "" };
            if (idx >= 0) nextStops[idx] = newStop;
            else nextStops.unshift(newStop);
            onPatch({ stops: nextStops } as Partial<GradientLayer>);
          }}
        />
      </Row>
      <Row label="Size">
        <NumberField
          value={size ?? 50}
          onChange={(v) => {
            const nextStops = setBlobSize(layer, v ?? 50);
            onPatch({ stops: nextStops } as Partial<GradientLayer>);
          }}
          min={0}
          max={100}
          step={1}
        />
      </Row>
    </div>
  );
}

// ── Layer block (used in Stack view) ───────────────────────────────────────

function LayerBlock({
  index,
  layer,
  total,
  onChangeType,
  onPatch,
  onMove,
  onRemove,
}: {
  index: number;
  layer: GradientLayer;
  total: number;
  onChangeType: (next: string) => void;
  onPatch: (patch: Partial<GradientLayer>) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-zinc-200 rounded p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <span
          className="w-10 h-5 rounded-sm border border-zinc-200 shrink-0"
          style={{ background: gradientLayerCss(layer) }}
        />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 flex-1">
          Layer {index + 1} · {layer.type}
        </span>
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="text-zinc-400 hover:text-zinc-700 disabled:opacity-25 disabled:cursor-default text-[11px] px-1"
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="text-zinc-400 hover:text-zinc-700 disabled:opacity-25 disabled:cursor-default text-[11px] px-1"
          title="Move down"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-zinc-400 hover:text-red-600 text-[12px] leading-none px-1"
          title="Remove layer"
        >
          ×
        </button>
      </div>

      <Row label="Type">
        <SegmentedSelect
          value={layer.type}
          onChange={(v) => v && onChangeType(v)}
          options={TYPE_OPTIONS}
        />
      </Row>

      {layer.type === "linear" && (
        <Row label="Angle">
          <NumberField
            value={typeof layer.angle === "number" ? layer.angle : Number(layer.angle) || 0}
            onChange={(v) => onPatch({ angle: v ?? 0 })}
            step={1}
          />
        </Row>
      )}

      {layer.type === "radial" && (
        <>
          <Row label="Shape">
            <SegmentedSelect
              value={layer.shape ?? "ellipse"}
              onChange={(v) => onPatch({ shape: (v ?? "ellipse") as "ellipse" | "circle" })}
              options={SHAPE_OPTIONS}
            />
          </Row>
          <Row label="Position">
            <TextField
              value={layer.position ?? ""}
              onChange={(v) => onPatch({ position: ((v as string) || undefined) })}
              placeholder="50% 50%"
            />
          </Row>
        </>
      )}

      {layer.type === "conic" && (
        <>
          <Row label="Angle">
            <NumberField
              value={layer.angle ?? 0}
              onChange={(v) => onPatch({ angle: v ?? 0 })}
              step={1}
            />
          </Row>
          <Row label="Position">
            <TextField
              value={layer.position ?? ""}
              onChange={(v) => onPatch({ position: ((v as string) || undefined) })}
              placeholder="center"
            />
          </Row>
        </>
      )}

      <StopsList
        stops={layer.stops}
        onChange={(stops) => onPatch({ stops } as Partial<GradientLayer>)}
      />
    </div>
  );
}

function StopsList({
  stops,
  onChange,
}: {
  stops: GradientStop[];
  onChange: (stops: GradientStop[]) => void;
}) {
  const setStop = (i: number, patch: Partial<GradientStop>) => {
    onChange(stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addStop = () => onChange([...stops, { color: "" } as GradientStop]);
  const removeStop = (i: number) => onChange(stops.filter((_, idx) => idx !== i));
  const addTransparentStop = () =>
    onChange([...stops, { color: "transparent" as const, position: "100%" }]);

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          Stops
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={addTransparentStop}
            className="text-[9px] text-zinc-400 hover:text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 hover:border-zinc-300"
            title="Add transparent stop"
          >
            + transparent
          </button>
          <button
            type="button"
            onClick={addStop}
            className="text-zinc-400 hover:text-zinc-700 text-[12px] leading-none px-1"
            title="Add stop"
          >
            ＋
          </button>
        </div>
      </div>
      {stops.length === 0 ? (
        <div className="text-[10px] text-zinc-400 italic px-1 py-1">
          (no stops yet)
        </div>
      ) : (
        <div className="space-y-1">
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <ColorField
                mode="token"
                value={s.color}
                onChange={(v) => setStop(i, { color: (v as string) ?? "" })}
              />
              <input
                type="text"
                value={s.position ?? ""}
                placeholder="pos"
                onChange={(e) =>
                  setStop(i, { position: e.target.value || undefined })
                }
                className="w-14 shrink-0 px-1.5 h-[22px] text-[11px] rounded border border-zinc-200 bg-white"
              />
              <button
                type="button"
                onClick={() => removeStop(i)}
                className="shrink-0 text-zinc-400 hover:text-red-600 text-[12px] leading-none px-1"
                title="Remove stop"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function defaultLayer(): GradientLayer {
  return { type: "linear", angle: 0, stops: [] };
}

function toLayers(data: GradientDef | undefined): GradientLayer[] {
  if (!data) return [defaultLayer()];
  if (Array.isArray(data)) return data.length > 0 ? data : [defaultLayer()];
  return [data];
}

function changeType(prev: GradientLayer, next: string): GradientLayer {
  if (next === prev.type) return prev;
  const stops = prev.stops;
  if (next === "linear") return { type: "linear", angle: 0, stops };
  if (next === "radial")
    return { type: "radial", shape: "ellipse", position: "50% 50%", stops };
  return { type: "conic", stops };
}
