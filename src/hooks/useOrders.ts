/**
 * Custom hooks for order management
 * src/hooks/useOrders.ts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Order,
  OrderListResponse,
  OrderResponse,
  OrderQueryParams,
  UpdateOrderStatusData,
  BulkUpdateOrdersData,
} from "@/types/order";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Fetch orders list
export function useOrders(params: OrderQueryParams = {}) {
  return useQuery<OrderListResponse>({
    queryKey: ["orders", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(
        `${API_BASE_URL}/orders?${searchParams.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
  });
}

// Fetch single order
export function useOrder(id: string | null) {
  return useQuery<OrderResponse>({
    queryKey: ["orders", id],
    queryFn: async () => {
      if (!id) throw new Error("Order ID is required");
      const response = await fetch(`${API_BASE_URL}/orders/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOrderStatusData;
    }) => {
      const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update order status");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated successfully", {
        description: `Order #${data.data.orderNumber} is now ${data.data.status}`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update order status", {
        description: error.message,
      });
    },
  });
}

// Bulk update order status
export function useBulkUpdateOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkUpdateOrdersData) => {
      const response = await fetch(`${API_BASE_URL}/orders/bulk/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update orders");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Orders updated successfully", {
        description: `${data.updated} order(s) updated`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update orders", {
        description: error.message,
      });
    },
  });
}

// Cancel order
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel order");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled successfully", {
        description: `Order #${data.data.orderNumber} has been cancelled`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to cancel order", {
        description: error.message,
      });
    },
  });
}

// Delete order
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete order");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete order", {
        description: error.message,
      });
    },
  });
}