import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateOrderInput } from "@/lib/validations/orders";

interface CreateOrderResponse {
  data: any;
  message: string;
}

interface OrdersQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  orderType?: string;
  orderSource?: string;
  startDate?: string;
  endDate?: string;
}

interface OrdersResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Hook to fetch orders
 */
export function useOrders(params: OrdersQueryParams = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.status) searchParams.set("status", params.status);
      if (params.orderType) searchParams.set("orderType", params.orderType);
      if (params.orderSource) searchParams.set("orderSource", params.orderSource);
      if (params.startDate) searchParams.set("startDate", params.startDate);
      if (params.endDate) searchParams.set("endDate", params.endDate);

      const response = await fetch(`/api/orders?${searchParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch orders");
      }

      return response.json() as Promise<OrdersResponse>;
    },
  });
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderInput) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log detailed error for debugging
        console.error("Order creation failed:", data);
        const errorMessage = data.details
          ? `${data.error}: ${JSON.stringify(data.details)}`
          : data.error || "Failed to create order";
        throw new Error(errorMessage);
      }

      return data as CreateOrderResponse;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Inventory may have changed

      toast.success(data.message || "Order created successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating order:", error);
      toast.error("Failed to create order", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      cancellationReason,
    }: {
      orderId: string;
      status: string;
      cancellationReason?: string;
    }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, cancellationReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate orders queries
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast.success(data.message || "Order status updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status", {
        description: error.message,
      });
    },
  });
}
