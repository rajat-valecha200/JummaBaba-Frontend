import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Receipt, CheckCircle2, Clock, Wallet, Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';
import { computeOrderBreakdown } from '@/lib/orderBreakdown';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface OrderGroupSummaryPanelProps {
  rfq: any;
  role: 'buyer' | 'vendor' | 'admin';
  onSettled?: () => void;
}

export function OrderGroupSummaryPanel({ rfq, role, onSettled }: OrderGroupSummaryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [dispatchingPayout, setDispatchingPayout] = useState(false);
  // Seeded from the server (vendor_payouts has a row for this order) so the button stays
  // correctly hidden after a page reload — the backend blocks a real double-release regardless,
  // but a stale "unpaid" button reappearing after a refresh would still be confusing.
  const [payoutDispatchedLocally, setPayoutDispatchedLocally] = useState(false);
  const [requestingAdvance, setRequestingAdvance] = useState(false);
  const [advanceRequestedLocally, setAdvanceRequestedLocally] = useState(false);
  const releaseInFlight = useRef(false);
  const payoutInFlight = useRef(false);
  const advanceRequestInFlight = useRef(false);
  const { toast } = useToast();
  if (!rfq) return null;

  const bd = computeOrderBreakdown(rfq);
  const isDelivered = rfq.status === 'completed';
  const settlementLabel = bd.isSettled ? 'Settled' : isDelivered ? 'Pending Settlement' : 'Pending Delivery';

  const headlineLabel = role === 'buyer' ? 'You Paid' : role === 'vendor' ? 'You Will Receive' : 'Order Value';
  const headlineAmount = role === 'buyer' ? bd.buyerTotalPaid : role === 'vendor' ? bd.vendorNetPayout : bd.baseAmount;
  const payoutDispatched = !!rfq.payout_dispatched || payoutDispatchedLocally;

  const handleRelease = async () => {
    // Guard synchronously — a fast double-tap can fire this twice before React re-renders
    // with the button disabled, since setReleasing(true) below only takes effect next render.
    if (releaseInFlight.current) return;
    releaseInFlight.current = true;
    try {
      setReleasing(true);
      const result = await api.rfqs.releasePayment(rfq.id);
      if (result?.alreadySettled) {
        toast({ title: 'Already Released', description: 'This order was already settled — no further action needed.' });
      } else {
        toast({ title: 'Payment Released', description: `${formatPrice(bd.vendorNetPayout)} credited to the vendor's wallet.` });
      }
      onSettled?.();
    } catch (err: any) {
      toast({ title: 'Failed to release payment', description: err.message, variant: 'destructive' });
    } finally {
      releaseInFlight.current = false;
      setReleasing(false);
    }
  };

  const handleRequestAdvance = async () => {
    if (advanceRequestInFlight.current) return;
    advanceRequestInFlight.current = true;
    try {
      setRequestingAdvance(true);
      await api.rfqs.requestAdvanceRelease(rfq.id);
      toast({ title: 'Request sent', description: 'Admin has been notified — they\'ll follow up with you directly.' });
      setAdvanceRequestedLocally(true);
    } catch (err: any) {
      toast({ title: 'Could not send request', description: err.message, variant: 'destructive' });
    } finally {
      advanceRequestInFlight.current = false;
      setRequestingAdvance(false);
    }
  };

  const handleDispatchPayout = async () => {
    if (payoutInFlight.current) return;
    payoutInFlight.current = true;
    try {
      setDispatchingPayout(true);
      const result = await api.rfqs.releasePayout(rfq.id);
      toast({ title: 'Payout dispatched', description: `${formatPrice(Number(result.amount))} sent to the vendor's bank account via Cashfree.` });
      setPayoutDispatchedLocally(true);
    } catch (err: any) {
      toast({ title: 'Failed to dispatch payout', description: err.message, variant: 'destructive' });
    } finally {
      payoutInFlight.current = false;
      setDispatchingPayout(false);
    }
  };

  return (
    <div className="border-b border-border/40 bg-slate-50/70 dark:bg-slate-900/40 flex-shrink-0 min-w-0">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full min-w-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Receipt className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Order Summary
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] uppercase font-bold tracking-wider py-0 h-5 flex-shrink-0",
              bd.isSettled ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : "border-amber-500/30 text-amber-600 bg-amber-500/5"
            )}
          >
            {bd.isSettled ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> Settled</>
            ) : (
              <><Clock className="h-3 w-3 mr-1" /> {settlementLabel}</>
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-black text-foreground whitespace-nowrap">
            {headlineLabel}: {formatPrice(headlineAmount)}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-1 gap-3 text-xs min-w-0">
          {(role === 'buyer' || role === 'admin') && (
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-border/50 p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Buyer Payment</p>
              <Row label={`Base (${bd.quantity} × ${formatPrice(bd.unitPrice)})`} value={formatPrice(bd.baseAmount)} />
              {bd.discountAmount > 0 && (
                <Row label={`Discount (${bd.discountLabel})`} value={`-${formatPrice(bd.discountAmount)}`} tone="emerald" />
              )}
              <Row label="GST (18%)" value={formatPrice(bd.gst)} />
              <Row label="Total Paid" value={formatPrice(bd.buyerTotalPaid)} bold />
            </div>
          )}

          {(role === 'vendor' || role === 'admin') && (
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-border/50 p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Vendor Payout</p>
              <Row label="Order Value" value={formatPrice(bd.baseAmount)} />
              {/* vendorCommissionDeduction (not platformCommission) is what's actually taken off
                  the vendor's own order value — when the platform or a 50-50 split absorbed
                  part of the discount, platformCommission is a smaller, different number and
                  wouldn't reconcile with Net Payout below. */}
              <Row label="Platform Commission" value={`-${formatPrice(bd.vendorCommissionDeduction)}`} tone="rose" />
              {bd.vendorDiscountShare > 0 && (
                <Row label="Discount Share" value={`-${formatPrice(bd.vendorDiscountShare)}`} tone="rose" />
              )}
              <Row label="Net Payout" value={formatPrice(bd.vendorNetPayout)} bold />
              <p className="text-[10px] text-muted-foreground pt-1">
                {bd.isSettled ? 'Released to your wallet.' : 'Released once Admin settles this order.'}
              </p>
              {/* Buyer may have paid more than this already — seller only ever sees their own
                  advance entitlement here, never the buyer's actual collected amount. */}
              {role === 'vendor' && !bd.isSettled && rfq.advance_amount != null && (
                <div className="pt-2 mt-1 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-bold text-indigo-600">{formatPrice(Number(rfq.advance_amount))}</span> logged on the platform in your name as an advance.
                  </p>
                  {rfq.advance_requested_at || advanceRequestedLocally ? (
                    <p className="text-[10px] font-bold text-indigo-600 pt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Request sent — admin will follow up.
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRequestAdvance}
                      disabled={requestingAdvance}
                      className="w-full mt-2 text-[11px] h-7 font-bold border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10"
                    >
                      {requestingAdvance ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                      Request My Advance
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {role === 'admin' && (
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-border/50 p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Platform Commission</p>
              <Row label="Commission Earned" value={formatPrice(bd.platformCommission)} bold tone="indigo" />
              <Row label="Charged To" value={bd.payerRoute === 'buyer_add' ? 'Buyer' : 'Seller'} />
              <Row label="Settlement" value={settlementLabel} />

              {/* Which Cashfree tranches have actually landed, not just what's owed overall —
                  lets admin see at a glance what's left to collect before the order can settle. */}
              {rfq.advance_paid_amount != null && (
                <Row label="Advance Collected" value={formatPrice(Number(rfq.advance_paid_amount))} tone="emerald" />
              )}
              {rfq.remaining_paid_amount != null ? (
                <Row label="Remaining Collected" value={formatPrice(Number(rfq.remaining_paid_amount))} tone="emerald" />
              ) : rfq.advance_paid_amount != null && (
                <Row label="Remaining Due" value={formatPrice(Math.max(0, bd.buyerTotalPaid - Number(rfq.advance_paid_amount)))} tone="rose" />
              )}

              {isDelivered && !bd.isSettled && (
                <Button
                  size="sm"
                  onClick={handleRelease}
                  disabled={releasing}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-lg"
                >
                  {releasing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Wallet className="h-3.5 w-3.5 mr-1.5" />}
                  Release {formatPrice(bd.vendorNetPayout)} to Vendor
                </Button>
              )}
              {bd.isSettled && !payoutDispatched && (
                <Button
                  size="sm"
                  onClick={handleDispatchPayout}
                  disabled={dispatchingPayout}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 rounded-lg"
                >
                  {dispatchingPayout ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Dispatch Payout via Cashfree
                </Button>
              )}
              {bd.isSettled && payoutDispatched && (
                <p className="text-[10px] font-bold text-indigo-600 pt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Payout dispatched to the vendor's bank account.
                </p>
              )}
              {!isDelivered && (
                <p className="text-[10px] text-muted-foreground pt-1">
                  Available once the buyer confirms delivery.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: 'emerald' | 'rose' | 'indigo' }) {
  return (
    <div className={cn(
      "flex justify-between gap-2",
      bold && "font-bold border-t border-border/40 pt-1.5 mt-0.5",
      tone === 'emerald' && "text-emerald-600",
      tone === 'rose' && "text-rose-500",
      tone === 'indigo' && "text-indigo-600"
    )}>
      <span className={cn(!bold && "text-muted-foreground")}>{label}:</span>
      <span className={cn("font-semibold", bold && "font-black")}>{value}</span>
    </div>
  );
}
