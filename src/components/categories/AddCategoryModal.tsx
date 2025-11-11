"use client";

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
import { createCategorySchema } from "@/lib/validations/categories";
import { useCreateCategory } from "@/hooks/useCategories";
import type { CreateCategoryData } from "@/types/category";

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddCategoryModal({ open, onClose }: AddCategoryModalProps) {
  const createCategory = useCreateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    control,
  } = useForm<CreateCategoryData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      color: "#3B82F6",
      icon: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setValue("slug", slug);
  };

  const onSubmit = async (data: CreateCategoryData) => {
    try {
      await createCategory.mutateAsync(data);
      reset();
      onClose();
    } catch (_error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new category for your products. All fields marked with *
            are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Electronics"
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

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              placeholder="electronics"
              {...register("slug")}
            />
            <p className="text-xs text-slate-500">
              URL-friendly version of the name. Auto-generated from name.
            </p>
            {errors.slug && (
              <p className="text-sm text-red-600" role="alert">
                {errors.slug.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
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
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
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
            <Label htmlFor="icon">Icon Name</Label>
            <Input
              id="icon"
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
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) =>
                setValue("isActive", checked as boolean)
              }
            />
            <Label
              htmlFor="isActive"
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
                  Creating...
                </>
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
