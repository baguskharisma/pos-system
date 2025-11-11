"use client";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface OrderSuccessModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: string;
  onClose: () => void;
}

export function OrderSuccessModal({
  isOpen,
  orderId,
  orderNumber,
  onClose,
}: OrderSuccessModalProps) {
  const router = useRouter();

  const handleContinueShopping = () => {
    onClose();
    router.push("/");
  };

  const handleViewOrder = () => {
    onClose();
    router.push(`/order/${orderId}`);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Pesanan Berhasil!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              Pesanan Anda telah berhasil dibuat dengan nomor pesanan:
            </p>
            <p className="text-lg font-bold text-slate-900">{orderNumber}</p>
            <p className="text-sm text-slate-600 mt-4">
              Anda dapat melacak status pesanan Anda secara real-time. Silakan
              tunjukkan nomor pesanan ini kepada kasir untuk melanjutkan pembayaran.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleViewOrder} className="w-full">
            Lacak Pesanan
          </Button>
          <Button
            onClick={handleContinueShopping}
            variant="outline"
            className="w-full"
          >
            Lanjut Belanja
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
