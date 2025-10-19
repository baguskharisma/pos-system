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
import { useDeleteProduct } from "@/hooks/useProducts";
import type { Product } from "@/types/product";

interface DeleteProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function DeleteProductDialog({
  open,
  onClose,
  product,
}: DeleteProductDialogProps) {
  const deleteProduct = useDeleteProduct();

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  if (!product) return null;

  const hasOrders = product._count && product._count.orderItems > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-700">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{product.name}</span>?
          </p>

          {hasOrders && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Warning</p>
                  <p>
                    This product has {product._count.orderItems} order item(s) in
                    the system. Deleting it may affect order history and reports.
                  </p>
                  <p className="mt-2">
                    Consider marking it as unavailable instead to preserve data
                    integrity.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">SKU:</dt>
                <dd className="font-medium text-slate-900">{product.sku}</dd>
              </div>
              {product.category && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Category:</dt>
                  <dd className="font-medium text-slate-900">
                    {product.category.name}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-600">Stock:</dt>
                <dd className="font-medium text-slate-900">
                  {product.trackInventory
                    ? `${product.quantity} units`
                    : "Not tracked"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteProduct.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
          >
            {deleteProduct.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete Product"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
