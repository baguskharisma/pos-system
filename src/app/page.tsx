"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, ShoppingCart, Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { CartDrawer } from "@/components/cart/CartDrawer";

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  icon?: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    color: string | null;
  };
  trackInventory: boolean;
  quantity: number;
}

export default function CustomerMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Cart store
  const { addItem, updateQuantity, getItem, getItemCount, getSubtotal, openCart } =
    useCartStore();

  const cartItemCount = getItemCount();
  const cartTotal = getSubtotal();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/public/categories?includeProductCount=true");
        const data = await response.json();
        if (data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(
    async (pageNum: number, reset = false) => {
      if (loading) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "12",
        });

        if (selectedCategory && selectedCategory !== "all") {
          params.append("categoryId", selectedCategory);
        }

        if (searchQuery) {
          params.append("search", searchQuery);
        }

        const response = await fetch(`/api/public/products?${params}`);
        const data = await response.json();

        if (data.data) {
          setProducts((prev) => (reset ? data.data : [...prev, ...data.data]));
          setHasMore(data.pagination.hasMore);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, searchQuery, loading]
  );

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [selectedCategory, searchQuery]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 500 &&
        hasMore &&
        !loading
      ) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading]);

  // Load more on page change
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, false);
    }
  }, [page]);

  // Helper to get cart item quantity
  const getCartItemQuantity = (productId: string) => {
    const item = getItem(productId);
    return item ? item.quantity : 0;
  };

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      trackInventory: product.trackInventory,
      quantity: product.quantity,
    });
  };

  // Handle quantity update
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cart Drawer */}
      <CartDrawer />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-slate-900">RAVORA</div>
              <div className="hidden sm:block text-sm text-slate-500">
                Coffee
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Cari menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Cart Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[73px] z-40 bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="whitespace-nowrap"
            >
              Semua
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
                style={
                  selectedCategory === category.id && category.color
                    ? { backgroundColor: category.color }
                    : {}
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const quantity = getCartItemQuantity(product.id);
            const isOutOfStock =
              product.trackInventory && product.quantity <= 0;

            return (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-slate-200">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
                  {product.isFeatured && (
                    <Badge className="absolute top-2 left-2">Featured</Badge>
                  )}
                  {isOutOfStock && (
                    <Badge
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      Habis
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Category Badge */}
                  <div className="mb-2">
                    <Badge
                      variant="outline"
                      style={
                        product.category.color
                          ? { borderColor: product.category.color }
                          : {}
                      }
                    >
                      {product.category.name}
                    </Badge>
                  </div>

                  {/* Product Name */}
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                    {product.name}
                  </h3>

                  {/* Product Description */}
                  {product.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-slate-900">
                        Rp {Number(product.price).toLocaleString("id-ID")}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-slate-400 line-through">
                          Rp{" "}
                          {Number(product.compareAtPrice).toLocaleString(
                            "id-ID"
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart */}
                  {quantity === 0 ? (
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className="w-full"
                    >
                      {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleUpdateQuantity(product.id, quantity - 1)
                        }
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="flex-1 text-center font-semibold">
                        {quantity}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleUpdateQuantity(product.id, quantity + 1)
                        }
                        disabled={
                          product.trackInventory &&
                          quantity >= product.quantity
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        )}

        {/* No results */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">Tidak ada produk ditemukan</p>
          </div>
        )}
      </main>

      {/* Floating Cart Summary */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">
                  {cartItemCount} item
                </div>
                <div className="text-xl font-bold">
                  Rp {cartTotal.toLocaleString("id-ID")}
                </div>
              </div>
              <Button size="lg" className="px-8" onClick={openCart}>
                Lihat Keranjang
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
