/**
 * PreferencesPage — the caller's preferences, stored on their account
 * (GET/PATCH /me/preferences). What each field allows is the product's
 * policy, handed in through the web config (`preferences`):
 *
 *   - Language and Timezone, when userOverridable: a card each — follow the
 *     system (where the policy offers it) or choose manually, with a Save per
 *     card.
 *   - Currency and Country, when userOverridable: a card each — pick from the
 *     value-types list (the OS can't resolve them, so no "follow system").
 *   - Fields the user can't override: one "Set by the product" card listing
 *     their values. Without a policy, every field lands here.
 */

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  InputSelect,
  Label,
  List,
  ListItem,
  ListItemAction,
  ListItemContent,
  ListItemTitle,
  RadioGroup,
  RadioGroupItem,
  type InputSelectOption,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import {
  COUNTRIES,
  CURRENCIES,
  LOCALES,
  TIMEZONES,
  getCountryMeta,
  getCurrencyMeta,
  getLocaleMeta,
} from "@libs/value-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import type {
  BoundPreferenceField,
  PreferenceField,
  PreferenceFieldPolicy,
  UpdateUserPreferencesInput,
  UserPreferencesView,
  ValuePreferenceField,
} from "../../../shared/types/preferences";
import { StatusAlert } from "../../components/StatusAlert";

const T: Record<PreferenceField, { title: string; description: string }> = {
  locale: {
    title: "Language",
    description:
      "Your preferred language for content and interface — independent of regional formats.",
  },
  timezone: {
    title: "Timezone",
    description: "All dates and times display in this timezone.",
  },
  currency: {
    title: "Currency",
    description: "Prices and amounts display in this currency.",
  },
  country: {
    title: "Country",
    description: "Your country, for regional defaults.",
  },
};

const FIELD_LABELS: Record<PreferenceField, string> = {
  locale: "Language",
  timezone: "Timezone",
  currency: "Currency",
  country: "Country",
};

/** A value as a person reads it (currency symbol + name, country flag + name). */
function valueLabel(field: PreferenceField, value: string | null): string {
  if (!value) return "—";
  try {
    if (field === "currency") {
      const meta = getCurrencyMeta(value as never);
      return `${meta.symbol} ${meta.name} (${meta.code})`;
    }
    if (field === "country") {
      const meta = getCountryMeta(value as never);
      return `${meta.flag} ${meta.name}`;
    }
    if (field === "locale") return getLocaleMeta(value as never).nativeName;
  } catch {
    // unknown code — show it as-is
  }
  return value;
}

const LOCALE_OPTIONS: InputSelectOption[] = LOCALES.map((code) => {
  const meta = getLocaleMeta(code);
  return { value: code, label: `${meta.nativeName} (${meta.name})` };
});
const TIMEZONE_OPTIONS: InputSelectOption[] = TIMEZONES.map((tz) => {
  const slash = tz.indexOf("/");
  return {
    value: tz,
    label: tz.replace(/_/g, " "),
    group: slash === -1 ? "Other" : tz.slice(0, slash),
  };
});
const CURRENCY_OPTIONS: InputSelectOption[] = CURRENCIES.map((code) => ({
  value: code,
  label: valueLabel("currency", code),
}));
const COUNTRY_OPTIONS: InputSelectOption[] = COUNTRIES.map((code) => ({
  value: code,
  label: valueLabel("country", code),
}));
const OPTIONS: Record<PreferenceField, InputSelectOption[]> = {
  locale: LOCALE_OPTIONS,
  timezone: TIMEZONE_OPTIONS,
  currency: CURRENCY_OPTIONS,
  country: COUNTRY_OPTIONS,
};

/** What the system would resolve for the field, from the browser. */
function detect(field: BoundPreferenceField): string | null {
  try {
    if (field === "timezone") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    }
    const language = navigator.language?.split("-")[0];
    return language && (LOCALES as readonly string[]).includes(language)
      ? language
      : null;
  } catch {
    return null;
  }
}

/** A field's effective value from the view, for the product card. */
function viewValue(view: UserPreferencesView, field: PreferenceField): string | null {
  const entry = view[field];
  return typeof entry === "object" && entry !== null ? entry.value : entry;
}

const ALL_FIELDS: PreferenceField[] = ["locale", "timezone", "currency", "country"];
const BOUND_FIELDS: BoundPreferenceField[] = ["locale", "timezone"];
const VALUE_FIELDS: ValuePreferenceField[] = ["currency", "country"];

export function PreferencesPage(): React.ReactElement | null {
  const { client, config } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const { data: sessionData } = useSession();
  const { data, error } = useQuery({
    queryKey: queryKeys.preferences,
    queryFn: () => client.getMyPreferences(),
    enabled: !!sessionData?.session,
  });
  const [saved, setSaved] = React.useState<string | null>(null);

  if (!sessionData?.session) return null;

  const policy = config.preferences;
  const editableBound = BOUND_FIELDS.filter((field) => policy?.[field].userOverridable);
  const editableValues = VALUE_FIELDS.filter((field) => policy?.[field].userOverridable);
  const editable: PreferenceField[] = [...editableBound, ...editableValues];
  const productSet = ALL_FIELDS.filter((field) => !editable.includes(field));

  const save = async (patch: UpdateUserPreferencesInput, field: string) => {
    const next = await client.updateMyPreferences(patch);
    queryClient.setQueryData(queryKeys.preferences, next);
    setSaved(field);
  };

  return (
    <Stack dir="col" gap={24} data-testid="preferences-page" className="w-full max-w-2xl">
      <Stack dir="col" gap={4}>
        <h2 element="type--heading3">Preferences</h2>
        <span element="type--body-small" emphasis="quiet">
          Control how the app formats numbers, dates and regions for you.
        </span>
      </Stack>

      {error && (
        <StatusAlert status="error">Failed to load preferences.</StatusAlert>
      )}
      {saved && (
        <StatusAlert status="success" testId="preferences-saved">Preferences saved.</StatusAlert>
      )}

      {data && (
        <>
          {policy &&
            editableBound.map((field) => (
              <BoundCard
                key={field}
                field={field}
                policy={policy[field]}
                view={data[field]}
                onSave={(patch) => save(patch, field)}
              />
            ))}
          {editableValues.map((field) => (
            <ValueCard
              key={field}
              field={field}
              value={data[field]}
              onSave={(patch) => save(patch, field)}
            />
          ))}

          {productSet.length > 0 && (
            <Card data-testid="preferences-product-card">
              <CardHeader>
                <Stack dir="col" gap={2}>
                  <h2 element="type--heading4">Set by the product</h2>
                  <span element="type--body-small" emphasis="quiet">
                    These aren't user-overridable in this product — these are its defaults.
                  </span>
                </Stack>
              </CardHeader>
              <CardContent>
                <List data-testid="preferences-list" position="fill">
                  {productSet.map((field) => (
                    <ListItem key={field} data-testid={`preference-${field}`}>
                      <ListItemContent>
                        <ListItemTitle>{FIELD_LABELS[field]}</ListItemTitle>
                      </ListItemContent>
                      <ListItemAction>
                        <span element="type--body-small">
                          {valueLabel(field, viewValue(data, field))}
                        </span>
                      </ListItemAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Stack>
  );
}

/** A field the system may resolve: follow the system, or choose explicitly; Save when it differs. */
function BoundCard({
  field,
  policy,
  view,
  onSave,
}: {
  field: BoundPreferenceField;
  policy: PreferenceFieldPolicy;
  view: UserPreferencesView[BoundPreferenceField];
  onSave: (patch: UpdateUserPreferencesInput) => Promise<void>;
}) {
  const [source, setSource] = React.useState<"system" | "explicit">(view.source);
  const [value, setValue] = React.useState<string | null>(view.value);
  const [saving, setSaving] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  React.useEffect(() => {
    setSource(view.source);
    setValue(view.value);
  }, [view.source, view.value]);

  const detected = React.useMemo(() => detect(field), [field]);
  const canSave =
    source === "system"
      ? policy.allowSystemBinding && view.source !== "system"
      : !!value && (view.source !== "explicit" || view.value !== value);

  const submit = async () => {
    setLocalError(null);
    setSaving(true);
    try {
      await onSave(
        source === "system"
          ? { [field]: { source: "system" } }
          : { [field]: { source: "explicit", value: value! } },
      );
    } catch (e) {
      setLocalError(e instanceof ApiError ? e.message : "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card data-testid={`preferences-${field}-card`}>
      <CardHeader>
        <Stack dir="col" gap={2}>
          <h2 element="type--heading4">{T[field].title}</h2>
          <span element="type--body-small" emphasis="quiet">
            {T[field].description}
          </span>
        </Stack>
      </CardHeader>
      <CardContent>
        <Stack dir="col" gap={16}>
          {localError && (
            <StatusAlert status="error">{localError}</StatusAlert>
          )}
          {policy.allowSystemBinding && (
            <RadioGroup
              value={source}
              onValueChange={(next: string) => setSource(next as "system" | "explicit")}
            >
              <Stack dir="row" gap={24} wrap>
                <Stack dir="row" align="center" gap={8}>
                  <RadioGroupItem
                    value="system"
                    id={`${field}-source-system`}
                    data-testid={`preferences-${field}-source-system`}
                  />
                  <Label htmlFor={`${field}-source-system`}>Follow system</Label>
                </Stack>
                <Stack dir="row" align="center" gap={8}>
                  <RadioGroupItem
                    value="explicit"
                    id={`${field}-source-explicit`}
                    data-testid={`preferences-${field}-source-explicit`}
                  />
                  <Label htmlFor={`${field}-source-explicit`}>Choose manually</Label>
                </Stack>
              </Stack>
            </RadioGroup>
          )}
          <Stack dir="col" gap={6}>
            <Label>{T[field].title}</Label>
            <InputSelect
              data-testid={`preferences-${field}-trigger`}
              aria-label={T[field].title}
              search="in-list"
              clearable={false}
              disabled={source === "system"}
              placeholder={source === "system" ? "System value unavailable" : "Select…"}
              value={source === "system" ? detected : value}
              onChange={(next) => setValue((next as unknown as string | null) ?? null)}
              options={OPTIONS[field]}
            />
          </Stack>
        </Stack>
      </CardContent>
      <CardFooter>
        <Stack dir="row" justify="end" className="w-full">
          <Button
            type="button"
            data-testid={`preferences-${field}-save`}
            disabled={!canSave || saving}
            onClick={() => void submit()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </CardFooter>
    </Card>
  );
}

/** A plain field (currency, country): pick a value; Save when it differs. */
function ValueCard({
  field,
  value: current,
  onSave,
}: {
  field: ValuePreferenceField;
  value: string | null;
  onSave: (patch: UpdateUserPreferencesInput) => Promise<void>;
}) {
  const [value, setValue] = React.useState<string | null>(current);
  const [saving, setSaving] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  React.useEffect(() => setValue(current), [current]);

  const submit = async () => {
    setLocalError(null);
    setSaving(true);
    try {
      await onSave({ [field]: value });
    } catch (e) {
      setLocalError(e instanceof ApiError ? e.message : "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card data-testid={`preferences-${field}-card`}>
      <CardHeader>
        <Stack dir="col" gap={2}>
          <h2 element="type--heading4">{T[field].title}</h2>
          <span element="type--body-small" emphasis="quiet">
            {T[field].description}
          </span>
        </Stack>
      </CardHeader>
      <CardContent>
        <Stack dir="col" gap={16}>
          {localError && (
            <StatusAlert status="error">{localError}</StatusAlert>
          )}
          <Stack dir="col" gap={6}>
            <Label>{T[field].title}</Label>
            <InputSelect
              data-testid={`preferences-${field}-trigger`}
              aria-label={T[field].title}
              search="in-list"
              clearable={false}
              placeholder="Select…"
              value={value}
              onChange={(next) => setValue((next as unknown as string | null) ?? null)}
              options={OPTIONS[field]}
            />
          </Stack>
        </Stack>
      </CardContent>
      <CardFooter>
        <Stack dir="row" justify="end" className="w-full">
          <Button
            type="button"
            data-testid={`preferences-${field}-save`}
            disabled={!value || value === current || saving}
            onClick={() => void submit()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </CardFooter>
    </Card>
  );
}
