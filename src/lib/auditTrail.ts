// Turns the raw chat message history for an RFQ (already privacy-filtered server-side,
// identically to what the chat UI shows) into a clean, readable audit trail entry list.
// One shared formatter for buyer/vendor/admin so the three views never drift apart.

export interface AuditEntry {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}

function money(v: any): string {
  const n = Number(v);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—';
}

const TYPE_HANDLERS: Record<string, (m: any) => { title: string; description: string; tone: AuditEntry['tone'] } | null> = {
  rfq_specs: (m) => ({
    title: 'RFQ Submitted',
    description: `Sourcing request for ${m.product_name || 'the product'} — ${m.quantity || ''} ${m.unit || 'units'}${m.target_price ? ` @ ${money(m.target_price)}/unit` : ''}.`,
    tone: 'neutral',
  }),
  vendor_quote: (m) => ({
    title: 'Vendor Quote Submitted',
    description: `Quoted ${money(m.price)}/unit, lead time ${m.lead_time || 'N/A'} day(s).`,
    tone: 'neutral',
  }),
  rfq_terms_modified: (m) => ({
    title: m.source === 'admin' ? 'Admin Modified Terms' : m.source === 'buyer' ? 'Buyer Countered' : 'Seller Countered',
    description: `Proposed ${money(m.price)} for ${m.quantity} unit(s).${m.notes ? ` "${m.notes}"` : ''}`,
    tone: 'warning',
  }),
  rfq_terms_confirmed: (m) => ({
    title: 'Terms Confirmed',
    description: `Buyer confirmed ${money(m.price)} for ${m.quantity} unit(s).`,
    tone: 'success',
  }),
  rfq_forwarded_to_seller: (m) => ({
    title: 'Forwarded to Seller',
    description: `Finalized terms of ${money(m.price)} for ${m.quantity} unit(s) sent to the seller for review.`,
    tone: 'neutral',
  }),
  seller_counter_approved: (m) => ({
    title: 'Seller Counter Approved',
    description: `Admin approved the seller's counter of ${money(m.price)} for ${m.quantity} unit(s).`,
    tone: 'success',
  }),
  rfq_seller_accepted: (m) => ({
    title: 'Seller Accepted Terms',
    description: `Seller accepted ${money(m.price)} for ${m.quantity} unit(s). Awaiting payment statement.`,
    tone: 'success',
  }),
  rfq_payment_request: (m) => ({
    title: 'Payment Statement Sent',
    description: `Total payable ${money(m.breakdown?.finalAmount)}${m.coupon_code ? ` — coupon ${m.coupon_code} applied` : ''}.`,
    tone: 'neutral',
  }),
  rfq_payment_submitted: (m) => ({
    title: 'Payment Reference Submitted',
    description: `Buyer submitted transaction reference "${m.reference}". Pending verification.`,
    tone: 'warning',
  }),
  rfq_payment_verified: () => ({
    title: 'Payment Verified',
    description: `Admin verified the payment. Order elevated to the seller for processing.`,
    tone: 'success',
  }),
  order_group_created: () => ({
    title: 'Order Group Created',
    description: `A dedicated fulfillment thread was created for this order.`,
    tone: 'neutral',
  }),
  order_placed: (m) => ({
    title: 'Order Placed',
    description: `${money(m.amount)} for ${m.quantity} ${m.unit || 'unit(s)'}.`,
    tone: 'success',
  }),
  order_confirmed: () => ({
    title: 'Order Confirmed by Seller',
    description: `Production/preparation started.`,
    tone: 'success',
  }),
  order_shipped: (m) => ({
    title: 'Shipped',
    description: `Carrier: ${m.carrier || 'Standard'}, AWB/Tracking: ${m.awb || 'N/A'}.`,
    tone: 'neutral',
  }),
  delivery_prompt: () => ({
    title: 'Marked as Delivered',
    description: `Seller marked the shipment delivered. Awaiting buyer confirmation.`,
    tone: 'warning',
  }),
  delivery_completed: () => ({
    title: 'Delivery Confirmed — Complete',
    description: `Buyer confirmed receipt. Payment release to the vendor is pending Admin settlement.`,
    tone: 'success',
  }),
  payment_released: (m) => ({
    title: 'Payment Released to Vendor',
    description: `Admin released ${money(m.amount)} (platform commission ${money(m.commission)}).`,
    tone: 'success',
  }),
  dispute_opened: (m) => ({
    title: 'Dispute Opened',
    description: `"${m.notes || 'Cargo delays/issues'}" — Admin intervention requested.`,
    tone: 'danger',
  }),
  cancellation_requested: (m) => ({
    title: `Cancellation Requested (${m.requested_by === 'buyer' ? 'Buyer' : 'Seller'})`,
    description: m.reason ? `"${m.reason}"` : 'No reason provided.',
    tone: 'warning',
  }),
  cancellation_rejected: (m) => ({
    title: 'Cancellation Request Rejected',
    description: m.notes ? `"${m.notes}"` : 'Order remains active.',
    tone: 'neutral',
  }),
  order_cancelled: (m) => ({
    title: 'Order Cancelled',
    description: m.fee > 0 ? `Cancellation fee of ${money(m.fee)} charged to ${m.liable_party === 'buyer' ? 'buyer' : 'seller'}.` : 'No cancellation fee applied.',
    tone: 'danger',
  }),
  direct_connection_request: (m) => ({
    title: 'Direct Connection Requested',
    description: `Requested by ${m.requestedBy === 'buyer' ? 'buyer' : 'seller'}.${m.approved ? ' Approved by Admin.' : ' Awaiting Admin review.'}`,
    tone: m.approved ? 'success' : 'neutral',
  }),
  negotiated_offer: (m) => ({
    title: 'Special Offer Generated',
    description: `${money(m.negotiated_price)}/unit for ${m.quantity} unit(s)${m.discount_percentage ? ` — ${m.discount_percentage}% off` : ''}.`,
    tone: 'neutral',
  }),
};

export function buildAuditTrail(messages: any[]): AuditEntry[] {
  const entries: AuditEntry[] = [];
  for (const msg of messages) {
    const meta = msg.metadata || {};
    const handler = meta.type ? TYPE_HANDLERS[meta.type] : null;
    if (!handler) continue;
    const built = handler(meta);
    if (!built) continue;
    entries.push({
      id: msg.id,
      timestamp: msg.created_at,
      title: built.title,
      description: built.description,
      tone: built.tone,
    });
  }
  return entries;
}
