"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { CartItem } from "./CartItem";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, closeCart, clearCart, getItemCount, getSubtotal } =
    useCartStore();

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  // const tax = subtotal * 0.1; // 10% tax - DISABLED FOR CUSTOMER INTERFACE
  const tax = 0; // Tax disabled for customer interface
  const total = subtotal + tax;

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Keranjang Belanja
              </SheetTitle>
              <SheetDescription className="mt-1">
                {itemCount} item dalam keranjang
              </SheetDescription>
            </div>

            {items.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Kosongkan Keranjang?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Semua item akan dihapus dari keranjang. Tindakan ini tidak
                      dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearCart}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Kosongkan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Keranjang Kosong
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Belum ada produk yang ditambahkan ke keranjang
              </p>
              <Button onClick={closeCart}>Mulai Belanja</Button>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary & Checkout */}
        {items.length > 0 && (
          <div className="border-t px-6 py-4 bg-slate-50">
            {/* Summary Details */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal ({itemCount} item)</span>
                <span className="font-medium">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Tax disabled for customer interface */}
              {/* <div className="flex justify-between text-sm">
                <span className="text-slate-600">Pajak (10%)</span>
                <span className="font-medium">
                  Rp {tax.toLocaleString("id-ID")}
                </span>
              </div> */}

              <Separator className="my-2" />

              <div className="flex justify-between">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg text-slate-900">
                  Rp {total.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button className="w-full" size="lg" onClick={handleCheckout}>
              Lanjut ke Pembayaran
            </Button>

            {/* Continue Shopping */}
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={closeCart}
            >
              Lanjut Belanja
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
