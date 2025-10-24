/**
 * Date Range Picker Component
 * src/components/ui/DateRangePicker.tsx
 */

"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | null) => void;
}

const PRESET_RANGES = [
  {
    label: "Today",
    getValue: () => {
      const today = new Date().toISOString().split("T")[0];
      return { from: today, to: today };
    },
  },
  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const date = yesterday.toISOString().split("T")[0];
      return { from: date, to: date };
    },
  },
  {
    label: "Last 7 Days",
    getValue: () => {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      return {
        from: sevenDaysAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Last 30 Days",
    getValue: () => {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return {
        from: thirtyDaysAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: firstDay.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Last Month",
    getValue: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
      };
    },
  },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [tempFrom, setTempFrom] = useState(value?.from || "");
  const [tempTo, setTempTo] = useState(value?.to || "");

  const handlePresetClick = (preset: (typeof PRESET_RANGES)[0]) => {
    const range = preset.getValue();
    setTempFrom(range.from);
    setTempTo(range.to);
    onChange(range);
    setShowPopover(false);
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: tempFrom, to: tempTo });
      setShowPopover(false);
    }
  };

  const handleClear = () => {
    setTempFrom("");
    setTempTo("");
    onChange(null);
    setShowPopover(false);
  };

  const formatDateRange = () => {
    if (!value?.from || !value?.to) return "Select date range";
    const from = new Date(value.from).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const to = new Date(value.to).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${from} - ${to}`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2 justify-start text-left font-normal"
        onClick={() => setShowPopover(!showPopover)}
      >
        <Calendar className="h-4 w-4" />
        {formatDateRange()}
      </Button>

      {showPopover && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPopover(false)}
          />

          {/* Popover */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg border border-slate-200 shadow-lg p-4 w-[480px]">
            <div className="flex gap-4">
              {/* Presets */}
              <div className="flex-shrink-0 space-y-1">
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-100 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Range */}
              <div className="flex-1 border-l border-slate-200 pl-4">
                <h3 className="text-sm font-medium text-slate-900 mb-3">
                  Custom Range
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={tempFrom}
                      onChange={(e) => setTempFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={tempTo}
                      onChange={(e) => setTempTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleClear}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleApply}
                      disabled={!tempFrom || !tempTo}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}