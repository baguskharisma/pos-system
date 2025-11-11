/**
 * Generate unique order number
 * Format: ORD-[timestamp]-[random string]
 * Example: ORD-1704567890123-A4B9X
 */
export function generateOrderNumber(): string {
  // Use timestamp for uniqueness
  const timestamp = Date.now();

  // Generate random string (5 characters, alphanumeric uppercase)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < 5; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `ORD-${timestamp}-${randomString}`;
}

/**
 * Generate short order display number for UI
 * Format: ORD-[last 6 digits of timestamp]-[2 random chars]
 * Example: ORD-890123-A4
 */
export function generateShortOrderNumber(): string {
  const timestamp = Date.now();
  const shortTimestamp = timestamp.toString().slice(-6);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < 2; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `ORD-${shortTimestamp}-${randomString}`;
}

/**
 * Validate order number format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  // Check format: ORD-numbers-letters
  const pattern = /^ORD-\d+-[A-Z0-9]+$/;
  return pattern.test(orderNumber);
}
