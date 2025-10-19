"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteCategory } from "@/hooks/useCategories";
import type { Category } from "@/types/category";

interface DeleteCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
}

export function DeleteCategoryDialog({
  open,
  onClose,
  category,
}: DeleteCategoryDialogProps) {
  const deleteCategory = useDeleteCategory();

  const handleDelete = async () => {
    if (!category) return;

    try {
      await deleteCategory.mutateAsync(category.id);
      onClose();
    } catch (_error) {
      // Error is handled by the mutation
    }
  };

  if (!category) return null;

  const hasProducts = (category._count?.products || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Category</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-3">
            {hasProducts ? (
              <div className="space-y-2">
                <p className="font-medium text-red-600">
                  Cannot delete this category
                </p>
                <p>
                  This category has{" "}
                  <strong>{category._count?.products} product(s)</strong>{" "}
                  associated with it. Please reassign or delete these products
                  before deleting this category.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{category.name}</strong>?
                </p>
                <p className="text-sm">
                  This action cannot be undone. The category will be permanently
                  removed from the system.
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Category Info */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center gap-3">
            {category.color && (
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: category.color }}
              />
            )}
            <div>
              <p className="font-medium text-slate-900">{category.name}</p>
              <p className="text-sm text-slate-500">Slug: {category.slug}</p>
            </div>
          </div>
          {category.description && (
            <p className="text-sm text-slate-600">{category.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-slate-500 pt-2">
            <span>Products: {category._count?.products || 0}</span>
            <span>Order: {category.sortOrder}</span>
            <span
              className={
                category.isActive ? "text-green-600" : "text-slate-400"
              }
            >
              {category.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!hasProducts && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
