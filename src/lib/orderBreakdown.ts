// Single shared source for "who paid/receives what" on a placed order.
// Used by both the buyer/vendor chat (MessagesPage) and the admin chat (AdminMessages)
// so the numbers shown to every role are derived the same way and never drift apart.

export interface OrderBreakdown {
  unitPrice: number;
  quantity: number;
  baseAmount: number;
  discountPercentage: number;
  discountAmount: number;
  gst: number;
  platformCommission: number;
  buyerTotalPaid: number;
  vendorNetPayout: number;
  payerRoute: string;
  isSettled: boolean;
}

export function computeOrderBreakdown(rfq: any): OrderBreakdown {
  const responseDetails = typeof rfq.response_details === 'string'
    ? JSON.parse(rfq.response_details)
    : (rfq.response_details || {});

  const paymentBreakdown = responseDetails.payment_breakdown || {};
  const commissionBreakdown = responseDetails.commission_breakdown || {};

  const quantity = Number(rfq.quantity) || 0;
  // Same price source the backend uses to actually settle the vendor's payout
  // (billingService.executeSettlement) — NOT the discounted price, if a coupon was applied.
  const unitPrice = Number(responseDetails.price) || Number(rfq.target_price) || 0;
  const baseAmount = unitPrice * quantity;

  const discountPercentage = Number(paymentBreakdown.discountPercentage) || 0;
  const discountAmount = Number(paymentBreakdown.discountAmount) || 0;

  // What the buyer was actually asked to pay (and did pay), if this order went through
  // Admin's payment-request statement. Falls back to a plain base+GST estimate for orders
  // that skipped that step (e.g. a direct vendor-quote accept).
  const buyerTotalPaid = paymentBreakdown.finalAmount != null
    ? Number(paymentBreakdown.finalAmount)
    : baseAmount + baseAmount * 0.18;

  const gst = paymentBreakdown.gst != null ? Number(paymentBreakdown.gst) : baseAmount * 0.18;

  const platformCommission = Number(commissionBreakdown.totalCommission) || 0;
  const payerRoute = commissionBreakdown.payerRoute || 'seller_deduct';

  // Vendor's payout is base amount minus commission (when the seller pays it) — matches
  // what billingService.executeSettlement actually credits to the vendor wallet.
  const vendorNetPayout = payerRoute === 'buyer_add' ? baseAmount : baseAmount - platformCommission;

  return {
    unitPrice,
    quantity,
    baseAmount,
    discountPercentage,
    discountAmount,
    gst,
    platformCommission,
    buyerTotalPaid,
    vendorNetPayout,
    payerRoute,
    isSettled: !!rfq.invoice_released,
  };
}
