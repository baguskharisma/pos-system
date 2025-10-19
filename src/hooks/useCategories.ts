import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Category,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryData,
  UpdateCategoryData,
  CategoryQueryParams,
} from "@/types/category";

/**
 * Fetch categories list with pagination and filters
 */
export function useCategories(params: CategoryQueryParams = {}) {
  return useQuery<CategoryListResponse>({
    queryKey: ["categories", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.search) searchParams.set("search", params.search);
      if (params.isActive !== undefined)
        searchParams.set("isActive", params.isActive.toString());
      if (params.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

      const response = await fetch(`/api/categories?${searchParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch categories");
      }

      return response.json();
    },
  });
}

/**
 * Fetch a single category by ID
 */
export function useCategory(id: string | null) {
  return useQuery<CategoryResponse>({
    queryKey: ["categories", id],
    queryFn: async () => {
      if (!id) throw new Error("Category ID is required");

      const response = await fetch(`/api/categories/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch category");
      }

      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * Create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<CategoryResponse, Error, CreateCategoryData>({
    mutationFn: async (data) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created", {
        description: `${data.data.name} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast.error("Failed to create category", {
        description: error.message,
      });
    },
  });
}

/**
 * Update an existing category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation<
    CategoryResponse,
    Error,
    { id: string; data: UpdateCategoryData }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated", {
        description: `${data.data.name} has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast.error("Failed to update category", {
        description: error.message,
      });
    },
  });
}

/**
 * Delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted", {
        description: "The category has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast.error("Failed to delete category", {
        description: error.message,
      });
    },
  });
}
