"use client";

import { Search, X, Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface POSSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onScan?: (barcode: string) => void;
  placeholder?: string;
}

export function POSSearchBar({
  value,
  onChange,
  onScan,
  placeholder = "Search products by name or SKU...",
}: POSSearchBarProps) {
  const [scanMode, setScanMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when scan mode is activated
  useEffect(() => {
    if (scanMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && scanMode && value && onScan) {
      onScan(value);
      onChange("");
      setScanMode(false);
    }
  };

  const toggleScanMode = () => {
    setScanMode(!scanMode);
    if (!scanMode && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          type={scanMode ? "text" : "search"}
          placeholder={scanMode ? "Scan or enter barcode..." : placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`pl-10 pr-10 h-12 text-base ${
            scanMode ? "ring-2 ring-blue-500" : ""
          }`}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Barcode Scanner Button */}
      {onScan && (
        <Button
          variant={scanMode ? "default" : "outline"}
          size="lg"
          onClick={toggleScanMode}
          className="gap-2 h-12 px-4"
          title="Toggle barcode scanner"
        >
          <Barcode className="h-5 w-5" />
          <span className="hidden sm:inline">
            {scanMode ? "Cancel" : "Scan"}
          </span>
        </Button>
      )}
    </div>
  );
}
