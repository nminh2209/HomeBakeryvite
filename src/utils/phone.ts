/** Normalize Vietnamese phone numbers to local format starting with 0. */
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-()]/g, '');
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('84') && normalized.length > 2) {
    normalized = '0' + normalized.slice(2);
  }
  return normalized;
}
