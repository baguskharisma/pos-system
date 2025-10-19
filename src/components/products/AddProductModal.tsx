"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, Sparkles } from "lucide-react";
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
import { createProductSchema } from "@/lib/validations/products";
import { useCreateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { generateSKU } from "@/lib/product-utils";
import type { CreateProductData } from "@/types/product";
import { useState } from "react";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddProductModal({ open, onClose }: AddProductModalProps) {
  const createProduct = useCreateProduct();
  const { data: categoriesData } = useCategories({ limit: 100, isActive: true });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    control,
  } = useForm<CreateProductData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      categoryId: "",
      description: "",
      price: 0,
      costPrice: 0,
      compareAtPrice: undefined,
      taxable: true,
      taxRate: 11,
      imageUrl: "",
      trackInventory: false,
      quantity: 0,
      lowStockAlert: 10,
      isAvailable: true,
      isFeatured: false,
      tags: [],
    },
  });

  // Auto-generate SKU from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!watch("sku")) {
      setValue("sku", generateSKU(value));
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImagePreview(url || null);
  };

  const onSubmit = async (data: CreateProductData) => {
    try {
      await createProduct.mutateAsync(data);
      reset();
      setImagePreview(null);
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    reset();
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product for your catalog. All fields marked with * are
            required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Premium Wireless Headphones"
                  {...register("name")}
                  onChange={(e) => {
                    register("name").onChange(e);
                    handleNameChange(e);
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    placeholder="PROD-HEADPHONES-123456"
                    {...register("sku")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue("sku", generateSKU(watch("name")))}
                    title="Generate SKU"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Unique product identifier. Auto-generated from name.
                </p>
                {errors.sku && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.sku.message}
                  </p>
                )}
              </div>

              {/* Barcode */}
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="123456789012"
                  {...register("barcode")}
                />
                {errors.barcode && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.barcode.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="categoryId">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData?.data.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.color && (
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this product"
                  rows={3}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (IDR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="0"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* Cost Price */}
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (IDR)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="0"
                  {...register("costPrice", { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-500">For profit calculation</p>
                {errors.costPrice && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.costPrice.message}
                  </p>
                )}
              </div>

              {/* Compare At Price */}
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare At Price (IDR)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="0"
                  {...register("compareAtPrice", { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-500">
                  Original price (for discounts)
                </p>
                {errors.compareAtPrice && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.compareAtPrice.message}
                  </p>
                )}
              </div>
            </div>

            {/* Tax */}
            <div className="flex items-start gap-4">
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="taxable"
                  checked={watch("taxable")}
                  onCheckedChange={(checked) =>
                    setValue("taxable", checked as boolean)
                  }
                />
                <Label
                  htmlFor="taxable"
                  className="text-sm font-normal cursor-pointer"
                >
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
                    min="0"
                    max="100"
                    placeholder="11"
                    {...register("taxRate", { valueAsNumber: true })}
                  />
                  {errors.taxRate && (
                    <p className="text-sm text-red-600" role="alert">
                      {errors.taxRate.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Image</h3>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                {...register("imageUrl")}
                onChange={(e) => {
                  register("imageUrl").onChange(e);
                  handleImageUrlChange(e);
                }}
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.imageUrl.message}
                </p>
              )}
              {imagePreview && (
                <div className="mt-2 relative w-32 h-32 border border-slate-200 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                    onError={() => setImagePreview(null)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setValue("imageUrl", "");
                      setImagePreview(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
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
                  Track inventory for this product
                </Label>
              </div>

              {watch("trackInventory") && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("quantity", { valueAsNumber: true })}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.quantity.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                    <Input
                      id="lowStockAlert"
                      type="number"
                      min="0"
                      placeholder="10"
                      {...register("lowStockAlert", { valueAsNumber: true })}
                    />
                    {errors.lowStockAlert && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.lowStockAlert.message}
                      </p>
                    )}
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
                  Available (product will be visible to customers)
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
                  Featured (highlight this product)
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
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
