"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { ImageUpload } from "@/components/ui/image-upload";
import { updateCategorySchema } from "@/lib/validations/categories";
import { useUpdateCategory } from "@/hooks/useCategories";
import type { Category, UpdateCategoryData } from "@/types/category";

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
}

export function EditCategoryModal({
  open,
  onClose,
  category,
}: EditCategoryModalProps) {
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    control,
  } = useForm<UpdateCategoryData>({
    resolver: zodResolver(updateCategorySchema),
  });

  // Update form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        color: category.color || "#3B82F6",
        icon: category.icon || "",
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: UpdateCategoryData) => {
    if (!category) return;

    try {
      await updateCategory.mutateAsync({
        id: category.id,
        data,
      });
      onClose();
    } catch (_error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              placeholder="e.g., Electronics"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-600" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="edit-slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-slug"
              placeholder="electronics"
              {...register("slug")}
            />
            <p className="text-xs text-slate-500">
              URL-friendly version of the name. Must be unique.
            </p>
            {errors.slug && (
              <p className="text-sm text-red-600" role="alert">
                {errors.slug.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Brief description of this category"
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  className="w-20 h-10 p-1 cursor-pointer"
                  {...register("color")}
                />
                <Input
                  type="text"
                  placeholder="#3B82F6"
                  className="flex-1"
                  {...register("color")}
                />
              </div>
              {errors.color && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.color.message}
                </p>
              )}
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="edit-sortOrder">Sort Order</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                min="0"
                placeholder="0"
                {...register("sortOrder", { valueAsNumber: true })}
              />
              {errors.sortOrder && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.sortOrder.message}
                </p>
              )}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label htmlFor="edit-icon">Icon Name</Label>
            <Input
              id="edit-icon"
              placeholder="e.g., laptop, smartphone"
              {...register("icon")}
            />
            <p className="text-xs text-slate-500">
              Icon name from your icon library (optional)
            </p>
            {errors.icon && (
              <p className="text-sm text-red-600" role="alert">
                {errors.icon.message}
              </p>
            )}
          </div>

          {/* Category Image */}
          <div className="space-y-2">
            <Label>Category Image</Label>
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value || null}
                  onChange={(url) => field.onChange(url || "")}
                  folder="categories"
                  disabled={isSubmitting}
                  aspectRatio="square"
                  maxSizeMB={5}
                />
              )}
            />
            {errors.imageUrl && (
              <p className="text-sm text-red-600" role="alert">
                {errors.imageUrl.message}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Upload a category image (optional). Recommended: Square image, max 5MB.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) =>
                setValue("isActive", checked as boolean)
              }
            />
            <Label
              htmlFor="edit-isActive"
              className="text-sm font-normal cursor-pointer"
            >
              Active (category will be visible to users)
            </Label>
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
                "Update Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
