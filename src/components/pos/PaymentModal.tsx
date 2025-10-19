"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Wallet,
  Banknote,
  Building2,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptPreview } from "./ReceiptPreview";
import { formatCurrency } from "@/lib/product-utils";
import { toast } from "sonner";
import type { POSCart, PaymentMethod, PaymentInfo } from "@/types/pos";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: POSCart;
  orderNumber: number;
  onPaymentComplete: (payment: PaymentInfo) => void;
}

const PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
  color: string;
}> = [
  {
    value: "CASH",
    label: "Cash",
    icon: Banknote,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    value: "CARD",
    label: "Card",
    icon: CreditCard,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    value: "E_WALLET",
    label: "E-Wallet",
    icon: Wallet,
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Building2,
    color: "bg-orange-500 hover:bg-orange-600",
  },
];

export function PaymentModal({
  isOpen,
  onClose,
  cart,
  orderNumber,
  onPaymentComplete,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CASH");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);

  const totalWithTip = cart.total + tipAmount;
  const tenderedAmount = parseFloat(amountTendered) || 0;
  const change = selectedMethod === "CASH" ? Math.max(0, tenderedAmount - totalWithTip) : 0;

  // Quick amount shortcuts
  const quickAmounts = [
    10000, 20000, 50000, 100000, 200000, 500000,
  ];

  // Tip presets (percentage)
  const tipPresets = [0, 5, 10, 15, 20];

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod("CASH");
      setAmountTendered("");
      setTipAmount(0);
      setShowReceipt(false);
    }
  }, [isOpen]);

  // Auto-set exact amount for non-cash methods
  useEffect(() => {
    if (selectedMethod !== "CASH") {
      setAmountTendered(totalWithTip.toString());
    }
  }, [selectedMethod, totalWithTip]);

  const handleQuickAmount = (amount: number) => {
    setAmountTendered(amount.toString());
  };

  const handleExactAmount = () => {
    setAmountTendered(totalWithTip.toString());
  };

  const handleAddAmount = (amount: number) => {
    const current = parseFloat(amountTendered) || 0;
    setAmountTendered((current + amount).toString());
  };

  const handleTipPreset = (percentage: number) => {
    const tip = (cart.total * percentage) / 100;
    setTipAmount(tip);
  };

  const handleCustomTip = (value: string) => {
    const tip = parseFloat(value) || 0;
    setTipAmount(Math.max(0, tip));
  };

  const handlePayment = () => {
    // Validation
    if (selectedMethod === "CASH" && tenderedAmount < totalWithTip) {
      toast.error("Insufficient amount", {
        description: `Need ${formatCurrency(totalWithTip - tenderedAmount)} more`,
      });
      return;
    }

    setShowReceipt(true);
  };

  const handleCompletePayment = () => {
    const payment: PaymentInfo = {
      method: selectedMethod,
      amountTendered: tenderedAmount,
      tipAmount,
      change,
    };

    onPaymentComplete(payment);
    toast.success("Payment completed successfully!");
    onClose();
  };

  const handlePrintReceipt = () => {
    toast.info("Printing receipt...");
    // TODO: Implement actual print functionality
  };

  const handleShareReceipt = () => {
    toast.info("Sharing receipt...");
    // TODO: Implement share functionality (WhatsApp, Email, etc.)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {!showReceipt ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Process Payment - Order #{orderNumber}
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Payment Details */}
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedMethod === method.value;

                      return (
                        <Button
                          key={method.value}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => setSelectedMethod(method.value)}
                          className={`flex flex-col items-center gap-2 h-auto py-4 ${
                            isSelected ? method.color : ""
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-sm font-medium">{method.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Tip Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Add Tip (Optional)</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {tipPresets.map((percentage) => (
                      <Button
                        key={percentage}
                        variant={
                          Math.abs(tipAmount - (cart.total * percentage) / 100) < 0.01
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleTipPreset(percentage)}
                        className="text-xs"
                      >
                        {percentage}%
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Custom tip amount"
                      value={tipAmount || ""}
                      onChange={(e) => handleCustomTip(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  {tipAmount > 0 && (
                    <p className="text-sm text-green-600">
                      Tip: {formatCurrency(tipAmount)}
                    </p>
                  )}
                </div>

                {/* Amount Tendered - Only for CASH */}
                {selectedMethod === "CASH" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Amount Tendered</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      className="text-lg font-semibold"
                    />

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAmount(amount)}
                          className="text-xs"
                        >
                          {formatCurrency(amount)}
                        </Button>
                      ))}
                    </div>

                    {/* Exact & Add Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExactAmount}
                      >
                        Exact Amount
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAmount(10000)}
                      >
                        +10,000
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Order Summary */}
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-slate-900">Order Summary</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="text-slate-900">{formatCurrency(cart.subtotal)}</span>
                    </div>

                    {cart.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(cart.discountAmount)}</span>
                      </div>
                    )}

                    {cart.taxEnabled && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Tax ({(cart.taxRate * 100).toFixed(0)}%):
                        </span>
                        <span className="text-slate-900">{formatCurrency(cart.taxAmount)}</span>
                      </div>
                    )}

                    {tipAmount > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Tip:</span>
                        <span>{formatCurrency(tipAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                      <span className="text-slate-900">Total:</span>
                      <span className="text-slate-900">{formatCurrency(totalWithTip)}</span>
                    </div>
                  </div>

                  {/* Cash Drawer Info */}
                  {selectedMethod === "CASH" && (
                    <div className="pt-3 border-t border-slate-300 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Amount Tendered:</span>
                        <span className="font-semibold text-slate-900">
                          {tenderedAmount > 0 ? formatCurrency(tenderedAmount) : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-slate-600">Change:</span>
                        <span
                          className={`font-bold ${
                            change > 0 ? "text-green-600" : "text-slate-900"
                          }`}
                        >
                          {formatCurrency(change)}
                        </span>
                      </div>

                      {tenderedAmount > 0 && tenderedAmount < totalWithTip && (
                        <p className="text-sm text-red-600">
                          Insufficient amount! Need {formatCurrency(totalWithTip - tenderedAmount)} more
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Item Count */}
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-900">
                  <p>
                    <span className="font-semibold">{cart.items.length}</span> item
                    {cart.items.length !== 1 ? "s" : ""} in this order
                  </p>
                </div>
              </div>
            </div>

            {/* Process Payment Button */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                disabled={
                  selectedMethod === "CASH" &&
                  (tenderedAmount === 0 || tenderedAmount < totalWithTip)
                }
              >
                <CheckCircle2 className="h-5 w-5" />
                Process Payment
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                Payment Successful!
              </DialogTitle>
            </DialogHeader>

            <ReceiptPreview
              orderNumber={orderNumber}
              cart={cart}
              payment={{
                method: selectedMethod,
                amountTendered: tenderedAmount,
                tipAmount,
                change,
              }}
              onPrint={handlePrintReceipt}
              onShare={handleShareReceipt}
            />

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleCompletePayment}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Complete & New Order
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
