import * as React from "react";
import { DayPicker, type DateRange, type DayButtonProps } from "react-day-picker";

import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { Icon } from "../../icons";
import type { DatePickerProps } from "./types";

// =============================================================================
// Component
// =============================================================================

// =============================================================================
// Helpers
// =============================================================================

const defaultSingleFormat = (d: Date) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);

const defaultRangeFormat = (r: DateRange | undefined) => {
  if (!r?.from) return "";
  const f = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
  return r.to ? `${f.format(r.from)} – ${f.format(r.to)}` : f.format(r.from);
};

// Each day is its own control; react-day-picker exposes it only through a custom DayButton.
function CalendarDayButton({  day, modifiers, ...props }: DayButtonProps) {
  void day;
  const state = modifiers.disabled ? "disabled"
    : modifiers.selected || modifiers.range_start || modifiers.range_end || modifiers.range_middle ? "selected"
    : modifiers.focused ? "focus"
    : undefined;
  return <button element="control--calendar-day" {...axisAttrs({ state })} {...props} className={cn("inline-flex size-9 items-center justify-center", props.className)} />;
}

// v2: react-day-picker's own navigation buttons carry no element; these wear the library's quiet button, and the
// classNames below lay the navigation beside the month caption (the library's stylesheet is not loaded).
type NavButtonProps = React.ComponentProps<"button">;
const PreviousMonthButton = ({ className, ...props }: NavButtonProps) => (
  <button type="button" element="control--button" emphasis="quiet" scale="sm" {...props} className={cn("inline-flex items-center justify-center", className)}><Icon name="chevronLeft" scale="sm" /></button>
);
const NextMonthButton = ({ className, ...props }: NavButtonProps) => (
  <button type="button" element="control--button" emphasis="quiet" scale="sm" {...props} className={cn("inline-flex items-center justify-center", className)}><Icon name="chevronRight" scale="sm" /></button>
);
const CALENDAR_CLASSES = {
  root: "relative",
  months: "relative flex flex-col",
  month: "flex flex-col gap-2",
  month_caption: "flex h-9 items-center pl-1 pr-20",
  caption_label: "text-sm font-medium",
  nav: "absolute right-0 top-0 flex h-9 items-center gap-1",
  month_grid: "w-full border-collapse",
  weekdays: "flex mb-2",
  weekday: "flex-1 text-center text-xs font-normal opacity-60",
  week: "flex",
  day: "flex-1 p-0 text-center",
  outside: "opacity-40",
  disabled: "opacity-40",
};

function DatePicker(props: DatePickerProps) {
  const {
    position,
    mode = "single",
    value,
    defaultValue,
    onChange,
    placeholder = "Pick a date",
    disabled,
    fromDate,
    toDate,
    disabledDates,
    formatDate = defaultSingleFormat,
    formatRange = defaultRangeFormat,
    emphasis,
    status,
    state,
    scale = "md",
    concept,
    className,
  } = props as DatePickerProps & {
    // Discriminated union indexed access — narrow through the generic BaseProps.
    defaultValue?: Date | DateRange | null;
    value?: Date | DateRange | null;
    onChange?: (v: Date | DateRange | null) => void;
  };

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<Date | DateRange | null>(
    (defaultValue ?? null) as Date | DateRange | null,
  );
  const current = isControlled ? (value as Date | DateRange | null) : internal;

  const [open, setOpen] = React.useState(false);

  const commit = (next: Date | DateRange | null) => {
    if (!isControlled) setInternal(next);
    onChange?.(next as never);
  };

  const label =
    current == null
      ? placeholder
      : mode === "range"
        ? formatRange(current as DateRange)
        : formatDate(current as Date);

  const themeAttrs: Record<string, string | undefined> = {
    element: "field--date-picker",
    ...axisAttrs({ emphasis, status, scale, concept, state: disabled ? "disabled" : state, position }),
  };

  return (
    <Popover open={open} onOpenChange={disabled ? () => {} : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          {...themeAttrs}
          className={cn(
            "flex w-full items-center justify-between disabled:pointer-events-none disabled:cursor-not-allowed",
            className,
          )}
        >
          <span
            data-part="value"
            element={current == null ? "type--body-small" : undefined}
            emphasis={current == null ? "quiet" : undefined}
            className="truncate"
          >
            {label}
          </span>
          <Icon name="calendar" scale="sm" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <div element="surface--calendar" {...axisAttrs({ scale, concept, state: disabled ? "disabled" : undefined })}>
        {mode === "range" ? (
          <DayPicker
            mode="range"
            selected={(current ?? undefined) as DateRange | undefined}
            onSelect={(range) => commit(range ?? null)}
            components={{ DayButton: CalendarDayButton, PreviousMonthButton, NextMonthButton }}
            classNames={CALENDAR_CLASSES}
            disabled={disabledDates}
            startMonth={fromDate}
            endMonth={toDate}
          />
        ) : (
          <DayPicker
            mode="single"
            selected={(current ?? undefined) as Date | undefined}
            onSelect={(d) => {
              commit(d ?? null);
              if (d) setOpen(false);
            }}
            components={{ DayButton: CalendarDayButton, PreviousMonthButton, NextMonthButton }}
            classNames={CALENDAR_CLASSES}
            disabled={disabledDates}
            startMonth={fromDate}
            endMonth={toDate}
          />
        )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
