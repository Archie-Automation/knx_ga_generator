/**
 * Validate if physical address has the required KNX format: X.Y.Z
 * where X and Y are 0-15 (area, line) and Z is 0-255 (device).
 */
export function isValidPhysicalAddress(value: string): boolean {
  if (!value || !value.trim()) return false;

  const parts = value.trim().split('.');
  if (parts.length !== 3) return false;

  for (let i = 0; i < 3; i++) {
    const part = parts[i];
    if (!part || part.trim() === '') return false;

    const num = parseInt(part, 10);
    if (isNaN(num)) return false;

    if (i < 2) {
      if (num < 0 || num > 15) return false;
    } else {
      if (num < 0 || num > 255) return false;
    }
  }

  return true;
}
