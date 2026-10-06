/** Accepts Indonesian PIC numbers beginning with 0 or +62. */
export function isValidPicPhoneNumber(value: string): boolean {
  const compact = value.trim().replace(/[\s().-]/g, "");
  return /^(?:0\d{8,13}|\+62\d{8,13})$/.test(compact);
}
