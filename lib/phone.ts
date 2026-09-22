// India-only for now (see PRD) — every phone field in the app shares this
// instead of asking users to type their own country code.
export const COUNTRY_CODE = "+91";
const LOCAL_DIGITS = 10;

/** Strips the +91 prefix (or any non-digits) back to the bare local digits,
 * for feeding a text input's `value`. */
export function toLocalDigits(fullValue: string): string {
  const withoutPrefix = fullValue.startsWith(COUNTRY_CODE)
    ? fullValue.slice(COUNTRY_CODE.length)
    : fullValue;
  return withoutPrefix.replace(/\D/g, "").slice(0, LOCAL_DIGITS);
}

/** Indian mobile numbers are 10 digits, first digit 6-9. */
export function isValidIndianMobile(fullValue: string): boolean {
  const digits = toLocalDigits(fullValue);
  return /^[6-9]\d{9}$/.test(digits) && fullValue === `${COUNTRY_CODE}${digits}`;
}

export function toE164(localDigits: string): string {
  return localDigits ? `${COUNTRY_CODE}${localDigits}` : "";
}
