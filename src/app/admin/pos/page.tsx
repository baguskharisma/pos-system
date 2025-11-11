"use client";

import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, X, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCategoryButtons } from "@/components/pos/QuickCategoryButtons";
import { POSSearchBar } from "@/components/pos/POSSearchBar";
import { POSProductGrid } from "@/components/pos/POSProductGrid";
import { CurrentOrder } from "@/components/pos/CurrentOrder";
import { OrderSummary } from "@/components/pos/OrderSummary";
import { CustomerInfoForm } from "@/components/pos/CustomerInfoForm";
import { OrderTypeSelector } from "@/components/pos/OrderTypeSelector";
import { HeldOrdersModal } from "@/components/pos/HeldOrdersModal";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/product-utils";
import { toast } from "sonner";
import { generateOrderNumber } from "@/lib/order-number";
import type { POSProduct, POSCartItem, POSCart, POSCategory, HeldOrder, OrderType, CustomerInfo, PaymentInfo, CompletedOrder } from "@/types/pos";

export default function POSPage() {
  // State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<POSCart>({
    items: [],
    subtotal: 0,
    taxRate: 0.11, // 11% tax
    taxAmount: 0,
    taxEnabled: true,
    discountAmount: 0,
    discountType: "PERCENTAGE",
    discountPercentage: 0,
    total: 0,
    orderType: "DINE_IN",
    customerInfo: {},
  });
  const [showCartModal, setShowCartModal] = useState(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  // Load held orders and completed orders from localStorage on mount
  useEffect(() => {
    const savedHeldOrders = localStorage.getItem("heldOrders");
    const savedCompletedOrders = localStorage.getItem("completedOrders");

    if (savedHeldOrders) {
      try {
        setHeldOrders(JSON.parse(savedHeldOrders));
      } catch (error) {
        console.error("Error loading held orders:", error);
      }
    }

    if (savedCompletedOrders) {
      try {
        setCompletedOrders(JSON.parse(savedCompletedOrders));
      } catch (error) {
        console.error("Error loading completed orders:", error);
      }
    }
  }, []);

  // Save held orders to localStorage whenever they change
  useEffect(() => {
    if (heldOrders.length >= 0) {
      localStorage.setItem("heldOrders", JSON.stringify(heldOrders));
    }
  }, [heldOrders]);

  // Save completed orders to localStorage whenever they change
  useEffect(() => {
    if (completedOrders.length >= 0) {
      localStorage.setItem("completedOrders", JSON.stringify(completedOrders));
    }
  }, [completedOrders]);

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
    const taxAmount = cart.taxEnabled ? afterDiscount * cart.taxRate : 0;
    const total = afterDiscount + taxAmount;

    setCart((prev) => ({
      ...prev,
      subtotal,
      discountAmount,
      taxAmount,
      total,
    }));
  }, [cart.items, cart.discountType, cart.discountPercentage, cart.discountAmount, cart.taxRate, cart.taxEnabled]);

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

  const updateNotes = (productId: string, notes: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, notes } : item
      ),
    }));
  };

  const clearCart = () => {
    setCart({
      items: [],
      subtotal: 0,
      taxRate: 0.11,
      taxAmount: 0,
      taxEnabled: true,
      discountAmount: 0,
      discountType: "PERCENTAGE",
      discountPercentage: 0,
      total: 0,
      orderType: "DINE_IN",
      customerInfo: {},
    });
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

  const handleToggleTax = (enabled: boolean) => {
    setCart((prev) => ({
      ...prev,
      taxEnabled: enabled,
    }));
  };

  const handleOrderTypeChange = (orderType: OrderType) => {
    setCart((prev) => ({
      ...prev,
      orderType,
      customerInfo: {}, // Reset customer info when changing order type
    }));
  };

  const handleCustomerInfoChange = (customerInfo: CustomerInfo) => {
    setCart((prev) => ({
      ...prev,
      customerInfo,
    }));
  };

  const handleHoldOrder = () => {
    if (cart.items.length === 0) {
      toast.error("Cannot hold empty order");
      return;
    }

    // Generate order number for held order
    const orderNumber = generateOrderNumber();

    const newHeldOrder: HeldOrder = {
      id: `held-${Date.now()}`,
      cart: { ...cart },
      heldAt: new Date().toISOString(),
      orderNumber: orderNumber,
    };

    setHeldOrders((prev) => [newHeldOrder, ...prev]);
    clearCart();
    toast.success(`Order ${orderNumber} held successfully`);
  };

  const handleRecallOrder = (order: HeldOrder) => {
    if (cart.items.length > 0) {
      // Ask user if they want to replace current cart
      const shouldReplace = window.confirm(
        "Current cart has items. Do you want to replace it with the held order?"
      );
      if (!shouldReplace) return;
    }

    setCart(order.cart);
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    toast.success(`Order ${order.orderNumber} recalled`);
  };

  const handleDeleteHeldOrder = (orderId: string) => {
    const order = heldOrders.find((o) => o.id === orderId);
    setHeldOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast.success(`Order ${order?.orderNumber} deleted`);
  };

  const handleCheckout = () => {
    // Validation
    if (cart.items.length === 0) {
      toast.error("Cannot checkout with empty cart");
      return;
    }

    // Validate customer info for delivery orders
    if (cart.orderType === "DELIVERY") {
      if (!cart.customerInfo.name || !cart.customerInfo.phone || !cart.customerInfo.address) {
        toast.error("Customer information required for delivery", {
          description: "Please fill in name, phone, and address",
        });
        return;
      }
    }

    setShowPaymentModal(true);
  };

  const handlePaymentComplete = (payment: PaymentInfo, orderNumber: string) => {
    // Create completed order (order number already generated and saved in PaymentModal)
    const completedOrder: CompletedOrder = {
      id: `order-${Date.now()}`,
      orderNumber: orderNumber,
      cart: { ...cart },
      payment,
      completedAt: new Date().toISOString(),
    };

    // Save to completed orders
    setCompletedOrders((prev) => [completedOrder, ...prev]);

    // Clear cart
    clearCart();

    // Close modals
    setShowPaymentModal(false);

    toast.success(`Order ${orderNumber} completed successfully!`, {
      description: `Payment: ${payment.method} - ${formatCurrency(cart.total + payment.tipAmount)}`,
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 relative"
              onClick={() => setShowHeldOrdersModal(true)}
            >
              <Clock className="h-4 w-4" />
              {heldOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {heldOrders.length}
                </span>
              )}
            </Button>
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
            {/* Order Type and Customer Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <OrderTypeSelector
                selected={cart.orderType}
                onChange={handleOrderTypeChange}
              />
              <div className="mt-4 pt-4 border-t border-slate-200">
                <CustomerInfoForm
                  customerInfo={cart.customerInfo}
                  orderType={cart.orderType}
                  onChange={handleCustomerInfoChange}
                />
              </div>
            </div>

            {/* Current Order */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 max-h-[calc(100vh-500px)] overflow-y-auto">
              <CurrentOrder
                items={cart.items}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onUpdateNotes={updateNotes}
                onClearCart={clearCart}
              />
            </div>

            {/* Order Summary and Actions */}
            <OrderSummary
              cart={cart}
              onUpdateDiscount={handleDiscount}
              onToggleTax={handleToggleTax}
              onCheckout={handleCheckout}
            />

            {/* Hold Order Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleHoldOrder}
                disabled={cart.items.length === 0}
              >
                <Save className="h-4 w-4" />
                Hold Order
              </Button>
              <Button
                variant="outline"
                className="gap-2 relative"
                onClick={() => setShowHeldOrdersModal(true)}
              >
                <Clock className="h-4 w-4" />
                Held ({heldOrders.length})
              </Button>
            </div>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Order Type and Customer Info */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <OrderTypeSelector
                    selected={cart.orderType}
                    onChange={handleOrderTypeChange}
                  />
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <CustomerInfoForm
                      customerInfo={cart.customerInfo}
                      orderType={cart.orderType}
                      onChange={handleCustomerInfoChange}
                    />
                  </div>
                </div>

                {/* Current Order Items */}
                <CurrentOrder
                  items={cart.items}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeItem}
                  onUpdateNotes={updateNotes}
                  onClearCart={clearCart}
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                {/* Hold Order Button */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    handleHoldOrder();
                    setShowCartModal(false);
                  }}
                  disabled={cart.items.length === 0}
                >
                  <Save className="h-4 w-4" />
                  Hold Order
                </Button>

                {/* Order Summary */}
                <OrderSummary
                  cart={cart}
                  onUpdateDiscount={handleDiscount}
                  onToggleTax={handleToggleTax}
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

      {/* Held Orders Modal */}
      <HeldOrdersModal
        isOpen={showHeldOrdersModal}
        onClose={() => setShowHeldOrdersModal(false)}
        heldOrders={heldOrders}
        onRecallOrder={handleRecallOrder}
        onDeleteHeldOrder={handleDeleteHeldOrder}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={cart}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}
