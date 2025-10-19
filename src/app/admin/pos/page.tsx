"use client";

import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCategoryButtons } from "@/components/pos/QuickCategoryButtons";
import { POSSearchBar } from "@/components/pos/POSSearchBar";
import { POSProductGrid } from "@/components/pos/POSProductGrid";
import { CurrentOrder } from "@/components/pos/CurrentOrder";
import { OrderSummary } from "@/components/pos/OrderSummary";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import type { POSProduct, POSCartItem, POSCart, POSCategory } from "@/types/pos";

export default function POSPage() {
  // State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<POSCart>({
    items: [],
    subtotal: 0,
    taxRate: 0.11, // 11% tax
    taxAmount: 0,
    discountAmount: 0,
    discountType: "PERCENTAGE",
    discountPercentage: 0,
    total: 0,
  });
  const [showCartModal, setShowCartModal] = useState(false);

  // Fetch data
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    limit: 100,
    isAvailable: true,
    categoryId: selectedCategoryId || undefined,
    search: searchQuery || undefined,
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories({
    limit: 100,
    isActive: true,
  });

  // Transform products for POS
  const posProducts: POSProduct[] = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      categoryName: product.category?.name || "Uncategorized",
      categoryColor: product.category?.color || null,
      isAvailable: product.isAvailable,
      trackInventory: product.trackInventory,
      quantity: product.quantity,
      taxRate: product.taxRate ? Number(product.taxRate) : null,
    }));
  }, [productsData]);

  // Transform categories for POS
  const posCategories: POSCategory[] = useMemo(() => {
    if (!categoriesData?.data) return [];
    return categoriesData.data.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      productCount: category._count?.products || 0,
    }));
  }, [categoriesData]);

  // Calculate cart totals
  useEffect(() => {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discountAmount = 0;
    if (cart.discountType === "PERCENTAGE" && cart.discountPercentage) {
      discountAmount = (subtotal * cart.discountPercentage) / 100;
    } else if (cart.discountType === "FIXED_AMOUNT") {
      discountAmount = cart.discountAmount;
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * cart.taxRate;
    const total = afterDiscount + taxAmount;

    setCart((prev) => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      total,
    }));
  }, [cart.items, cart.discountType, cart.discountPercentage, cart.discountAmount, cart.taxRate]);

  // Cart actions
  const addToCart = (product: POSProduct) => {
    setCart((prev) => {
      const existingItem = prev.items.find(
        (item) => item.productId === product.id
      );

      if (existingItem) {
        // Check max quantity
        const maxQuantity = product.trackInventory ? product.quantity : undefined;
        if (maxQuantity && existingItem.quantity >= maxQuantity) {
          toast.error("Cannot add more", {
            description: `Only ${maxQuantity} items available in stock`,
          });
          return prev;
        }

        // Update quantity
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        // Add new item
        const newItem: POSCartItem = {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
          maxQuantity: product.trackInventory ? product.quantity : undefined,
        };

        toast.success("Added to cart", {
          description: product.name,
        });

        return {
          ...prev,
          items: [...prev.items, newItem],
        };
      }
    });

    // Show cart modal on mobile
    if (window.innerWidth < 768) {
      setShowCartModal(true);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    }));
  };

  const removeItem = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    setCart((prev) => ({
      ...prev,
      items: [],
      discountAmount: 0,
      discountPercentage: 0,
    }));
    toast.success("Cart cleared");
  };

  const handleDiscount = (
    amount: number,
    type: "PERCENTAGE" | "FIXED_AMOUNT"
  ) => {
    setCart((prev) => ({
      ...prev,
      discountType: type,
      discountPercentage: type === "PERCENTAGE" ? amount : 0,
      discountAmount: type === "FIXED_AMOUNT" ? amount : 0,
    }));
  };

  const handleCheckout = () => {
    // TODO: Implement checkout flow
    toast.success("Proceeding to payment...", {
      description: `Total: Rp ${cart.total.toLocaleString()}`,
    });
  };

  const handleScan = (barcode: string) => {
    const product = posProducts.find((p) => p.sku === barcode);
    if (product) {
      addToCart(product);
      toast.success("Product scanned", {
        description: product.name,
      });
    } else {
      toast.error("Product not found", {
        description: `Barcode: ${barcode}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-slate-900">POS</h1>
          <Button
            variant="default"
            className="gap-2 relative"
            onClick={() => setShowCartModal(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            Cart
            {cart.items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {cart.items.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:gap-6 lg:p-6">
        {/* Products Section */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4 p-4 lg:p-0">
          {/* Desktop Header */}
          <div className="hidden lg:block">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Point of Sale
            </h1>
            <p className="text-slate-600">
              Select products to add to the current order
            </p>
          </div>

          {/* Search Bar */}
          <POSSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onScan={handleScan}
          />

          {/* Category Filters */}
          <QuickCategoryButtons
            categories={posCategories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            isLoading={isLoadingCategories}
          />

          {/* Product Grid */}
          <POSProductGrid
            products={posProducts}
            onAddToCart={addToCart}
            isLoading={isLoadingProducts}
          />
        </div>

        {/* Cart Section - Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <CurrentOrder
                items={cart.items}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
              />
            </div>
            <OrderSummary
              cart={cart}
              onUpdateDiscount={handleDiscount}
              onCheckout={handleCheckout}
            />
          </div>
        </div>

        {/* Cart Modal - Mobile */}
        {showCartModal && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold">Current Order</h2>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <CurrentOrder
                  items={cart.items}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeItem}
                  onClearCart={clearCart}
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <OrderSummary
                  cart={cart}
                  onUpdateDiscount={handleDiscount}
                  onCheckout={() => {
                    setShowCartModal(false);
                    handleCheckout();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
