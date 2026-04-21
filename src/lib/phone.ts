// Saudi phone number helpers
// Local numbers are stored as 9 digits starting with 5 (e.g. "5XXXXXXXX").
// International format prepends country code 966 (e.g. "9665XXXXXXXX").

export const SA_COUNTRY_CODE = '966';

/**
 * Normalize any user input into the 9-digit local Saudi mobile number.
 * Accepts strings like "+966 5XXXXXXXX", "966 5XXXXXXXX", "05XXXXXXXX",
 * "5XXXXXXXX" and returns "5XXXXXXXX" (or partial while typing).
 * If the user starts typing with "0" we drop it so "05..." becomes "5...".
 */
export function normalizeSaLocal(input: string): string {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');
  // Strip international dialing prefixes
  if (digits.startsWith('00966')) digits = digits.slice(5);
  else if (digits.startsWith('966')) digits = digits.slice(3);
  // Drop any leading zeros (0 -> 5xxxxxxxx convention)
  while (digits.startsWith('0')) digits = digits.slice(1);
  // Cap at 9 digits for a Saudi mobile local number
  if (digits.length > 9) digits = digits.slice(0, 9);
  return digits;
}

/**
 * Return the international-format phone as digits only (e.g. "9665XXXXXXXX").
 * Useful for wa.me URLs. If local number is empty returns ''.
 */
export function toSaIntl(input: string): string {
  const local = normalizeSaLocal(input);
  if (!local) return '';
  return SA_COUNTRY_CODE + local;
}

/**
 * Human display format, e.g. "+966 5XX XXX XXXX".
 */
export function formatSaDisplay(input: string): string {
  const local = normalizeSaLocal(input);
  if (!local) return '';
  const padded = local.padEnd(9, ' ').trimEnd();
  const a = padded.slice(0, 2);
  const b = padded.slice(2, 5);
  const c = padded.slice(5, 9);
  return `+${SA_COUNTRY_CODE} ${[a, b, c].filter(Boolean).join(' ')}`.trim();
}
