import { useState } from "react";
import { ColorField } from "./ColorField";
import { NumberField } from "./NumberField";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import type { OnChange, RenderColorFn } from "./_types";
import { num, str } from "./_types";

const EFFECT_TYPES = [
  "drop-shadow",
  "inner-shadow",
  "backdrop-blur",
  "layer-blur",
  "noise",
  "glass",
] as const;

type EffectType = (typeof EFFECT_TYPES)[number];

const TYPE_LABELS: Record<EffectType, string> = {
  "drop-shadow": "Drop Shadow",
  "inner-shadow": "Inner Shadow",
  "backdrop-blur": "Backdrop Blur",
  "layer-blur": "Layer Blur",
  noise: "Noise",
  glass: "Glass",
};

const NEW_LAYER: Record<string, unknown> = {
  type: "drop-shadow",
  x: 0,
  y: 2,
  blur: 4,
  color: "main-black",
  opacity: 0.12,
};

type Props = {
  layers: unknown[];
  path: string[];
  onChange: OnChange;
  renderColor?: RenderColorFn;
};

/**
 * Edits an EffectLayer[] stack. Layers are collapsible cards.
 * Each layer's type drives which sub-fields render.
 *
 * Emits the whole array via onChange(path, newArr) — caller stores at `path`.
 */
export function ShadowLayerEditor({ layers, path, onChange, renderColor }: Props) {
  const arr = (layers ?? []) as Record<string, unknown>[];

  const updateLayer = (i: number, next: Record<string, unknown>) => {
    const copy = [...arr];
    copy[i] = next;
    onChange(path, copy);
  };
  const removeLayer = (i: number) => {
    onChange(path, arr.filter((_, idx) => idx !== i));
  };
  const addLayer = () => onChange(path, [...arr, { ...NEW_LAYER }]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500">{arr.length} layer{arr.length === 1 ? "" : "s"}</span>
        <button
          type="button"
          onClick={addLayer}
          className="text-[10px] text-blue-500 hover:text-blue-700 px-1 py-0.5 rounded hover:bg-zinc-100"
        >
          + add layer
        </button>
      </div>
      {arr.map((layer, i) => (
        <LayerCard
          key={i}
          index={i}
          layer={layer}
          onUpdate={(next) => updateLayer(i, next)}
          onRemove={() => removeLayer(i)}
          renderColor={renderColor}
        />
      ))}
    </div>
  );
}

function LayerCard({
  index,
  layer,
  onUpdate,
  onRemove,
  renderColor,
}: {
  index: number;
  layer: Record<string, unknown>;
  onUpdate: (next: Record<string, unknown>) => void;
  onRemove: () => void;
  renderColor?: RenderColorFn;
}) {
  const [open, setOpen] = useState(false);
  const t = (layer.type as EffectType) ?? "drop-shadow";
  const set = (k: string, v: unknown) => onUpdate({ ...layer, [k]: v });

  return (
    <div className="border border-zinc-200 rounded bg-white">
      <div
        className="flex items-center gap-1 px-1.5 h-6 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-[9px] text-zinc-400 w-3 shrink-0 text-center">
          {index + 1}
        </span>
        <span className="text-[10px] flex-1 truncate">{TYPE_LABELS[t] ?? t}</span>
        <button
          type="button"
          className="text-[10px] text-red-400 hover:text-red-600 px-1"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
        <span className="text-[9px] text-zinc-500">{open ? "▾" : "▸"}</span>
      </div>
      {open && (
        <div className="px-2 py-1.5 space-y-1 border-t border-zinc-100">
          <SmallRow label="type">
            <SelectField
              value={t}
              onChange={(v) => onUpdate({ type: v ?? "drop-shadow" })}
              options={EFFECT_TYPES}
            />
          </SmallRow>

          {(t === "drop-shadow" || t === "inner-shadow") && (
            <>
              <SmallRow label="x">
                <NumberField value={num(layer.x)} onChange={(v) => set("x", v)} step={1} />
              </SmallRow>
              <SmallRow label="y">
                <NumberField value={num(layer.y)} onChange={(v) => set("y", v)} step={1} />
              </SmallRow>
              <SmallRow label="blur">
                <NumberField value={num(layer.blur)} onChange={(v) => set("blur", v)} step={1} />
              </SmallRow>
              <SmallRow label="spread">
                <NumberField value={num(layer.spread)} onChange={(v) => set("spread", v)} step={1} />
              </SmallRow>
              <SmallRow label="color">
                {renderColor ? (
                  renderColor({
                    value: layer.color,
                    inherited: undefined,
                    onChange: (v) => set("color", v),
                  })
                ) : (
                  <ColorField
                    mode="hex-or-token"
                    value={str(layer.color)}
                    onChange={(v) => set("color", v)}
                  />
                )}
              </SmallRow>
              <SmallRow label="opacity">
                <NumberField
                  value={num(layer.opacity)}
                  onChange={(v) => set("opacity", v)}
                  step={0.05}
                  min={0}
                  max={1}
                />
              </SmallRow>
            </>
          )}

          {t === "backdrop-blur" && (
            <>
              <SmallRow label="blur"><TextField value={str(layer.blur)} onChange={(v) => set("blur", v)} /></SmallRow>
              <SmallRow label="saturation"><TextField value={str(layer.saturation)} onChange={(v) => set("saturation", v)} /></SmallRow>
              <SmallRow label="brightness"><TextField value={str(layer.brightness)} onChange={(v) => set("brightness", v)} /></SmallRow>
              <SmallRow label="contrast"><TextField value={str(layer.contrast)} onChange={(v) => set("contrast", v)} /></SmallRow>
            </>
          )}

          {t === "layer-blur" && (
            <SmallRow label="blur"><TextField value={str(layer.blur)} onChange={(v) => set("blur", v)} /></SmallRow>
          )}

          {t === "noise" && (
            <>
              <SmallRow label="opacity"><NumberField value={num(layer.opacity)} onChange={(v) => set("opacity", v)} step={0.05} min={0} max={1} /></SmallRow>
              <SmallRow label="density"><NumberField value={num(layer.density)} onChange={(v) => set("density", v)} step={0.1} /></SmallRow>
              <SmallRow label="blend"><TextField value={str(layer.blend)} onChange={(v) => set("blend", v)} /></SmallRow>
            </>
          )}

          {t === "glass" && (
            <>
              <SmallRow label="blur"><TextField value={str(layer.blur)} onChange={(v) => set("blur", v)} /></SmallRow>
              <SmallRow label="saturation"><TextField value={str(layer.saturation)} onChange={(v) => set("saturation", v)} /></SmallRow>
              <SmallRow label="tint">
                {renderColor ? (
                  renderColor({
                    value: layer.tint,
                    inherited: undefined,
                    onChange: (v) => set("tint", v),
                  })
                ) : (
                  <ColorField mode="token" value={str(layer.tint)} onChange={(v) => set("tint", v)} />
                )}
              </SmallRow>
              <SmallRow label="tintOpacity">
                <NumberField value={num(layer.tintOpacity)} onChange={(v) => set("tintOpacity", v)} step={0.05} min={0} max={1} />
              </SmallRow>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SmallRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 h-[22px]">
      <label className="text-[10px] text-zinc-500 w-16 shrink-0">{label}</label>
      <div className="flex-1 min-w-0 flex items-center gap-1">{children}</div>
    </div>
  );
}
