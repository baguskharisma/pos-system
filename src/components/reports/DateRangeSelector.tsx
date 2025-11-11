"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presetRanges = [
  {
    label: "Hari Ini",
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: "7 Hari Terakhir",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "30 Hari Terakhir",
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: "Minggu Ini",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    label: "Bulan Ini",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Bulan Lalu",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {presetRanges.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(preset.getValue());
              setShowCustom(false);
            }}
            className="text-sm"
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="text-sm"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Custom
        </Button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dari
            </label>
            <input
              type="date"
              value={format(value.from, "yyyy-MM-dd")}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                onChange({ ...value, from: newDate });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sampai
            </label>
            <input
              type="date"
              value={format(value.to, "yyyy-MM-dd")}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                onChange({ ...value, to: newDate });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="text-sm text-slate-600">
        <Calendar className="w-4 h-4 inline mr-2" />
        Periode: {format(value.from, "dd MMM yyyy")} - {format(value.to, "dd MMM yyyy")}
      </div>
    </div>
  );
}
