"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateProductSchema } from "@/lib/validations/products";
import { useUpdateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { generateSKU } from "@/lib/product-utils";
import type { UpdateProductData, Product } from "@/types/product";

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function EditProductModal({
  open,
  onClose,
  product,
}: EditProductModalProps) {
  const updateProduct = useUpdateProduct();
  const { data: categoriesData } = useCategories({ limit: 100, isActive: true });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    control,
  } = useForm<UpdateProductData>({
    resolver: zodResolver(updateProductSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        categoryId: product.categoryId,
        description: product.description,
        price: product.price,
        costPrice: product.costPrice ?? undefined,
        compareAtPrice: product.compareAtPrice ?? undefined,
        taxable: product.taxable,
        taxRate: product.taxRate ?? undefined,
        imageUrl: product.imageUrl ?? "",
        trackInventory: product.trackInventory,
        quantity: product.quantity,
        lowStockAlert: product.lowStockAlert ?? undefined,
        isAvailable: product.isAvailable,
        isFeatured: product.isFeatured,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: UpdateProductData) => {
    if (!product) return;
    try {
      await updateProduct.mutateAsync({ id: product.id, data });
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input id="sku" {...register("sku")} className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue("sku", generateSKU(watch("name") || ""))}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                {errors.sku && (
                  <p className="text-sm text-red-600">{errors.sku.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" {...register("barcode")} />
                {errors.barcode && (
                  <p className="text-sm text-red-600">{errors.barcode.message}</p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="categoryId">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData?.data.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} {...register("description")} />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  step="100"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="100"
                  {...register("costPrice", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare At Price</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="100"
                  {...register("compareAtPrice", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="taxable"
                  checked={watch("taxable")}
                  onCheckedChange={(checked) =>
                    setValue("taxable", checked as boolean)
                  }
                />
                <Label htmlFor="taxable" className="text-sm font-normal cursor-pointer">
                  Taxable
                </Label>
              </div>
              {watch("taxable") && (
                <div className="flex-1 space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    {...register("taxRate", { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          {/* Image */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Product Image</h3>
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value || null}
                  onChange={(url) => field.onChange(url || "")}
                  folder="products"
                  disabled={isSubmitting}
                  aspectRatio="square"
                  maxSizeMB={10}
                />
              )}
            />
            {errors.imageUrl && (
              <p className="text-sm text-red-600" role="alert">
                {errors.imageUrl.message}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Upload a product image. Recommended: Square image (1:1 ratio), max 10MB.
            </p>
          </div>

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Inventory</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trackInventory"
                  checked={watch("trackInventory")}
                  onCheckedChange={(checked) =>
                    setValue("trackInventory", checked as boolean)
                  }
                />
                <Label
                  htmlFor="trackInventory"
                  className="text-sm font-normal cursor-pointer"
                >
                  Track inventory
                </Label>
              </div>

              {watch("trackInventory") && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      {...register("quantity", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                    <Input
                      id="lowStockAlert"
                      type="number"
                      {...register("lowStockAlert", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Status</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAvailable"
                  checked={watch("isAvailable")}
                  onCheckedChange={(checked) =>
                    setValue("isAvailable", checked as boolean)
                  }
                />
                <Label
                  htmlFor="isAvailable"
                  className="text-sm font-normal cursor-pointer"
                >
                  Available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFeatured"
                  checked={watch("isFeatured")}
                  onCheckedChange={(checked) =>
                    setValue("isFeatured", checked as boolean)
                  }
                />
                <Label
                  htmlFor="isFeatured"
                  className="text-sm font-normal cursor-pointer"
                >
                  Featured
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
