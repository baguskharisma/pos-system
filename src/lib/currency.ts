/**
 * Format number to Indonesian Rupiah currency
 * @param amount - The number to format
 * @param options - Optional Intl.NumberFormatOptions
 * @returns Formatted currency string (e.g., "Rp1.250.000")
 */
export function formatRupiah(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

/**
 * Format number to simple Rupiah format
 * @param amount - The number to format
 * @returns Formatted currency string (e.g., "Rp 1.250.000")
 */
export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Parse Rupiah string to number
 * @param rupiahString - String in Rupiah format (e.g., "Rp 1.250.000")
 * @returns Parsed number
 */
export function parseRupiah(rupiahString: string): number {
  return parseInt(rupiahString.replace(/[^0-9]/g, ""), 10) || 0;
}
