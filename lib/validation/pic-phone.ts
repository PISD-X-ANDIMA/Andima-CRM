export const PHONE_COUNTRIES = [
  { code: "ID", name: "Indonesia", dialCode: "+62", min: 8, max: 13 },
  { code: "US", name: "United States", dialCode: "+1", min: 10, max: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", min: 10, max: 10 },
  { code: "SG", name: "Singapore", dialCode: "+65", min: 8, max: 8 },
  { code: "MY", name: "Malaysia", dialCode: "+60", min: 9, max: 10 },
  { code: "AU", name: "Australia", dialCode: "+61", min: 9, max: 9 },
] as const;

export type PhoneCountryCode = typeof PHONE_COUNTRIES[number]["code"];

export function getPhoneCountry(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  return [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => compact.startsWith(country.dialCode)) || PHONE_COUNTRIES[0];
}

export function getNationalPhoneNumber(value: string, countryCode: PhoneCountryCode) {
  const country = PHONE_COUNTRIES.find((item) => item.code === countryCode) || PHONE_COUNTRIES[0];
  let compact = value.trim().replace(/\D/g, "");
  const oldCountry = getPhoneCountry(value);
  if (value.trim().startsWith("+")) compact = compact.slice(oldCountry.dialCode.replace(/\D/g, "").length);
  if (country.code === "ID" && compact.startsWith("0")) compact = compact.slice(1);
  return compact.slice(0, country.max);
}

export function toInternationalPhoneNumber(nationalNumber: string, countryCode: PhoneCountryCode) {
  const country = PHONE_COUNTRIES.find((item) => item.code === countryCode) || PHONE_COUNTRIES[0];
  let digits = nationalNumber.replace(/\D/g, "");
  if (country.code === "ID" && digits.startsWith("0")) digits = digits.slice(1);
  return `${country.dialCode}${digits}`;
}

/** Accepts the country calling codes exposed by the PIC phone input. */
export function isValidPicPhoneNumber(value: string): boolean {
  const compact = value.trim().replace(/[\s().-]/g, "");
  const country = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((item) => compact.startsWith(item.dialCode));
  if (country) {
    const national = compact.slice(country.dialCode.length);
    return /^\d+$/.test(national) && national.length >= country.min && national.length <= country.max;
  }
  // Continue accepting previously stored Indonesian numbers in local 0-prefixed format.
  return /^0\d{8,13}$/.test(compact);
}
