/**
 * Product-related utility functions
 */

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Export products to CSV
 */
export function exportProductsToCSV(products: Array<{
  name: string;
  sku: string;
  barcode: string | null;
  category?: { name: string } | null;
  price: number;
  quantity: number;
  isAvailable: boolean;
  createdAt: string;
}>): void {
  // Define CSV headers
  const headers = [
    "Name",
    "SKU",
    "Barcode",
    "Category",
    "Price",
    "Stock",
    "Status",
    "Created At",
  ];

  // Convert products to CSV rows
  const rows = products.map((product) => [
    `"${product.name.replace(/"/g, '""')}"`,
    product.sku,
    product.barcode || "",
    product.category?.name || "",
    product.price.toString(),
    product.quantity.toString(),
    product.isAvailable ? "Available" : "Hidden",
    new Date(product.createdAt).toLocaleDateString("id-ID"),
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  // Create and download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `products-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate SKU from name
 */
export function generateSKU(name: string, prefix = "PROD"): string {
  const timestamp = Date.now().toString().slice(-6);
  const nameSlug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .slice(0, 10);
  return `${prefix}-${nameSlug}-${timestamp}`;
}
