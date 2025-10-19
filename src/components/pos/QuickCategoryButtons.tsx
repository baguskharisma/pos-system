"use client";

import { Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { POSCategory } from "@/types/pos";

interface QuickCategoryButtonsProps {
  categories: POSCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  isLoading?: boolean;
}

export function QuickCategoryButtons({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading = false,
}: QuickCategoryButtonsProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* All Categories Button */}
      <Button
        variant={selectedCategoryId === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className="flex-shrink-0 gap-2 h-10 px-4"
      >
        <Grid className="h-4 w-4" />
        <span className="whitespace-nowrap">All</span>
      </Button>

      {/* Category Buttons */}
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategoryId === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className="flex-shrink-0 gap-2 h-10 px-4"
          style={
            selectedCategoryId === category.id && category.color
              ? {
                  backgroundColor: category.color,
                  borderColor: category.color,
                  color: "white",
                }
              : {}
          }
        >
          {category.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          )}
          <span className="whitespace-nowrap">
            {category.name}
            {category.productCount > 0 && (
              <span className="ml-1 text-xs opacity-75">
                ({category.productCount})
              </span>
            )}
          </span>
        </Button>
      ))}
    </div>
  );
}
