// Single shared source for "who paid/receives what" on a placed order.
// Used by both the buyer/vendor chat (MessagesPage) and the admin chat (AdminMessages)
// so the numbers shown to every role are derived the same way and never drift apart.

export interface OrderBreakdown {
  unitPrice: number;
  quantity: number;
  baseAmount: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountLabel: string;
  discountAmount: number;
  gst: number;
  platformCommission: number;
  // What's actually deducted from the VENDOR's own payout — the full commission rate applied
  // to their order value, before any discount-absorption reduction. Different from
  // platformCommission (what the platform itself keeps) whenever the platform or a 50-50 split
  // absorbed some of the discount — showing platformCommission next to baseAmount in a vendor
  // payout breakdown wouldn't reconcile to vendorNetPayout in that case.
  vendorCommissionDeduction: number;
  // Vendor's own share of the discount (0 unless discountAbsorbedBy is 'seller' or 'split') —
  // a second, separate deduction from the vendor's payout beyond commission.
  vendorDiscountShare: number;
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

  // discountType/discountValue is the current shape (from the admin per-quote discount
  // feature); discountPercentage is the older shape some existing orders were saved with.
  const discountType: 'percentage' | 'flat' =
    paymentBreakdown.discountType === 'flat' || commissionBreakdown.discountType === 'flat' ? 'flat' : 'percentage';
  const discountValue = Number(paymentBreakdown.discountValue ?? commissionBreakdown.discountValue ?? paymentBreakdown.discountPercentage) || 0;
  const discountLabel = discountType === 'flat' ? `₹${discountValue} flat` : `${discountValue}%`;
  const discountAmount = Number(paymentBreakdown.discountAmount ?? commissionBreakdown.discountAmount) || 0;

  // What the buyer was actually asked to pay (and did pay), if this order went through
  // Admin's payment-request statement. Falls back to a plain base+GST estimate for orders
  // that skipped that step (e.g. a direct vendor-quote accept).
  const buyerTotalPaid = paymentBreakdown.finalAmount != null
    ? Number(paymentBreakdown.finalAmount)
    : baseAmount + baseAmount * 0.18;

  const gst = paymentBreakdown.gst != null ? Number(paymentBreakdown.gst) : baseAmount * 0.18;

  const platformCommission = Number(commissionBreakdown.totalCommission) || 0;
  const payerRoute = commissionBreakdown.payerRoute || 'seller_deduct';

  // Vendor's real payout — read directly from what convertRfqToOrder actually stored
  // (calculateDiscountedOrder, which properly accounts for discountAbsorbedBy: seller/
  // platform/split). Only orders placed before that field existed fall back to the plain
  // base-minus-commission estimate, which doesn't know about discount absorption at all.
  const vendorNetPayout = commissionBreakdown.vendorNet != null
    ? Number(commissionBreakdown.vendorNet)
    : (payerRoute === 'buyer_add' ? baseAmount : baseAmount - platformCommission);

  const vendorDiscountShare = Number(commissionBreakdown.vendorDiscountShare) || 0;
  // rawCommission (what's really taken off the vendor's own order value) is only present on
  // orders placed after this field existed. Older records fall back to deriving it from
  // baseAmount − vendorNetPayout − vendorDiscountShare, which is guaranteed to reconcile since
  // vendorNetPayout was already computed correctly — it just can't distinguish "commission" from
  // "vendor's discount share" for those older records the way the explicit field can.
  const vendorCommissionDeduction = commissionBreakdown.rawCommission != null
    ? Number(commissionBreakdown.rawCommission)
    : Math.max(0, baseAmount - vendorNetPayout - vendorDiscountShare);

  return {
    unitPrice,
    quantity,
    baseAmount,
    discountType,
    discountValue,
    discountLabel,
    discountAmount,
    gst,
    platformCommission,
    vendorCommissionDeduction,
    vendorDiscountShare,
    buyerTotalPaid,
    vendorNetPayout,
    payerRoute,
    isSettled: !!rfq.invoice_released,
  };
}
