/**
 * AddressAutocomplete
 *
 * Typing-as-you-go address picker backed by Photon (Komoot, OSS).
 * Controlled input: `value` is the structured `AddressValue` currently selected
 * (or null). Emits the structured value on selection; emits null when the user
 * clears the field.
 *
 * Photon endpoint is the public instance — fair-use; if production traffic
 * needs more, swap `baseUrl` to a self-hosted one.
 */

import * as React from "react";
import { COUNTRIES, type Country, type AddressValue } from "@libs/value-types";
import { Input } from "../.././input";

const PHOTON_BASE_URL = "https://photon.komoot.io/api/";
const DEBOUNCE_MS = 300;
const COUNTRY_SET: ReadonlySet<string> = new Set<string>(COUNTRIES as readonly string[]);

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_value?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    county?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
}

interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

function toAddressValue(f: PhotonFeature): AddressValue {
  const p = f.properties;
  const street =
    p.housenumber && p.street
      ? `${p.street} ${p.housenumber}`
      : (p.street ?? p.name ?? null);
  const parts = [street, p.postcode && p.city ? `${p.postcode} ${p.city}` : (p.city ?? null), p.country ?? null];
  const formatted = parts.filter(Boolean).join(", ");
  const cc = p.countrycode?.toUpperCase();
  return {
    formatted: formatted || (p.name ?? ""),
    street: street ?? null,
    city: p.city ?? null,
    region: p.state ?? p.county ?? null,
    postcode: p.postcode ?? null,
    country: cc && COUNTRY_SET.has(cc) ? (cc as Country) : null,
    lat: f.geometry.coordinates[1] ?? null,
    lng: f.geometry.coordinates[0] ?? null,
  };
}

function featureLabel(f: PhotonFeature): string {
  const p = f.properties;
  const head = p.housenumber && p.street ? `${p.street} ${p.housenumber}` : (p.name ?? p.street ?? "");
  const tail = [p.postcode, p.city, p.country].filter(Boolean).join(", ");
  return tail ? `${head}, ${tail}` : head;
}

export interface AddressAutocompleteProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  /** Photon `lang` param — typically the user's locale (e.g. "en", "pt"). */
  lang?: string;
  placeholder?: string;
  searchingLabel?: string;
  disabled?: boolean;
  id?: string;
  "data-testid"?: string;
  /** the product's name for what this is: the theme may key on it */
  concept?: string;
  /** what it is doing inside, as words: the theme may key on it */
  flag?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  lang,
  placeholder,
  searchingLabel,
  disabled,
  id,
  "data-testid": dataTestId,
  concept,
  flag,
}: AddressAutocompleteProps) {
  const [query, setQuery] = React.useState(value?.formatted ?? "");
  const [results, setResults] = React.useState<PhotonFeature[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Reflect external value changes (e.g. form reset) into the input.
  React.useEffect(() => {
    setQuery(value?.formatted ?? "");
  }, [value?.formatted]);

  // Debounced Photon lookup.
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 3 || trimmed === value?.formatted) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const url = new URL(PHOTON_BASE_URL);
        url.searchParams.set("q", trimmed);
        url.searchParams.set("limit", "5");
        if (lang) url.searchParams.set("lang", lang);
        const resp = await fetch(url.toString(), { signal: controller.signal });
        if (!resp.ok) throw new Error(`Photon ${resp.status}`);
        const json = (await resp.json()) as PhotonResponse;
        setResults(json.features ?? []);
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [query, lang, open, value?.formatted]);

  // Close the dropdown on outside click.
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleSelect = (f: PhotonFeature) => {
    const addr = toAddressValue(f);
    onChange(addr);
    setQuery(addr.formatted ?? "");
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} concept={concept} flag={flag} className="relative w-full">
      <Input
        id={id}
        type="text"
        autoComplete="off"
        className="w-full"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={dataTestId}
        onChange={(next) => {
          setQuery(next);
          setOpen(true);
          // Clearing the field clears the structured value too.
          if (next.length === 0 && value !== null) {
            onChange(null);
          }
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (results.length > 0 || loading) && (
        // the results: the floating menu and its items, painted by the theme as every other menu
        <ul
          element="overlay--dropdown-menu"
          className="absolute z-50 mt-1 w-full list-none overflow-hidden"
          data-testid={dataTestId ? `${dataTestId}-results` : undefined}
        >
          {loading && results.length === 0 && (
            <li element="control--menu-item" state="disabled">
              {searchingLabel ?? "Searching…"}
            </li>
          )}
          {results.map((f, i) => (
            <li key={`${f.properties.osm_id ?? "f"}-${i}`}>
              <button
                type="button"
                element="control--menu-item"
                className="block w-full text-left"
                onClick={() => handleSelect(f)}
                data-testid={dataTestId ? `${dataTestId}-option-${i}` : undefined}
              >
                {featureLabel(f)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
