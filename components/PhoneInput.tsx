"use client";

import { COUNTRY_CODE, toE164, toLocalDigits } from "@/lib/phone";

interface PhoneInputProps {
  value: string;
  onChange: (fullValue: string) => void;
  required?: boolean;
  id?: string;
}

/** A fixed +91 prefix badge next to a digits-only input — the app is
 * India-only for now (see PRD), so asking users to type their own country
 * code is unnecessary friction. Always reports the full "+91XXXXXXXXXX"
 * value up to the parent, same shape the API already expects. */
export default function PhoneInput({ value, onChange, required, id }: PhoneInputProps) {
  const digits = toLocalDigits(value);

  return (
    <div className="phone-field">
      <span className="phone-field-prefix">{COUNTRY_CODE}</span>
      <input
        id={id}
        className="phone-field-input"
        type="tel"
        inputMode="numeric"
        placeholder="98XXXXXXXX"
        value={digits}
        onChange={(e) => onChange(toE164(e.target.value.replace(/\D/g, "").slice(0, 10)))}
        maxLength={10}
        required={required}
      />
    </div>
  );
}
