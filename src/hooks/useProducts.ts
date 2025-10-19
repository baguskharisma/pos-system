import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ProductListResponse,
  ProductResponse,
  CreateProductData,
  UpdateProductData,
  ProductQueryParams,
  ToggleAvailabilityData,
} from "@/types/product";

/**
 * Fetch products list with pagination and filters
 */
export function useProducts(params: ProductQueryParams = {}) {
  return useQuery<ProductListResponse>({
    queryKey: ["products", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.search) searchParams.set("search", params.search);
      if (params.categoryId) searchParams.set("categoryId", params.categoryId);
      if (params.isAvailable !== undefined)
        searchParams.set("isAvailable", params.isAvailable.toString());
      if (params.isFeatured !== undefined)
        searchParams.set("isFeatured", params.isFeatured.toString());
      if (params.trackInventory !== undefined)
        searchParams.set("trackInventory", params.trackInventory.toString());
      if (params.minPrice !== undefined)
        searchParams.set("minPrice", params.minPrice.toString());
      if (params.maxPrice !== undefined)
        searchParams.set("maxPrice", params.maxPrice.toString());
      if (params.tags && params.tags.length > 0)
        searchParams.set("tags", params.tags.join(","));
      if (params.lowStock !== undefined)
        searchParams.set("lowStock", params.lowStock.toString());
      if (params.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

      const response = await fetch(`/api/products?${searchParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch products");
      }

      return response.json();
    },
  });
}

/**
 * Fetch a single product by ID
 */
export function useProduct(id: string | null) {
  return useQuery<ProductResponse>({
    queryKey: ["products", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");

      const response = await fetch(`/api/products/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch product");
      }

      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * Create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<ProductResponse, Error, CreateProductData>({
    mutationFn: async (data) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create product");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created", {
        description: `${data.data.name} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast.error("Failed to create product", {
        description: error.message,
      });
    },
  });
}

/**
 * Update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductResponse,
    Error,
    { id: string; data: UpdateProductData }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated", {
        description: `${data.data.name} has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast.error("Failed to update product", {
        description: error.message,
      });
    },
  });
}

/**
 * Delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted", {
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast.error("Failed to delete product", {
        description: error.message,
      });
    },
  });
}

/**
 * Toggle product availability
 */
export function useToggleProductAvailability() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductResponse,
    Error,
    { id: string; data: ToggleAvailabilityData }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/products/${id}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle product availability");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(data.message || "Product availability updated");
    },
    onError: (error) => {
      toast.error("Failed to update product availability", {
        description: error.message,
      });
    },
  });
}

/**
 * Bulk update product availability
 */
export function useBulkUpdateProductAvailability() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { productIds: string[]; isAvailable: boolean }
  >({
    mutationFn: async ({ productIds, isAvailable }) => {
      // Execute all updates in parallel
      const promises = productIds.map((id) =>
        fetch(`/api/products/${id}/availability`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAvailable }),
        })
      );

      const results = await Promise.allSettled(promises);
      const failures = results.filter((r) => r.status === "rejected");

      if (failures.length > 0) {
        throw new Error(
          `Failed to update ${failures.length} product(s). Please try again.`
        );
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Products updated", {
        description: `${variables.productIds.length} product(s) have been ${variables.isAvailable ? "enabled" : "disabled"}.`,
      });
    },
    onError: (error) => {
      toast.error("Bulk update failed", {
        description: error.message,
      });
    },
  });
}
