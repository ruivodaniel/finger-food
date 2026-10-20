import { useState } from "react";
import type { TypographyLevel } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import {
  FONT_FAMILY_TOKEN_OPTS,
  FONT_STYLE_OPTS,
  FONT_WEIGHT_OPTS,
  TEXT_TRANSFORM_OPTS as _TEXT_TRANSFORM_OPTS,
} from "../../_core/constants";
import { Row } from "../shared/Row";
import { TokenDropdown } from "../shared/TokenDropdown";
import { NumberField } from "../shared/NumberField";
import { TextField } from "../shared/TextField";

type Props = {
  label: string;
  data: TypographyLevel;
  inherited?: TypographyLevel;
  onChange: OnChange;
};

export function TypographyLevelEditor({ label, data, inherited, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 text-[11px] hover:bg-white/5 transition-colors"
      >
        <span className="text-[9px]">{open ? "▾" : "▸"}</span>
        <span className="font-medium">{label}</span>
        <span className="ml-auto text-[10px] opacity-40">
          {data.fontSizeDesktop}px / {data.fontWeight}
        </span>
      </button>
      {open && (
        <div className="flex flex-col pl-2">
          <Row label="family">
            <TokenDropdown
              value={data.fontFamily}
              inherited={inherited?.fontFamily}
              onChange={(v) => onChange(["fontFamily"], v)}
              options={FONT_FAMILY_TOKEN_OPTS}
            />
          </Row>
          <Row label="sizeMob">
            <NumberField
              value={data.fontSizeMobile}
              inherited={inherited?.fontSizeMobile}
              onChange={(v) => onChange(["fontSizeMobile"], v)}
              min={8}
              max={120}
            />
          </Row>
          <Row label="sizeDesk">
            <NumberField
              value={data.fontSizeDesktop}
              inherited={inherited?.fontSizeDesktop}
              onChange={(v) => onChange(["fontSizeDesktop"], v)}
              min={8}
              max={120}
            />
          </Row>
          <Row label="weight">
            <TokenDropdown
              value={String(data.fontWeight)}
              inherited={inherited?.fontWeight != null ? String(inherited.fontWeight) : undefined}
              onChange={(v) => onChange(["fontWeight"], v ? Number(v) : undefined)}
              options={FONT_WEIGHT_OPTS}
            />
          </Row>
          <Row label="lineH">
            <NumberField
              value={data.lineHeight}
              inherited={inherited?.lineHeight}
              onChange={(v) => onChange(["lineHeight"], v)}
              step={0.05}
              min={0.5}
              max={3}
            />
          </Row>
          <Row label="letterSp">
            <TextField
              value={data.letterSpacing}
              inherited={inherited?.letterSpacing}
              onChange={(v) => onChange(["letterSpacing"], v)}
              placeholder="e.g. -0.02em"
            />
          </Row>
          <Row label="style">
            <TokenDropdown
              value={data.fontStyle}
              inherited={inherited?.fontStyle}
              onChange={(v) => onChange(["fontStyle"], v)}
              options={FONT_STYLE_OPTS}
            />
          </Row>
        </div>
      )}
    </div>
  );
}
