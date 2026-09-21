import React, { useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/world/countries";

// Sorted once, not on every render.
const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

function guessDefaultCountry() {
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const region = locale?.split("-")[1]?.toUpperCase();
  if (region && SORTED_COUNTRIES.some((c) => c.code === region)) return region;
  return "SN";
}

// Splits a stored E.164-ish value ("+221701234567") back into a country +
// national number for editing, by matching the longest known calling code
// prefix (needed because dial codes aren't a fixed length - "+1" vs "+1246").
function splitValue(value) {
  if (!value) return null;
  const byLength = [...COUNTRIES].sort((a, b) => b.calling_code.length - a.calling_code.length);
  const match = byLength.find((c) => value.startsWith(c.calling_code));
  if (!match) return null;
  return { countryCode: match.code, national: value.slice(match.calling_code.length).trim() };
}

/**
 * value: full phone as "<calling_code><national digits>" (e.g. "+221701234567"), or "".
 * onChange(fullPhone: string)
 */
export default function PhoneInput({ value, onChange, id, required, autoComplete = "tel-national" }) {
  const initial = useMemo(() => splitValue(value), []);
  const [countryCode, setCountryCode] = useState(initial?.countryCode || guessDefaultCountry());
  const [national, setNational] = useState(initial?.national || "");

  const country = SORTED_COUNTRIES.find((c) => c.code === countryCode) || SORTED_COUNTRIES[0];

  const emit = (nextCountryCode, nextNational) => {
    const c = SORTED_COUNTRIES.find((x) => x.code === nextCountryCode) || country;
    const digits = nextNational.replace(/[^\d]/g, "");
    onChange(digits ? `${c.calling_code}${digits}` : "");
  };

  return (
    <div className="flex gap-2">
      <select
        aria-label="Indicatif du pays"
        value={countryCode}
        onChange={(e) => { setCountryCode(e.target.value); emit(e.target.value, national); }}
        className="h-12 rounded-md border border-input bg-background px-2 text-sm w-[6.5rem] shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {SORTED_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>{c.flag} {c.calling_code}</option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        placeholder="70 123 45 67"
        value={national}
        onChange={(e) => { setNational(e.target.value); emit(countryCode, e.target.value); }}
        className="h-12 flex-1 min-w-0 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
