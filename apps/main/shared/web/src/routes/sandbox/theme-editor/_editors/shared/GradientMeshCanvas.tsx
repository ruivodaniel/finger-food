import { useRef, useState } from "react";
import type {
  GradientLayer,
  GradientStop,
} from "../../../../../../../../../../shared/libs/ui/types";
import { gradientCss } from "./gradientCss";
import { colorCssVar } from "./colorTaxonomy";

type Props = {
  layers: GradientLayer[];
  selectedIdx: number | null;
  onSelect: (idx: number | null) => void;
  onMovePoint: (idx: number, xPercent: number, yPercent: number) => void;
  onAddPoint: (xPercent: number, yPercent: number) => void;
};

/**
 * Mesher-style canvas — draggable color points over the live gradient stack.
 * Each radial layer with a parseable percentage position renders as one
 * draggable dot. Non-radial / non-percentage layers paint into the
 * background but are not interactive (edit them in stack view).
 *
 * Click on empty canvas → adds a new radial layer at that position.
 * Drag a dot → updates that layer's `position`.
 * Click a dot   → selects it (parent shows its color/size controls).
 *
 * THEME ISOLATION RULE: editor chrome — static palette only on the canvas
 * frame. The CANVAS BODY paints the actual gradient (that's the point).
 */
export function GradientMeshCanvas({
  layers,
  selectedIdx,
  onSelect,
  onMovePoint,
  onAddPoint,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  function cursorToPercent(e: { clientX: number; clientY: number }) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragging == null) return;
    const p = cursorToPercent(e);
    if (!p) return;
    onMovePoint(dragging, p.x, p.y);
  }

  function handlePointerUp() {
    setDragging(null);
  }

  function handleCanvasClick(e: React.MouseEvent) {
    // Only fire when the click target is the canvas itself, not a dot.
    if (e.target !== canvasRef.current) return;
    const p = cursorToPercent(e);
    if (!p) return;
    onAddPoint(p.x, p.y);
  }

  return (
    <div
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleCanvasClick}
      className="relative rounded border border-zinc-300 overflow-hidden cursor-crosshair select-none"
      style={{
        height: 160,
        background: gradientCss(layers.length === 1 ? layers[0] : layers),
      }}
    >
      {layers.map((layer, i) => {
        const point = pointOf(layer);
        if (!point) return null;
        const isSelected = selectedIdx === i;
        return (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragging(i);
              onSelect(i);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(i);
            }}
            title={`Layer ${i + 1}`}
            className={`absolute w-4 h-4 rounded-full border-2 shadow-md cursor-grab active:cursor-grabbing ${
              isSelected ? "border-white ring-2 ring-blue-500" : "border-white"
            }`}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: "translate(-50%, -50%)",
              background:
                layer.stops[0]?.color && layer.stops[0].color !== "transparent"
                  ? colorCssVar(layer.stops[0].color)
                  : "#888",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract a percentage-based draggable point from a layer.
 * Returns null when the layer isn't a radial or its position isn't a pair
 * of percentages (e.g. "center", "50% center", "20px 30px").
 */
export function pointOf(layer: GradientLayer): { x: number; y: number } | null {
  if (layer.type !== "radial") return null;
  const pos = layer.position;
  if (!pos) return null;
  const m = pos.trim().match(/^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

export function formatPoint(x: number, y: number): string {
  return `${round(x)}% ${round(y)}%`;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Extract the "size" of a mesh blob — the transparent stop's position %. */
export function blobSize(layer: GradientLayer): number | null {
  if (layer.type !== "radial") return null;
  const transp = layer.stops.find((s) => s.color === "transparent");
  if (!transp?.position) return null;
  const m = transp.position.match(/^(\d+(?:\.\d+)?)%$/);
  return m ? Number(m[1]) : null;
}

/** Rewrite a layer's transparent-stop position (creating one if missing). */
export function setBlobSize(layer: GradientLayer, size: number): GradientStop[] {
  if (layer.type !== "radial") return layer.stops;
  const next = layer.stops.slice();
  const idx = next.findIndex((s) => s.color === "transparent");
  const transpStop = { color: "transparent" as const, position: `${round(size)}%` };
  if (idx >= 0) next[idx] = transpStop;
  else next.push(transpStop);
  return next;
}
