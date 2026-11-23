import { useState } from "react";
import { Stack } from "@libs/web-layouts";
import { PickerMenu } from "./picker-menu";
import { HexColorPicker } from "./hex-color-picker";
import type { PaletteColor, StrokeValue } from "./types";

const SYSTEM: PaletteColor[] = [
  { value: "#4a2d8f", name: "primary" }, { value: "#7aa2f7", name: "secondary" },
  { value: "#f7c56a", name: "accent" },  { value: "#8fd36a", name: "lime" }, { value: "#f7768e", name: "rose" },
];
const INITIAL_USER: PaletteColor[] = [ { value: "#ffd166", name: "sun" }, { value: "#06d6a0", name: "mint" } ];

export default function ColorPickerV2Fixture() {
  // one state per instance — never shared
  const [a, setA] = useState<string | null>("#4a2d8f");
  const [b, setB] = useState<string | null>("#4a2d8f");
  const [c, setC] = useState<string | null>("#4a2d8f");
  const [d, setD] = useState<string | null>("#4a2d8f");
  const [many, setMany] = useState<string[]>(["#4a2d8f", "#f7c56a"]);
  const [strokeLine, setStrokeLine] = useState<StrokeValue>({ color: "#4a2d8f", pattern: "solid", width: 2 });
  const [strokeShape, setStrokeShape] = useState<StrokeValue>({ color: "#4a2d8f", pattern: "dashed", width: 3 });
  const [hex, setHex] = useState<string | null>("#4a2d8f");

  // shared user section — each instance that uses it can add; functional setState keeps the pending-add iteration atomic
  const [user, setUser] = useState<PaletteColor[]>(INITIAL_USER);
  const userSection = {
    id: "user", label: "my colours", colors: user, addable: true,
    onAdd: (h: string) => setUser((u) => (u.some((x) => x.value.toLowerCase() === h.toLowerCase()) ? u : [...u, { value: h }])),
    onRemove: (h: string) => setUser((u) => u.filter((x) => x.value.toLowerCase() !== h.toLowerCase())),
  };
  const brandSection = { id: "brand", label: "brand", colors: SYSTEM };
  // same list but with the "No color" slot switched on; given to the three instances that need it
  const brandSectionT = { ...brandSection, allowTransparent: true };

  return (
    <Stack dir="col" scale="xl">
      <Stack dir="col" scale="md">
        <span style={{ fontSize: 13, fontWeight: 600 }}>PickerMenu — trigger: text "name-or-hex"</span>
        <Stack dir="row" scale="xl" align="center" wrap>
          <PickerMenu trigger={{ text: "name-or-hex" }} sections={[brandSectionT, userSection]} opacity value={a} onChange={(v) => setA(v as string | null)} />
          <PickerMenu trigger={{ text: "hex" }} sections={[brandSection, userSection]} value={b} onChange={(v) => setB(v as string | null)} />
        </Stack>
      </Stack>

      <Stack dir="col" scale="md">
        <span style={{ fontSize: 13, fontWeight: 600 }}>PickerMenu — trigger: icon-only (text: "none")</span>
        <Stack dir="row" scale="xl" align="center">
          <PickerMenu trigger={{ icon: "text" }} sections={[brandSectionT, userSection]} value={c} onChange={(v) => setC(v as string | null)} />
          <PickerMenu trigger={{ icon: "rectangle" }} sections={[brandSection, userSection]} value={d} onChange={(v) => setD(v as string | null)} />
        </Stack>
      </Stack>

      <Stack dir="col" scale="md">
        <span style={{ fontSize: 13, fontWeight: 600 }}>PickerMenu — stroke section on (pattern + thickness)</span>
        <Stack dir="row" scale="xl" align="center">
          <PickerMenu trigger={{ icon: "remove" }} stroke sections={[brandSectionT, userSection]} widths={[0, 16]} value={strokeLine} onChange={(v) => setStrokeLine(v as StrokeValue)} />
          <PickerMenu trigger={{ icon: "rectangle" }} stroke sections={[brandSection, userSection]} widths={[0, 16]} value={strokeShape} onChange={(v) => setStrokeShape(v as StrokeValue)} />
        </Stack>
      </Stack>

      <Stack dir="col" scale="md">
        <span style={{ fontSize: 13, fontWeight: 600 }}>PickerMenu — multiple (max 4)</span>
        <Stack dir="row" scale="xl" align="center">
          <PickerMenu trigger={{ text: "name-or-hex" }} multiple max={4} opacity sections={[brandSection, userSection]} value={many} onChange={(v) => setMany(v as string[])} />
        </Stack>
      </Stack>

      <Stack dir="col" scale="md">
        <span style={{ fontSize: 13, fontWeight: 600 }}>HexColorPicker — standalone popover</span>
        <HexColorPicker value={hex} onCommit={setHex}>
          <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded border border-gray-300 px-2 py-1">
            <span className="size-4 rounded-sm" style={{ background: hex ?? "transparent", border: "1px solid rgba(0,0,0,.1)" }} />
            <span className="text-sm">{hex ?? "pick"}</span>
          </button>
        </HexColorPicker>
      </Stack>
    </Stack>
  );
}
