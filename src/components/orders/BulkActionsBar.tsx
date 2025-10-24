/**
 * Bulk Actions Bar Component
 * src/components/orders/BulkActionsBar.tsx
 */

"use client";

import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExport: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onExport,
}: BulkActionsBarProps) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-blue-900">
          {selectedCount} order{selectedCount !== 1 ? "s" : ""} selected
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={onExport}
          >
            <Download className="h-4 w-4" />
            Export Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
}