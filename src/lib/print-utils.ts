/**
 * Print utilities for receipt printing
 */

export interface PrintOptions {
  printerId?: string;
  copies?: number;
  silent?: boolean; // Auto-print without showing print dialog
}

/**
 * Print receipt using browser print API
 */
export function printReceipt(elementId: string = "receipt-print", options: PrintOptions = {}) {
  const printWindow = window.open("", "_blank", "width=300,height=600");

  if (!printWindow) {
    console.error("Failed to open print window");
    return;
  }

  const receiptElement = document.getElementById(elementId);
  if (!receiptElement) {
    console.error("Receipt element not found");
    printWindow.close();
    return;
  }

  // Get the receipt HTML and styles
  const receiptHTML = receiptElement.innerHTML;
  const receiptStyles = Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        return Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch (e) {
        return "";
      }
    })
    .join("\n");

  // Create print document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Print Receipt</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: "Courier New", Courier, monospace;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: 58mm auto;
            margin: 0;
          }

          @media print {
            body {
              width: 58mm;
            }

            .receipt-container {
              width: 58mm;
              max-width: none;
              padding: 0;
              margin: 0;
            }
          }

          ${receiptStyles}
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();

      // Close window after printing (with delay to ensure print job is sent)
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 250);
  };
}

/**
 * Download receipt as image
 */
export async function downloadReceiptAsImage(
  elementId: string = "receipt-print",
  filename: string = "receipt.png"
) {
  const receiptElement = document.getElementById(elementId);
  if (!receiptElement) {
    console.error("Receipt element not found");
    return;
  }

  try {
    // Dynamically import html2canvas only when needed
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(receiptElement, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
    });

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
    }, "image/png");
  } catch (error) {
    console.error("Failed to download receipt as image:", error);
  }
}

/**
 * Share receipt via Web Share API (mobile)
 */
export async function shareReceipt(
  elementId: string = "receipt-print",
  title: string = "Receipt"
) {
  if (!navigator.share) {
    console.error("Web Share API not supported");
    return;
  }

  const receiptElement = document.getElementById(elementId);
  if (!receiptElement) {
    console.error("Receipt element not found");
    return;
  }

  try {
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(receiptElement, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], "receipt.png", { type: "image/png" });

      try {
        await navigator.share({
          title: title,
          text: "Receipt",
          files: [file],
        });
      } catch (error) {
        console.error("Error sharing receipt:", error);
      }
    }, "image/png");
  } catch (error) {
    console.error("Failed to share receipt:", error);
  }
}

/**
 * Send receipt to thermal printer via Bluetooth/USB
 * This requires additional hardware integration
 */
export function sendToThermalPrinter(
  receiptData: any,
  printerInterface: "bluetooth" | "usb" | "network" = "bluetooth"
) {
  // TODO: Implement thermal printer integration
  // This would require:
  // 1. Bluetooth/USB/Network printer connection
  // 2. ESC/POS command generation
  // 3. Data formatting for thermal printer

  console.warn("Thermal printer integration not yet implemented");
  console.log("Receipt data:", receiptData);
  console.log("Printer interface:", printerInterface);
}

/**
 * Check if browser supports printing
 */
export function isBrowserPrintSupported(): boolean {
  return typeof window !== "undefined" && "print" in window;
}

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}
