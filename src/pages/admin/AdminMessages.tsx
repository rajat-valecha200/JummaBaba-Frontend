import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Send,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  ArrowLeft,
  Shield,
  Clock,
  Filter,
  ChevronDown,
  Users,
  Store,
  User,
  MessageSquare,
  CornerDownRight,
  Plus,
  Loader2,
  Lock,
  FileText,
  Truck,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Package,
  Tag,
  Settings,
  Eye,
  ShoppingCart,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { OrderGroupSummaryPanel } from '@/components/orders/OrderGroupSummaryPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { buildAuditTrail } from '@/lib/auditTrail';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  metadata?: any;
}

interface SourcingActionCardProps {
  message: Message;
  userRole: string | undefined;
  onRefresh: () => void;
  negotiationStep?: string;
  triggerCounterNegotiation?: (rfqId: string, currentPrice: number, qty: number) => void;
}

function CatalogSlabBadge({ metadata }: { metadata: any }) {
  const [slabInfo, setSlabInfo] = useState<{ price: number; range?: string } | null>(() => {
    if (metadata.catalog_slab_price) {
      return { price: Number(metadata.catalog_slab_price), range: metadata.catalog_slab_range };
    }
    return null;
  });

  useEffect(() => {
    if (metadata.catalog_slab_price) {
      setSlabInfo({ price: Number(metadata.catalog_slab_price), range: metadata.catalog_slab_range });
      return;
    }

    let isMounted = true;
    const fetchSlab = async () => {
      try {
        const products = await api.products.list();
        const found = products.find((p: any) =>
          (metadata.product_id && String(p.id) === String(metadata.product_id)) ||
          (metadata.product_name && p.name && p.name.toLowerCase().trim() === metadata.product_name.toLowerCase().trim())
        );

        if (found && isMounted) {
          const slabs = typeof found.pricing_slabs === 'string'
            ? JSON.parse(found.pricing_slabs)
            : (found.pricing_slabs || found.pricingSlabs || []);

          if (Array.isArray(slabs) && slabs.length > 0) {
            const qNum = Number(metadata.quantity) || 0;
            const match = slabs.find((s: any) => {
              const min = s.minQty;
              const max = s.maxQty;
              if (max === null || max === undefined) return qNum >= min;
              return qNum >= min && qNum <= max;
            }) || slabs[0];

            if (match && isMounted) {
              setSlabInfo({
                price: Number(match.pricePerUnit),
                range: `${match.minQty}${match.maxQty ? `-${match.maxQty}` : '+'} units`
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to lookup catalog slab for RFQ message:', err);
      }
    };

    fetchSlab();
    return () => { isMounted = false; };
  }, [metadata.product_id, metadata.product_name, metadata.quantity, metadata.catalog_slab_price]);

  if (!slabInfo) return null;

  return (
    <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md mt-1 border border-amber-500/20 shadow-sm">
      Catalog Slab: ₹{slabInfo.price.toLocaleString()} {slabInfo.range ? `(${slabInfo.range})` : ''}
    </span>
  );
}

function CatalogSlabDialogBanner({ metadata, liveQuantity }: { metadata?: any; liveQuantity?: string | number }) {
  const meta = metadata || {};
  const [slabInfo, setSlabInfo] = useState<{ price: number; range?: string; isEstimate?: boolean } | null>(() => {
    if (meta.catalog_slab_price) {
      return { price: Number(meta.catalog_slab_price), range: meta.catalog_slab_range };
    }
    return null;
  });

  useEffect(() => {
    // liveQuantity (the "Adjusted Sourcing Volume" field admin is actively typing into) takes
    // priority — this banner is meant to reflect what admin is CURRENTLY setting, not freeze on
    // whatever quantity the RFQ started with when the dialog first opened.
    if (meta.catalog_slab_price && !liveQuantity) {
      setSlabInfo({ price: Number(meta.catalog_slab_price), range: meta.catalog_slab_range });
      return;
    }

    let isMounted = true;
    const fetchSlab = async () => {
      try {
        const products = await api.products.list();
        const found = products.find((p: any) =>
          (meta.product_id && String(p.id) === String(meta.product_id)) ||
          (meta.product_name && p.name && p.name.toLowerCase().trim() === meta.product_name.toLowerCase().trim()) ||
          (meta.productName && p.name && p.name.toLowerCase().trim() === meta.productName.toLowerCase().trim())
        );

        if (found && isMounted) {
          const slabs = typeof found.pricing_slabs === 'string'
            ? JSON.parse(found.pricing_slabs)
            : (found.pricing_slabs || found.pricingSlabs || []);

          if (Array.isArray(slabs) && slabs.length > 0) {
            const qNum = Number(liveQuantity || meta.quantity || meta.requested_quantity || meta.qty) || 0;
            const exactMatch = slabs.find((s: any) => {
              const min = s.minQty;
              const max = s.maxQty;
              if (max === null || max === undefined) return qNum >= min;
              return qNum >= min && qNum <= max;
            });
            // Slabs are ascending by minQty — the last entry is the largest-quantity, cheapest
            // tier, so that's the right fallback when qty exceeds every published range (not
            // slabs[0], which would quote the smallest/most expensive tier instead).
            const match = exactMatch || slabs[slabs.length - 1];

            if (match && isMounted) {
              setSlabInfo({
                price: Number(match.pricePerUnit),
                range: `${match.minQty}${match.maxQty ? `-${match.maxQty}` : '+'} units`,
                isEstimate: !exactMatch
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to lookup catalog slab for dialog:', err);
      }
    };

    fetchSlab();
    return () => { isMounted = false; };
  }, [meta.product_id, meta.product_name, meta.productName, meta.quantity, meta.requested_quantity, meta.catalog_slab_price, liveQuantity]);

  const targetPrice = meta.target_price || meta.targetPrice || meta.linkedProductPrice;

  return (
    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1.5 shadow-sm">
      <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          {slabInfo?.isEstimate ? 'Above Published Tiers — Best Rate' : 'Catalog Slab Rate'} {slabInfo?.range ? `(${slabInfo.range})` : ''}:
        </span>
        <span className="font-mono text-sm text-amber-700 dark:text-amber-300 font-extrabold">
          {slabInfo ? `₹${slabInfo.price.toLocaleString()}` : 'Loading slab rate...'}
        </span>
      </div>
      {targetPrice ? (
        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-500/15 text-muted-foreground">
          <span>Buyer's Target Price:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{Number(targetPrice).toLocaleString()}</span>
        </div>
      ) : null}
    </div>
  );
}

function SourcingActionCard({ message, userRole, onRefresh, triggerCounterNegotiation, negotiationStep }: SourcingActionCardProps) {
  const metadata = message.metadata || {};
  const cardType = metadata.type;

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(metadata.supplier_id || '');
  const [isActioning, setIsActioning] = useState<boolean>(false);
  const [disputeNotes, setDisputeNotes] = useState<string>('');
  const [showDisputeInput, setShowDisputeInput] = useState<boolean>(false);
  // Optional one-off discount admin can attach while approving this specific quote — applied to
  // this RFQ's own bill once the buyer accepts. Not a reusable marketing coupon code. Admin may
  // want to give a % off or just say "₹50 off" directly, so both are supported.
  const [approveDiscountType, setApproveDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [approveDiscountValue, setApproveDiscountValue] = useState<string>('');
  // Who eats the discount — the seller's payout, the platform's own commission, or split
  // evenly. Admin picks per-quote; there's no single fixed platform rule for this.
  const [approveDiscountAbsorbedBy, setApproveDiscountAbsorbedBy] = useState<'seller' | 'platform' | 'split'>('seller');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Money breakdown for admin reviewing a vendor's quote before approving it — buyer's total,
  // platform commission, vendor's net — fetched lazily behind the eye button so it never fires
  // for every message in the thread, only the one an admin is actually about to act on.
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);

  const toggleBreakdown = async () => {
    if (showBreakdown) { setShowBreakdown(false); return; }
    setShowBreakdown(true);
    if (breakdown) return;
    setBreakdownLoading(true);
    try {
      const result = await api.rfqs.getQuoteEstimate(metadata.rfq_id, Number(metadata.price));
      setBreakdown(result);
    } catch (err) {
      setErrorMsg('Could not load the financial breakdown for this quote.');
    } finally {
      setBreakdownLoading(false);
    }
  };

  // As admin types a discount (% or flat ₹) while about to approve, show the resulting numbers
  // live — "how much will the buyer end up paying, how much does that leave the vendor and the
  // platform" — instead of admin having to guess and only find out after sending it.
  useEffect(() => {
    if (cardType !== 'vendor_quote' || userRole !== 'admin') return;
    if (!(!metadata.moderation_status || metadata.moderation_status === 'quote_pending')) return;
    setShowBreakdown(true);
    setBreakdownLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await api.rfqs.getQuoteEstimate(metadata.rfq_id, Number(metadata.price), approveDiscountType, Number(approveDiscountValue) || 0, approveDiscountAbsorbedBy);
        setBreakdown(result);
      } catch (err) {
        setErrorMsg('Could not load the financial breakdown for this quote.');
      } finally {
        setBreakdownLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [approveDiscountType, approveDiscountValue, approveDiscountAbsorbedBy]);

  // Direct Order: the price is fixed (no negotiation, nothing for the vendor to type), so just
  // show their read-only earnings estimate once, as soon as the Accept/Decline card renders.
  useEffect(() => {
    if (cardType !== 'direct_order_pending_accept' || userRole !== 'vendor') return;
    setShowBreakdown(true);
    setBreakdownLoading(true);
    api.rfqs.getQuoteEstimate(
      metadata.rfq_id,
      Number(metadata.unit_price),
      metadata.discountType || 'percentage',
      Number(metadata.discountValue) || 0,
      metadata.discountAbsorbedBy || 'seller'
    ).then(setBreakdown)
      .catch(() => setErrorMsg('Could not load your earnings estimate.'))
      .finally(() => setBreakdownLoading(false));
  }, [cardType]);

  // "Sourcing Terms Forwarded to Seller" used to compute commission/vendor-payout with a
  // hardcoded 10%/90% split (`price * quantity * 0.1` / `* 0.9`) — completely ignoring the
  // vendor's actual commission_rules or the global rate. This is the one live API call
  // (getQuoteEstimate, the same source of truth used everywhere else this session) instead —
  // for a vendor whose real rate isn't 10%, this card was showing admin a DIFFERENT commission
  // and vendor payout than what the vendor's own chat correctly displayed and what
  // executeSettlement will actually pay out at.
  useEffect(() => {
    if (cardType !== 'rfq_forwarded_to_seller' || !metadata.rfq_id || !metadata.price) return;
    setShowBreakdown(true);
    setBreakdownLoading(true);
    api.rfqs.getQuoteEstimate(metadata.rfq_id, Number(metadata.price))
      .then(setBreakdown)
      .catch(() => setErrorMsg('Could not load the commission breakdown for this order.'))
      .finally(() => setBreakdownLoading(false));
  }, [cardType, metadata.rfq_id, metadata.price]);

  // Same hardcoded-10%/90% bug, same fix, for "Terms Modification Proposal" (admin
  // Adjust/Modify Terms, and buyer/seller counter-proposals) — this is the card that was
  // showing a flat ₹69,300 commission on a ₹693,000 order (exactly 10%) while the vendor's own
  // chat correctly showed ₹103,950 (this vendor's real 15% rate).
  useEffect(() => {
    if (cardType !== 'rfq_terms_modified' || !metadata.rfq_id || !metadata.price) return;
    setShowBreakdown(true);
    setBreakdownLoading(true);
    api.rfqs.getQuoteEstimate(metadata.rfq_id, Number(metadata.price))
      .then(setBreakdown)
      .catch(() => setErrorMsg('Could not load the commission breakdown for this proposal.'))
      .finally(() => setBreakdownLoading(false));
  }, [cardType, metadata.rfq_id, metadata.price]);

  useEffect(() => {
    if (cardType === 'rfq_specs' && userRole === 'admin') {
      api.profiles.list('vendor', 'approved')
        .then(data => {
          setSuppliers(data);
          if (metadata.supplier_id) {
            setSelectedSupplierId(metadata.supplier_id);
          } else if (data.length > 0) {
            setSelectedSupplierId(data[0].id);
          }
        })
        .catch(err => console.error("Failed to load suppliers:", err));
    }
  }, [cardType, userRole, metadata.supplier_id]);

  if (!cardType) return null;

  const handleForward = async () => {
    if (!selectedSupplierId) return;
    try {
      setIsActioning(true);
      setErrorMsg('');
      await api.rfqs.forward(metadata.rfq_id, selectedSupplierId);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Forward failed');
    } finally {
      setIsActioning(false);
    }
  };

  const handleAcceptQuote = async () => {
    try {
      setIsActioning(true);
      setErrorMsg('');
      await api.rfqs.acceptQuote(metadata.rfq_id);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Accept failed');
    } finally {
      setIsActioning(false);
    }
  };

  const handleConfirmDelivery = async () => {
    try {
      setIsActioning(true);
      setErrorMsg('');
      await api.rfqs.buyerAction(metadata.rfq_id, 'confirm_delivery');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Delivery confirmation failed');
    } finally {
      setIsActioning(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!disputeNotes.trim()) {
      setErrorMsg('Please specify the reason for opening a dispute.');
      return;
    }
    try {
      setIsActioning(true);
      setErrorMsg('');
      await api.rfqs.buyerAction(metadata.rfq_id, 'open_dispute', disputeNotes.trim());
      setShowDisputeInput(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Dispute failed to open');
    } finally {
      setIsActioning(false);
    }
  };

  // Card designs using sleek glassmorphism and tailored dark/light HSL palettes
  switch (cardType) {
    case 'rfq_specs':
      // Direct Orders get their own dedicated card (direct_order_pending_review /
      // direct_order_pending_accept) with the exact same product/qty/price/delivery info, plus
      // the correct Accept/Decline/Forward actions. This "classic moderation flow" card is pure
      // redundant clutter for them now that its own action buttons are suppressed (see
      // is_direct_order checks below) — so skip rendering it at all rather than showing an
      // action-less duplicate of the real card.
      if (metadata.is_direct_order) return null;
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-cyan-500/25 bg-cyan-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">RFQ Sourcing Specifications</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Moderated Sourcing Inquiry</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product Target:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{metadata.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume Required:</span>
              <span className="font-semibold text-foreground">{metadata.quantity} {metadata.unit}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Target Price:</span>
              <div className="text-right">
                <span className="font-bold text-cyan-600 dark:text-cyan-400">₹{Number(metadata.target_price).toLocaleString()}</span>
                <CatalogSlabBadge metadata={metadata} />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Site:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{metadata.delivery_location}</span>
            </div>
            {metadata.supplier_name && (
              <div className="flex justify-between border-t border-cyan-500/10 pt-2 text-cyan-600 dark:text-cyan-400 font-semibold">
                <span>Requested Supplier:</span>
                <span className="truncate max-w-[200px] underline">{metadata.supplier_name}</span>
              </div>
            )}
            {metadata.description && (
              <div className="mt-2 pt-2 border-t border-cyan-500/10">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-1">Details & Requirements</span>
                <p className="text-muted-foreground leading-relaxed italic">{metadata.description}</p>
              </div>
            )}
          </div>

          {userRole === 'admin' && !metadata.is_direct_order && (
            <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-3">
              {(!metadata.moderation_status || metadata.moderation_status === 'pending_moderation') && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Access internal window hook or parent state handlers to trigger custom dialog popup
                      const event = new CustomEvent('triggerModifyTerms', { detail: { rfqId: metadata.rfq_id, price: metadata.target_price, qty: metadata.quantity, product_id: metadata.product_id, product_name: metadata.product_name } });
                      window.dispatchEvent(event);
                    }}
                    className="w-full text-xs h-9 border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/5 font-bold"
                  >
                    Adjust/Modify Terms
                  </Button>
                </div>
              )}

              {metadata.moderation_status && metadata.moderation_status !== 'pending_moderation' ? (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-xs text-center text-cyan-600 dark:text-cyan-400 font-bold">
                  ✓ RFQ Moderated & Forwarded to Seller ({metadata.supplier_name || 'Selected Vendor'})
                </div>
              ) : metadata.supplier_id ? (
                // Direct product RFQ: Static supplier, no selector dropdown!
                <div className="flex flex-col gap-2">
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 text-xs">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Target Supplier (Buyer Choice)</span>
                    <span className="font-semibold text-foreground">{metadata.supplier_name || 'Selected Vendor'}</span>
                  </div>
                  <Button
                    onClick={handleForward}
                    className="w-full text-xs h-9 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                    disabled={isActioning}
                  >
                    {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `⚡ Forward RFQ to ${metadata.supplier_name || 'Supplier'}`}
                  </Button>
                </div>
              ) : (
                // General Sourcing RFQ: Show selector dropdown
                <>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block">Select Verified Supplier to Forward</label>
                  {suppliers.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="w-full text-xs bg-muted border border-border rounded-lg h-9 px-2 focus:ring-1 focus:ring-cyan-500 font-medium"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.business_name || s.full_name}</option>
                        ))}
                      </select>
                      <Button
                        onClick={handleForward}
                        className="w-full text-xs h-9 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                        disabled={isActioning}
                      >
                        {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "⚡ Forward RFQ to Supplier"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-500 italic">No approved suppliers found to forward to.</p>
                  )}
                </>
              )}
            </div>
          )}

          {userRole !== 'admin' && (
            <div className="mt-4 text-center space-y-2">
              <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] py-1 border border-cyan-500/10">
                {metadata.moderation_status === 'forwarded' ? 'Forwarded to Seller' : 'Awaiting Admin Verification'}
              </Badge>
              {userRole === 'vendor' && !metadata.is_direct_order && (!metadata.rfq_status || metadata.rfq_status === 'pending') && (
                <div className="pt-2 border-t border-cyan-500/10">
                  <Button
                    onClick={async () => {
                      try {
                        setIsActioning(true);
                        await api.rfqs.updateFulfillment(metadata.rfq_id, { status: 'confirmed', shipping_details: {} });
                        onRefresh();
                      } catch (err: any) {
                        setErrorMsg(err.message || 'Confirm failed');
                      } finally {
                        setIsActioning(false);
                      }
                    }}
                    className="w-full text-xs h-9 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                    disabled={isActioning}
                  >
                    {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "✓ Confirm & Accept Order"}
                  </Button>
                </div>
              )}
            </div>
          )}
          {errorMsg && <p className="text-xs text-destructive mt-2 text-center">{errorMsg}</p>}
        </div>
      );

    case 'vendor_quote':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Official Commercial Quotation</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Direct Vendor Quote</p>
              </div>
            </div>
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={toggleBreakdown}
                title="View money breakdown — buyer pays, vendor gets, platform earns"
                className={cn(
                  "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                  showBreakdown ? "bg-emerald-600 text-white" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                )}
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
          </div>

          {userRole === 'admin' && showBreakdown && (
            <div className="mb-4 p-3.5 rounded-xl bg-background/60 border border-emerald-500/15 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Only show the full loading state before we have ANY data yet. Once numbers are
                  on screen, keep showing them while a re-fetch (e.g. admin still typing a
                  discount) is in flight instead of swapping the whole block out for a spinner
                  and back on every keystroke — that's what was causing the visible flicker. */}
              {breakdownLoading && !breakdown ? (
                <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Calculating...</p>
              ) : breakdown ? (
                <>
                  {breakdownLoading && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 -mt-0.5 mb-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Updating...
                    </p>
                  )}
                  {/* Buyer's bill, top to bottom: order total, tax, then the discount coming
                      off it, ending in what buyer actually pays. */}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Order Total ({breakdown.quantity} units)</span>
                    <span className="font-semibold text-foreground">₹{breakdown.rawOrderValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">GST ({breakdown.gstRate}%)</span>
                    <span className="font-semibold text-foreground">₹{breakdown.gst.toLocaleString()}</span>
                  </div>
                  {breakdown.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Discount ({breakdown.discountType === 'flat' ? `₹${breakdown.discountValue} flat` : `${breakdown.discountValue}%`})</span>
                      <span>− ₹{breakdown.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs pb-2 border-b border-dashed">
                    <span className="font-bold text-foreground">Buyer Pays (Total)</span>
                    <span className="font-black text-foreground">₹{breakdown.buyerTotal.toLocaleString()}</span>
                  </div>

                  {/* Platform's and vendor's own split of that order — separate from what the
                      buyer sees above. */}
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pt-0.5">Platform & Vendor Split</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Platform Earns (Commission)</span>
                    <span className="font-bold text-primary">₹{breakdown.commission.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Vendor Keeps</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{breakdown.vendorNet.toLocaleString()}</span>
                  </div>
                  {breakdown.discountAmount > 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      Discount absorbed by: {breakdown.discountAbsorbedBy === 'platform' ? 'Platform (commission reduced)' : breakdown.discountAbsorbedBy === 'split' ? 'Split 50-50 between seller & platform' : "Seller (vendor's payout reduced)"}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-destructive">Could not load breakdown.</p>
              )}
            </div>
          )}

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commercial Bid:</span>
              <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">₹{Number(metadata.price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Lead Time:</span>
              <span className="font-semibold text-foreground">{metadata.lead_time} Days</span>
            </div>
            {metadata.notes && (
              <div className="mt-2 pt-2 border-t border-emerald-500/10">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-1">Vendor Remarks</span>
                <p className="text-muted-foreground leading-relaxed italic">"{metadata.notes}"</p>
              </div>
            )}
          </div>

          {userRole === 'buyer' && (
            <div className="mt-4 pt-4 border-t border-emerald-500/20 flex gap-2">
              <Button
                onClick={handleAcceptQuote}
                className="flex-1 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                disabled={isActioning}
              >
                {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "✅ Accept Quote"}
              </Button>
            </div>
          )}

          {userRole === 'vendor' && (
            <div className="mt-4 pt-4 border-t border-emerald-500/20">
              <Button
                onClick={() => {
                  const cp = prompt('Propose Counter Price (₹):');
                  const cq = prompt('Propose Counter Quantity:');
                  if (cp && cq) {
                    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/seller-counter`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                      },
                      body: JSON.stringify({ price: Number(cp), quantity: Number(cq) })
                    }).then(res => {
                      if (res.ok) {
                        alert('Counter proposed! Awaiting admin verification.');
                        window.location.reload();
                      }
                    });
                  }
                }}
                className="w-full text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm font-semibold transition-all"
              >
                Propose Counter Terms
              </Button>
            </div>
          )}

          {userRole === 'admin' && (!metadata.moderation_status || metadata.moderation_status === 'quote_pending') && (
            <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discount to buyer (optional)</label>
                <div className="flex gap-1.5">
                  <div className="flex rounded-lg border overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setApproveDiscountType('percentage')}
                      className={cn(
                        "px-2.5 text-xs font-bold transition-colors",
                        approveDiscountType === 'percentage' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setApproveDiscountType('flat')}
                      className={cn(
                        "px-2.5 text-xs font-bold transition-colors border-l",
                        approveDiscountType === 'flat' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      ₹
                    </button>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={approveDiscountType === 'percentage' ? 100 : undefined}
                    step="0.5"
                    placeholder={approveDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 50'}
                    value={approveDiscountValue}
                    onChange={(e) => {
                      // The backend clamps a percentage discount to 100 too (so it's never
                      // wrong even if this is somehow bypassed), but doing it here too means
                      // admin never even sees a nonsense value like "500%" sitting in the field.
                      let v = e.target.value;
                      if (approveDiscountType === 'percentage' && v !== '' && Number(v) > 100) v = '100';
                      setApproveDiscountValue(v);
                    }}
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </div>

              {Number(approveDiscountValue) > 0 && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Who absorbs this discount?</label>
                  <div className="flex rounded-lg border overflow-hidden">
                    {([
                      { id: 'seller', label: 'Seller' },
                      { id: 'platform', label: 'Platform' },
                      { id: 'split', label: '50-50' }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setApproveDiscountAbsorbedBy(opt.id)}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                          opt.id !== 'seller' && "border-l",
                          approveDiscountAbsorbedBy === opt.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs h-9 border-destructive/30 text-destructive hover:bg-destructive/5 font-semibold"
                  disabled={isActioning}
                  onClick={async () => {
                    const reason = prompt('Reason for rejecting this quote:');
                    if (!reason) return;
                    setIsActioning(true);
                    try {
                      await api.rfqs.approveQuote(metadata.rfq_id, { status: 'rejected', rejection_reason: reason });
                      onRefresh?.();
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Failed to reject quote');
                    } finally {
                      setIsActioning(false);
                    }
                  }}
                >
                  Reject Quote
                </Button>
                <Button
                  className="flex-1 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                  disabled={isActioning}
                  onClick={async () => {
                    setIsActioning(true);
                    try {
                      await api.rfqs.approveQuote(metadata.rfq_id, { status: 'approved', discountType: approveDiscountType, discountValue: Number(approveDiscountValue) || 0, discountAbsorbedBy: approveDiscountAbsorbedBy });
                      onRefresh?.();
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Failed to approve quote');
                    } finally {
                      setIsActioning(false);
                    }
                  }}
                >
                  {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Approve Quote'}
                </Button>
              </div>
            </div>
          )}
          {userRole === 'admin' && metadata.moderation_status === 'quote_approved' && (
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] py-1 border border-emerald-500/10">
                ✓ Approved — Awaiting Buyer Decision
              </Badge>
            </div>
          )}
          {errorMsg && <p className="text-xs text-destructive mt-2 text-center">{errorMsg}</p>}
        </div>
      );

    case 'order_init':
      return (
        <div className="w-full max-w-sm mx-auto my-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 backdrop-blur-md p-4 shadow-md text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-2 text-indigo-600 dark:text-indigo-400">
            <Lock className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-1">Secure Order Group Activated</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Order chat initialized. Buyer, Vendor, and JummaBaba Support are now securely connected. Payment verification tracking active.
          </p>
        </div>
      );

    case 'order_placed':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-indigo-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Commercial Order Placed</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fulfillment & Verification Stage</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Admin sees both sides — vendor's actual quoted price (what they agreed to
                supply at) and what the buyer actually paid, which can differ if a discount
                was attached (see discountAbsorbedBy). Falls back to the older single `amount`
                field for messages sent before this split existed. */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor's Order Value:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{Number(metadata.vendorAmount ?? metadata.amount).toLocaleString()}</span>
            </div>
            {metadata.buyerAmount !== undefined && Number(metadata.buyerAmount) !== Number(metadata.vendorAmount) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buyer's Total Paid:</span>
                <span className="font-semibold text-foreground">₹{Number(metadata.buyerAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-semibold text-foreground">{metadata.quantity} {metadata.unit}</span>
            </div>
            {metadata.leadTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor's Lead Time:</span>
                <span className="font-semibold text-foreground">{metadata.leadTime}</span>
              </div>
            )}
            {metadata.vendorNotes && (
              <div className="mt-2 pt-2 border-t border-indigo-500/10">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-1">Vendor's Terms</span>
                <p className="text-muted-foreground leading-relaxed italic">"{metadata.vendorNotes}"</p>
              </div>
            )}
            {metadata.cancellation_deadline && (
              <div className="mt-2 pt-2 border-t border-indigo-500/10 text-[10px] text-muted-foreground">
                <span className="font-semibold text-amber-500 block mb-0.5">⚠️ Cancellation Deadline</span>
                Order cancellation is allowed until {new Date(metadata.cancellation_deadline).toLocaleString()}.
              </div>
            )}
          </div>
        </div>
      );

    case 'order_confirmed':
      return (
        <div className="w-full max-w-sm mx-auto my-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-md p-4 shadow-md text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2 text-amber-600 dark:text-amber-400">
            <FileCheck className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-1">Order Confirmed by Seller</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Order confirmed. Production, loading, and transit preparation are now in progress.
          </p>
          {userRole === 'vendor' && (
            <Link to={`/vendor/orders?open=${metadata.rfq_id}`} className="block mt-2">
              <Button className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm font-semibold transition-all">
                🚚 Dispatch & Add Shipping Details
              </Button>
            </Link>
          )}
        </div>
      );

    case 'order_shipped':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-blue-500/25 bg-blue-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-blue-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Cargo Dispatched & In Transit</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Logistics update</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Carrier/Provider:</span>
              <span className="font-semibold text-foreground">{metadata.carrier || 'Standard Carrier'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AWB/Tracking Number:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{metadata.awb || 'N/A'}</span>
            </div>
            {metadata.dispatchLocation && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dispatched From:</span>
                <span className="font-semibold text-foreground">{metadata.dispatchLocation}</span>
              </div>
            )}
            {metadata.shippingNotes && (
              <div className="mt-2 pt-2 border-t border-blue-500/10">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-1">Shipping Notes</span>
                <p className="text-muted-foreground leading-relaxed italic">"{metadata.shippingNotes}"</p>
              </div>
            )}
          </div>
        </div>
      );

    case 'delivery_prompt':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-yellow-500/25 bg-yellow-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-yellow-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              <Package className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Delivery Verification Prompt</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Receipt Acknowledgement</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            The supplier has marked this shipment as delivered. Have you successfully received your cargo and verified the contents?
          </p>

          {userRole === 'buyer' && !showDisputeInput && (
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmDelivery}
                className="flex-1 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                disabled={isActioning}
              >
                {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "📦 Yes, Confirm Delivery"}
              </Button>
              <Button
                onClick={() => setShowDisputeInput(true)}
                variant="outline"
                className="flex-1 text-xs h-9 border-destructive hover:bg-destructive/10 text-destructive rounded-lg shadow-sm font-semibold transition-all"
                disabled={isActioning}
              >
                ⚠️ Open Dispute
              </Button>
            </div>
          )}

          {showDisputeInput && (
            <div className="space-y-3 pt-3 border-t border-yellow-500/10">
              <label className="text-[10px] uppercase font-bold text-destructive block">Dispute Reason / Concerns</label>
              <textarea
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                placeholder="Describe product damage, volume mismatch, or cargo delays..."
                className="w-full text-xs p-2 bg-muted border border-border rounded-lg h-16 focus:ring-1 focus:ring-destructive resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleOpenDispute}
                  className="flex-1 text-xs h-9 bg-destructive hover:bg-destructive/90 text-white rounded-lg font-semibold transition-all"
                  disabled={isActioning}
                >
                  {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit Dispute"}
                </Button>
                <Button
                  onClick={() => { setShowDisputeInput(false); setErrorMsg(''); }}
                  variant="ghost"
                  className="text-xs h-9 rounded-lg"
                  disabled={isActioning}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {userRole !== 'buyer' && (
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] py-1 border border-yellow-500/10">
                Awaiting Buyer Confirmation
              </Badge>
            </div>
          )}
          {errorMsg && <p className="text-xs text-destructive mt-2 text-center">{errorMsg}</p>}
        </div>
      );

    case 'delivery_completed':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-md p-5 shadow-lg text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-sm text-foreground mb-1">Transaction Completed Successfully</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Successful delivery has been confirmed by the Buyer. Sourcing process closed successfully. Payment release to the vendor is pending Admin settlement.
          </p>
        </div>
      );

    case 'payment_released':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-md p-5 shadow-lg text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="font-bold text-sm text-foreground mb-1">Payment Released</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You released ₹{Number(metadata.amount).toLocaleString()} to the vendor's wallet (platform commission: ₹{Number(metadata.commission).toLocaleString()}).
          </p>
        </div>
      );

    case 'dispute_opened':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-destructive/25 bg-destructive/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-destructive/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Cargo Delivery Disputed</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payment Hold — Dispute Active</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Dispute Logged Reason</span>
            <p className="text-destructive font-medium italic bg-destructive/10 rounded-lg p-3">"{metadata.notes || 'Cargo delays/issues'}"</p>
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
              Platform administrator has been flagged to intervene and mediate. Settlement processes paused.
            </p>
          </div>
        </div>
      );

    case 'negotiated_offer':
      // Dead card: the /rfqs/:id/offer endpoint that used to create these has no caller left
      // anywhere in the UI (superseded by the real payment-request flow, 'rfq_payment_request' —
      // "Sourcing Statement & Payment Request"). Old RFQs from before that switchover can still
      // have a stale message of this type sitting in their chat history, so keep the case (don't
      // let it fall through to the "unknown message type" default) but render nothing.
      return null;

    case 'rfq_terms_modified':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Terms Modification Proposal</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {metadata.source === 'admin' ? 'Proposed by Admin' : metadata.source === 'buyer' ? 'Proposed by Buyer (Counter)' : 'Proposed by Vendor (Counter)'}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adjusted Price per Unit:</span>
              <span className="font-bold text-foreground">₹{Number(metadata.price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adjusted Quantity:</span>
              <span className="font-bold text-foreground">{metadata.quantity} units</span>
            </div>

            {/* Financial Splits calculation breakdown inside chat card */}
            <div className="border-t border-slate-200/50 pt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product Base Value:</span>
                <span className="font-bold">₹{(Number(metadata.price) * Number(metadata.quantity)).toLocaleString()}</span>
              </div>
              {userRole !== 'buyer' && (
                breakdownLoading && !breakdown ? (
                  <p className="text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Calculating...</p>
                ) : breakdown ? (
                  <>
                    <div className="flex justify-between text-indigo-600 font-semibold">
                      <span>Platform Commission:</span>
                      <span>- ₹{breakdown.commission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Vendor Settlement Payout:</span>
                      <span>₹{breakdown.vendorNet.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-destructive">Could not load breakdown.</p>
                )
              )}
            </div>

            {/* Was missing entirely on this (admin's) side of the card — the buyer/vendor
                chat's version of this same card already showed the remark, but whoever typed
                one here (via the Modify Terms / Propose Counter dialogs) had no way to know
                admin could never actually see it. */}
            {(metadata.notes || metadata.reason) && (
              <div className="mt-2.5 pt-2 border-t border-amber-500/15">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 tracking-wider block mb-1">Reason / Remark</span>
                <p className="text-slate-700 dark:text-slate-200 text-xs italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/10 leading-relaxed">
                  "{metadata.notes || metadata.reason}"
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-amber-500/20">
            {/* Check if this card has been superseded by a later negotiation step */}
            {(() => {
              const STEP_ORDER = [
                'rfq_submitted', 'admin_modified', 'buyer_countered',
                'buyer_confirmed_admin', 'seller_countered', 'admin_approved_seller_counter',
                'buyer_confirmed_seller_counter', 'forwarded_to_seller', 'seller_accepted_terms',
                'payment_pending', 'payment_submitted', 'payment_confirmed_escrow'
              ];
              const currentIdx = STEP_ORDER.indexOf(negotiationStep || '');
              const sourceStep: Record<string, string> = {
                admin: 'admin_modified',
                buyer: 'buyer_countered',
                seller: 'seller_countered',
              };
              const cardStepIdx = STEP_ORDER.indexOf(sourceStep[metadata.source] || '');

              let isSuperseded = (metadata.rfq_id && currentIdx > cardStepIdx && cardStepIdx >= 0) || metadata.active === false;
              if (userRole === 'vendor' && ['buyer_confirmed_admin', 'buyer_confirmed_seller_counter', 'forwarded_to_seller', 'seller_accepted_terms'].includes(negotiationStep || '')) {
                isSuperseded = true;
              }
              return isSuperseded;
            })() ? (
              <Badge className="bg-slate-500/10 text-slate-500 border border-slate-500/20 py-1 text-[10px] uppercase font-bold tracking-wider w-full text-center">
                ✓ Sourcing Proposal Superseded / Finalized
              </Badge>
            ) : (
              <>
                {userRole === 'buyer' && (
                  metadata.source === 'buyer' ? (
                    <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 py-1.5 text-[10px] uppercase font-bold tracking-wider w-full text-center">
                      Awaiting Admin Approval of Counter Terms
                    </Badge>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        onClick={() => {
                          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/buyer-confirm`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                            },
                            body: JSON.stringify({ source: metadata.source })
                          }).then(res => {
                            if (res.ok) {
                              alert('Quotation Terms Confirmed! Sourcing details updated.');
                              onRefresh();
                            }
                          });
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg"
                      >
                        ✓ Accept & Confirm Terms
                      </Button>
                    </div>
                  )
                )}
                {userRole === 'admin' && (metadata.source === 'seller' || metadata.source === 'vendor') && (
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={() => {
                        setIsActioning(true);
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/admin-approve-counter`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                          }
                        }).then(res => {
                          if (res.ok) {
                            alert('Seller counter-proposal approved and routed to Buyer.');
                            onRefresh();
                          }
                        }).finally(() => {
                          setIsActioning(false);
                        });
                      }}
                      disabled={isActioning}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs rounded-lg"
                    >
                      {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✓ Approve'}
                    </Button>
                    <Button
                      onClick={() => {
                        const event = new CustomEvent('triggerModifyTerms', { detail: { rfqId: metadata.rfq_id, price: metadata.price, qty: metadata.quantity, product_id: metadata.product_id, product_name: metadata.product_name } });
                        window.dispatchEvent(event);
                      }}
                      disabled={isActioning}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs rounded-lg"
                    >
                      Modify Sourcing Terms
                    </Button>
                  </div>
                )}
                {userRole === 'admin' && metadata.source === 'buyer' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        setIsActioning(true);
                        try {
                          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/admin-approve-counter`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                            }
                          });
                          if (res.ok) {
                            onRefresh();
                          } else {
                            const err = await res.json().catch(() => ({}));
                            setErrorMsg(err.error || `Request failed (${res.status})`);
                          }
                        } catch (e: any) {
                          setErrorMsg(e.message || 'Network error');
                        } finally {
                          setIsActioning(false);
                        }
                      }}
                      disabled={isActioning}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg"
                    >
                      {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Approve Counter Terms'}
                    </Button>
                    <Button
                      onClick={() => {
                        const event = new CustomEvent('triggerModifyTerms', { detail: { rfqId: metadata.rfq_id, price: metadata.price, qty: metadata.quantity, product_id: metadata.product_id, product_name: metadata.product_name } });
                        window.dispatchEvent(event);
                      }}
                      disabled={isActioning}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 rounded-lg"
                    >
                      Modify Sourcing Terms
                    </Button>
                  </div>
                )}
                {userRole === 'admin' && metadata.source === 'admin' && (
                  <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 py-1 text-[10px] uppercase font-bold tracking-wider w-full text-center">
                    Awaiting Buyer Confirmation
                  </Badge>
                )}
                {userRole === 'vendor' && (
                  <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 py-1 text-[10px] uppercase font-bold tracking-wider w-full text-center">
                    Proposed Terms Awaiting Approval
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      );

    case 'rfq_terms_confirmed':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Buyer Confirmed Terms ✓</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ready to Forward to Seller</p>
            </div>
          </div>

          <div className="space-y-2 text-xs mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confirmed Price:</span>
              <span className="font-bold text-emerald-600">₹{Number(metadata.price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confirmed Quantity:</span>
              <span className="font-bold text-foreground">{metadata.quantity} units</span>
            </div>
            <div className="flex justify-between border-t border-emerald-500/10 pt-2 font-semibold">
              <span className="text-muted-foreground">Total Order Value:</span>
              <span className="font-bold text-foreground">₹{(Number(metadata.price) * Number(metadata.quantity)).toLocaleString()}</span>
            </div>
          </div>

          {userRole === 'admin' ? (
            negotiationStep === 'buyer_confirmed_admin' || negotiationStep === 'buyer_confirmed_seller_counter' ? (
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs rounded-xl"
                onClick={async () => {
                  setIsActioning(true);
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/forward-to-seller`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('jb_token')}` }
                    });
                    if (res.ok) {
                      onRefresh?.();
                    }
                  } finally {
                    setIsActioning(false);
                  }
                }}
                disabled={isActioning}
              >
                {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '📤 Forward Order Details to Seller →'}
              </Button>
            ) : (
              <Badge className="w-full justify-center bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
                ✓ Order Forwarded to Seller
              </Badge>
            )
          ) : (
            <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
              ✓ Terms Confirmed — Awaiting Order Processing
            </Badge>
          )}
        </div>
      );

    case 'rfq_forwarded_to_seller':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-indigo-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Sourcing Terms Forwarded to Seller</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Finalized Bid Review</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adjusted Price per Unit:</span>
              <span className="font-bold">₹{Number(metadata.price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adjusted Quantity:</span>
              <span className="font-bold">{metadata.quantity} units</span>
            </div>
            {/* Real commission via getQuoteEstimate (same source of truth as everywhere else) —
                this used to hardcode a 10%/90% split regardless of the vendor's actual
                commission_rules or the global rate, showing admin a different number than what
                the vendor's own chat displayed and what settlement would actually pay out. */}
            <div className="border-t border-slate-200/50 pt-2 space-y-1 text-[11px]">
              {breakdownLoading && !breakdown ? (
                <p className="text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Calculating...</p>
              ) : breakdown ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product Base Value:</span>
                    <span className="font-bold">₹{breakdown.rawOrderValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-500 font-semibold">
                    <span>Platform Commission:</span>
                    <span>- ₹{breakdown.commission.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold border-t border-dashed border-emerald-500/10 pt-1 text-xs">
                    <span>Vendor Net Settlement Payout:</span>
                    <span>₹{breakdown.vendorNet.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <p className="text-destructive">Could not load breakdown.</p>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-500/20">
            {userRole === 'vendor' ? (
              negotiationStep === 'forwarded_to_seller' ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    onClick={async () => {
                      setIsActioning(true);
                      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/seller-accept`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('jb_token')}` }
                      });
                      if (res.ok) {
                        alert('Terms Accepted successfully!');
                        onRefresh();
                      }
                      setIsActioning(false);
                    }}
                    disabled={isActioning}
                  >
                    Accept Terms
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-amber-500/30 text-amber-600 font-bold text-xs"
                    onClick={() => {
                      if (triggerCounterNegotiation) {
                        triggerCounterNegotiation(metadata.rfq_id, Number(metadata.price), Number(metadata.quantity));
                      } else {
                        const cp = prompt('Propose Counter Price (₹):');
                        const cq = prompt('Propose Counter Quantity:');
                        if (cp && cq) {
                          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/seller-counter`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                            },
                            body: JSON.stringify({ price: Number(cp), quantity: Number(cq) })
                          }).then(res => {
                            if (res.ok) {
                              alert('Counter proposed! Awaiting admin verification.');
                              onRefresh();
                            }
                          });
                        }
                      }
                    }}
                    disabled={isActioning}
                  >
                    Propose Counter
                  </Button>
                </div>
              ) : (
                <Badge className="w-full justify-center bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
                  ✓ Action Taken ({negotiationStep === 'seller_countered' ? 'Counter Proposed' : 'Accepted'})
                </Badge>
              )
            ) : (
              <Badge className="w-full justify-center bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
                Awaiting Seller Action
              </Badge>
            )}
          </div>
        </div>
      );

    case 'seller_counter_approved':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Seller Counter Sourcing Terms Approved</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Awaiting Buyer Confirmation</p>
            </div>
          </div>
          <div className="space-y-2.5 text-xs mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adjusted Price per Unit:</span>
              <span className="font-bold text-foreground">₹{Number(metadata.price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adjusted Quantity:</span>
              <span className="font-bold text-foreground">{metadata.quantity} units</span>
            </div>
            <div className="flex justify-between border-t border-amber-500/10 pt-2 font-semibold">
              <span className="text-muted-foreground">Total Sourcing Valuation:</span>
              <span className="font-bold text-foreground">₹{(Number(metadata.price) * Number(metadata.quantity)).toLocaleString()}</span>
            </div>
          </div>
          {(metadata.notes || metadata.reason) && (
            <div className="mb-4 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-xs">
              <p className="font-semibold text-muted-foreground mb-1">Seller's Remark:</p>
              <p className="text-foreground italic">"{metadata.notes || metadata.reason}"</p>
            </div>
          )}

          {userRole === 'buyer' ? (
            negotiationStep === 'admin_approved_seller_counter' ? (
              <Button
                onClick={() => {
                  setIsActioning(true);
                  fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/buyer-confirm`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                    },
                    body: JSON.stringify({ source: 'seller' })
                  }).then(res => {
                    if (res.ok) {
                      alert('Terms Confirmed successfully! Sourcing details updated.');
                      onRefresh();
                    }
                  }).finally(() => {
                    setIsActioning(false);
                  });
                }}
                disabled={isActioning}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg text-xs"
              >
                ✓ Accept & Confirm Terms
              </Button>
            ) : (
              <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
                ✓ Terms Confirmed
              </Badge>
            )
          ) : (
            <Badge className="w-full justify-center bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
              Awaiting Buyer Confirmation
            </Badge>
          )}
        </div>
      );

    case 'rfq_seller_accepted':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Sourcing Terms Accepted by Seller</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seller Acknowledged</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Seller accepted finalized terms of ₹{Number(metadata.price).toLocaleString()} for {metadata.quantity} units. Awaiting payment request generation.
          </p>
          {negotiationStep === 'seller_accepted_terms' ? (
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs"
              onClick={() => {
                const event = new CustomEvent('triggerSendPaymentRequest', { detail: { rfqId: metadata.rfq_id } });
                window.dispatchEvent(event);
              }}
            >
              ✉️ Send Statement & Request Payment
            </Button>
          ) : (
            <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
              ✓ Payment Statement Sent
            </Badge>
          )}
        </div>
      );

    case 'rfq_payment_request': {
      // Scoped to its own block, with its own name (paymentBreakdown, not breakdown) —
      // deliberately: an unbraced `switch` shares ONE block scope across every case, so a bare
      // `const breakdown` here got hoisted (TDZ-wise) to the top of the WHOLE switch. Every case
      // textually ABOVE this one that also references the outer `breakdown` state variable (by
      // the same name) was actually hitting this local, not-yet-initialized binding instead —
      // a real `ReferenceError: Cannot access 'breakdown' before initialization` at runtime, not
      // just a tsc warning. That's exactly what broke production (minified to a single-letter
      // name, but the same TDZ) — this was wrongly written off earlier as "harmless in dev only"
      // when in fact JS engines enforce TDZ regardless of dev vs. prod; it happened not to be
      // hit locally. This is a static payload from metadata, unrelated to the live-fetched
      // `breakdown` state used elsewhere in this switch — different data, so it gets its own name.
      const paymentBreakdown = metadata.breakdown || {};
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-primary/25 bg-primary/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-primary/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Sourcing Statement & Payment Request</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">JummaBaba Billing Invoice</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-foreground bg-background/60 p-3 rounded-lg border border-primary/10 mb-2">
            <div className="flex justify-between">
              <span>Agreed Price:</span>
              <span className="font-bold text-foreground">₹{Number(paymentBreakdown.price).toLocaleString()} / Unit</span>
            </div>
            <div className="flex justify-between">
              <span>Agreed Quantity:</span>
              <span className="font-bold text-foreground">{paymentBreakdown.quantity} units</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1 mt-1 text-foreground">
              <span>Subtotal Sourcing Cost:</span>
              <span>₹{Number(paymentBreakdown.baseAmount).toLocaleString()}</span>
            </div>
            {Number(paymentBreakdown.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({paymentBreakdown.discountType === 'flat' ? `₹${paymentBreakdown.discountValue} flat` : `${paymentBreakdown.discountValue ?? paymentBreakdown.discountPercentage}%`} off):</span>
                <span>-₹{Number(paymentBreakdown.discountAmount).toLocaleString()}</span>
              </div>
            )}
            {Number(paymentBreakdown.platformFee) > 0 && (
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>
                  Platform Service Commission
                  {Number(paymentBreakdown.discountedBase) > 0 ? ` (${((Number(paymentBreakdown.platformFee) / Number(paymentBreakdown.discountedBase)) * 100).toFixed(1)}%)` : ''}:
                </span>
                <span>₹{Number(paymentBreakdown.platformFee).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>GST Tax {Number(paymentBreakdown.discountedBase || paymentBreakdown.baseAmount) > 0 ? `(${((Number(paymentBreakdown.gst) / Number(paymentBreakdown.discountedBase || paymentBreakdown.baseAmount)) * 100).toFixed(0)}%)` : ''}:</span>
              <span>₹{Number(paymentBreakdown.gst).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black border-t border-double pt-1.5 mt-1.5 text-primary text-sm">
              <span>Total Buyer Payable:</span>
              <span>₹{Math.round(Number(paymentBreakdown.finalAmount)).toLocaleString()}</span>
            </div>
          </div>
          <Badge className="w-full justify-center bg-primary/10 text-primary border border-primary/20 py-1 text-[10px] uppercase font-bold tracking-wider">
            Awaiting Buyer Payment
          </Badge>
        </div>
      );
    }

    case 'order_group_created':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 backdrop-blur-md p-5 shadow-lg text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-2 text-indigo-600 dark:text-indigo-400">
            <Package className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-sm text-foreground mb-1">Order Group Created</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            A dedicated chat has been set up to track fulfillment for this order.
          </p>
          <Button
            className="w-full text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-semibold transition-all"
            onClick={() => {
              const event = new CustomEvent('triggerOpenOrderGroup', { detail: { chatGroupId: metadata.order_group_id } });
              window.dispatchEvent(event);
            }}
          >
            Go to Order Group →
          </Button>
        </div>
      );

    case 'rfq_payment_submitted':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-yellow-500/25 bg-yellow-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-yellow-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Payment Under Verification</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Verification Phase</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Buyer submitted UTR payment proof reference: <span className="font-bold text-foreground">"{metadata.reference}"</span>.
          </p>
          {negotiationStep === 'payment_submitted' ? (
            <Button
              className="w-full bg-success hover:bg-success/90 text-white font-bold h-9 text-xs"
              onClick={async () => {
                setIsActioning(true);
                try {
                  await api.rfqs.adminConfirmPayment(metadata.rfq_id);
                  alert('Payment verified manually! Order officially elevated to vendor.');
                  onRefresh();
                } catch (err: any) {
                  alert(err.message || 'Failed to confirm payment.');
                } finally {
                  setIsActioning(false);
                }
              }}
              disabled={isActioning}
            >
              {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✅ Confirm Payment Received'}
            </Button>
          ) : (
            <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
              ✓ Payment Already Confirmed
            </Badge>
          )}
        </div>
      );

    case 'rfq_payment_verified':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-md p-5 shadow-lg text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-1">Payment Verified Successfully</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Payment has been verified and is held by JummaBaba until delivery is confirmed. Sourcing order officially elevated. PO & Invoices released under JummaBaba GST.
          </p>
        </div>
      );

    case 'direct_connection_request':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-violet-500/25 bg-violet-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-violet-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Direct Chat Request</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Requested by {metadata.requestedBy === 'buyer' ? 'Buyer' : 'Seller'}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            <span className="font-semibold text-foreground">{metadata.requesterName}</span> has requested direct communication with the {metadata.requestedBy === 'buyer' ? 'Seller' : 'Buyer'}.
            {metadata.reason && <span className="block mt-1 text-slate-500 italic">Reason: "{metadata.reason}"</span>}
          </p>
          {userRole === 'admin' && !metadata.approved && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
                onClick={async () => {
                  if (isActioning) return;
                  setIsActioning(true);
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/toggle-direct-chat`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                      },
                      body: JSON.stringify({ active: true })
                    });
                    if (res.ok) onRefresh?.();
                  } finally {
                    setIsActioning(false);
                  }
                }}
                disabled={isActioning}
              >
                {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✅ Approve Direct Connection'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-slate-300 text-slate-600 font-bold text-xs"
                onClick={async () => {
                  if (isActioning) return;
                  setIsActioning(true);
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${metadata.rfq_id}/toggle-direct-chat`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
                      },
                      body: JSON.stringify({ active: false })
                    });
                    if (res.ok) onRefresh?.();
                  } finally {
                    setIsActioning(false);
                  }
                }}
                disabled={isActioning}
              >
                Decline
              </Button>
            </div>
          )}
          {metadata.approved && (
            <Badge className="w-full justify-center bg-violet-500/10 text-violet-600 border border-violet-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
              ✓ Direct Connection Approved
            </Badge>
          )}
        </div>
      );

    case 'direct_order_pending_review':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-orange-500/25 bg-orange-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-orange-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Direct Order — Awaiting Admin Review</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buy Now, Fixed Price</p>
            </div>
          </div>
          <div className="space-y-2 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{metadata.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-semibold text-foreground">{metadata.quantity} {metadata.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fixed Price/Unit:</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">₹{Number(metadata.unit_price).toLocaleString()}</span>
            </div>
            {metadata.supplier_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seller:</span>
                <span className="font-semibold text-foreground">{metadata.supplier_name}</span>
              </div>
            )}
          </div>

          {userRole === 'admin' && metadata.rfq_direct_order_status === 'pending_review' ? (
            <div className="pt-3 border-t border-orange-500/20 space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discount to buyer (optional)</label>
                <div className="flex gap-1.5">
                  <div className="flex rounded-lg border overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setApproveDiscountType('percentage')}
                      className={cn(
                        "px-2.5 text-xs font-bold transition-colors",
                        approveDiscountType === 'percentage' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setApproveDiscountType('flat')}
                      className={cn(
                        "px-2.5 text-xs font-bold transition-colors border-l",
                        approveDiscountType === 'flat' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      ₹
                    </button>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={approveDiscountType === 'percentage' ? 100 : undefined}
                    step="0.5"
                    placeholder={approveDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 50'}
                    value={approveDiscountValue}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (approveDiscountType === 'percentage' && v !== '' && Number(v) > 100) v = '100';
                      setApproveDiscountValue(v);
                    }}
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </div>

              {Number(approveDiscountValue) > 0 && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Who absorbs this discount?</label>
                  <div className="flex rounded-lg border overflow-hidden">
                    {([
                      { id: 'seller', label: 'Seller' },
                      { id: 'platform', label: 'Platform' },
                      { id: 'split', label: '50-50' }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setApproveDiscountAbsorbedBy(opt.id)}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                          opt.id !== 'seller' && "border-l",
                          approveDiscountAbsorbedBy === opt.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full text-xs h-9 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                disabled={isActioning}
                onClick={async () => {
                  setIsActioning(true);
                  try {
                    await api.rfqs.forwardDirectOrder(metadata.rfq_id, approveDiscountType, Number(approveDiscountValue) || 0, approveDiscountAbsorbedBy);
                    onRefresh?.();
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to forward this Direct Order');
                  } finally {
                    setIsActioning(false);
                  }
                }}
              >
                {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '⚡ Forward to Seller'}
              </Button>
            </div>
          ) : (
            <Badge className="w-full justify-center bg-orange-500/10 text-orange-600 border border-orange-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
              ✓ Forwarded to Seller
            </Badge>
          )}
          {errorMsg && <p className="text-xs text-destructive mt-2 text-center">{errorMsg}</p>}
        </div>
      );

    case 'direct_order_pending_accept':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-orange-500/25 bg-orange-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-orange-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Direct Order — Buy Now</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fixed Price, No Negotiation</p>
            </div>
          </div>
          <div className="space-y-2 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{metadata.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-semibold text-foreground">{metadata.quantity} {metadata.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fixed Price/Unit:</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">₹{Number(metadata.unit_price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Location:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{metadata.delivery_location}</span>
            </div>
          </div>

          {userRole === 'vendor' && showBreakdown && (
            <div className="mb-3 p-3.5 rounded-xl bg-background/60 border border-orange-500/15 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Your Earnings (Fixed)</p>
              {breakdownLoading && !breakdown ? (
                <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Calculating...</p>
              ) : breakdown ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Order Value</span>
                    <span className="font-semibold text-foreground">₹{breakdown.rawOrderValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-500 font-semibold">
                    <span>Platform Commission</span>
                    <span>− ₹{breakdown.rawCommission.toLocaleString()}</span>
                  </div>
                  {breakdown.vendorDiscountShare > 0 && (
                    <div className="flex justify-between text-xs text-rose-500 font-semibold">
                      <span>Your Discount Share</span>
                      <span>− ₹{breakdown.vendorDiscountShare.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs pt-1.5 border-t border-dashed">
                    <span className="font-bold text-foreground">You'll Earn</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">₹{breakdown.vendorNet.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-destructive">Could not load your earnings estimate.</p>
              )}
            </div>
          )}

          {userRole === 'vendor' && metadata.rfq_direct_order_status === 'pending_seller_accept' ? (
            <div className="pt-3 border-t border-orange-500/20 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs h-9 border-destructive/30 text-destructive hover:bg-destructive/5 font-semibold"
                disabled={isActioning}
                onClick={async () => {
                  const reason = prompt('Reason for declining this order (optional):') || '';
                  setIsActioning(true);
                  try {
                    await api.rfqs.declineDirectOrder(metadata.rfq_id, reason);
                    onRefresh?.();
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to decline this order');
                  } finally {
                    setIsActioning(false);
                  }
                }}
              >
                Decline
              </Button>
              <Button
                className="flex-1 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold transition-all"
                disabled={isActioning}
                onClick={async () => {
                  setIsActioning(true);
                  try {
                    await api.rfqs.acceptDirectOrder(metadata.rfq_id);
                    onRefresh?.();
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Failed to accept this order');
                  } finally {
                    setIsActioning(false);
                  }
                }}
              >
                {isActioning ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✅ Accept Order'}
              </Button>
            </div>
          ) : (
            <Badge className={cn(
              "w-full justify-center py-1 text-[10px] uppercase font-bold tracking-wider border",
              metadata.rfq_direct_order_status === 'seller_declined'
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-orange-500/10 text-orange-600 border-orange-500/20"
            )}>
              {metadata.rfq_direct_order_status === 'seller_declined' ? '✕ Declined by Seller' : userRole === 'vendor' ? '✓ Order Accepted' : 'Awaiting Seller Action'}
            </Badge>
          )}
          {errorMsg && <p className="text-xs text-destructive mt-2 text-center">{errorMsg}</p>}
        </div>
      );

    case 'direct_order_accepted':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-md p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold text-foreground">
              Seller accepted this Direct Order at ₹{Number(metadata.price).toLocaleString()} for {metadata.quantity} units. Payment request sent to buyer.
            </p>
          </div>
        </div>
      );

    case 'direct_order_declined':
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-destructive/25 bg-destructive/5 backdrop-blur-md p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-xs font-semibold text-foreground">
              Seller declined this Direct Order.{metadata.reason ? ` Reason: ${metadata.reason}` : ''}
            </p>
          </div>
        </div>
      );

    default: {
      // Fallback for message types without a dedicated card above (e.g. cancellation events) —
      // reuse the same title/description logic the Full Audit Trail page uses, so these events
      // show up as readable text instead of silently rendering nothing in the admin chat too.
      const [entry] = buildAuditTrail([message]);
      // Even types auditTrail.ts doesn't know about still have a real message the backend
      // wrote for exactly this purpose — better to show that than render nothing at all.
      if (!entry && !message.text) return null;
      const toneClass = entry?.tone === 'danger'
        ? 'border-destructive/20 bg-destructive/5 text-destructive'
        : entry?.tone === 'warning'
          ? 'border-amber-500/20 bg-amber-500/5 text-amber-700'
          : entry?.tone === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700'
            : 'border-border bg-muted/40 text-foreground';
      return (
        <div className={cn('rounded-xl border p-3 text-sm', toneClass)}>
          {entry ? (
            <>
              <p className="font-bold">{entry.title}</p>
              <p className="text-xs opacity-90 mt-0.5">{entry.description}</p>
            </>
          ) : (
            <p>{message.text}</p>
          )}
        </div>
      );
    }
  }
}

interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  participantCompany: string;
  participantType: 'buyer' | 'vendor';
  linkedProductId?: string;
  linkedProductName?: string;
  linkedVendorId?: string;
  linkedVendorName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isVerified: boolean;
  messages: Message[];
  isGroup?: boolean;
  groupType?: string;
  rfqId?: string;
  canIntervene?: boolean;
  directChatActive?: boolean;
  linkedProductPrice?: number;
  linkedProductQty?: number;
  negotiationStep?: string;
}

// Unified inbox now dynamic

// Message Status Component
function MessageStatus({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'sending':
      return <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />;
    case 'sent':
      return <Check className="h-3.5 w-3.5 text-muted-foreground/70" />;
    case 'delivered':
      return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/70" />;
    case 'read':
      return <CheckCheck className="h-3.5 w-3.5 text-b2b-orange" />;
    default:
      return null;
  }
}

export default function AdminMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'all' | 'buyers' | 'vendors'>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderRfq, setOrderRfq] = useState<any>(null);

  // New Chat State
  const [showNewChat, setShowNewChat] = useState<'vendor' | 'buyer' | null>(null);
  const [availableParticipants, setAvailableParticipants] = useState<any[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Custom Special Offer/Coupon states
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [offerDiscountType, setOfferDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [offerDiscountValue, setOfferDiscountValue] = useState('');
  const [offerDiscountAbsorbedBy, setOfferDiscountAbsorbedBy] = useState<'seller' | 'platform' | 'split'>('seller');
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
  const [offerBreakdown, setOfferBreakdown] = useState<any>(null);
  const [offerBreakdownLoading, setOfferBreakdownLoading] = useState(false);

  // Live preview of this bill as admin adjusts the discount — same pattern as the quote-
  // approval dialog, so both discount flows behave and look identical.
  useEffect(() => {
    if (!showOfferDialog || !selectedConversation?.rfqId) return;
    const price = Number(selectedConversation.linkedProductPrice || 0);
    if (!price) return;
    setOfferBreakdownLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await api.rfqs.getQuoteEstimate(selectedConversation.rfqId!, price, offerDiscountType, Number(offerDiscountValue) || 0, offerDiscountAbsorbedBy);
        setOfferBreakdown(result);
      } catch (err) {
        setOfferBreakdown(null);
      } finally {
        setOfferBreakdownLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [showOfferDialog, selectedConversation?.rfqId, selectedConversation?.linkedProductPrice, offerDiscountType, offerDiscountValue, offerDiscountAbsorbedBy]);

  // Term adjustment dialog state
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [modifyPrice, setModifyPrice] = useState('');
  const [modifyQty, setModifyQty] = useState('');
  const [modifyNotes, setModifyNotes] = useState('');
  const [modifyRfqId, setModifyRfqId] = useState('');
  const [isModifyingTerms, setIsModifyingTerms] = useState(false);
  const [modifyBreakdown, setModifyBreakdown] = useState<any>(null);
  const [modifyBreakdownLoading, setModifyBreakdownLoading] = useState(false);

  // Live commission preview as admin types a new price/quantity here — same
  // hardcoded-10%/90% bug as the two chat cards above, same fix (real getQuoteEstimate).
  useEffect(() => {
    if (!showModifyDialog || !modifyRfqId || !modifyPrice) return;
    setModifyBreakdownLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await api.rfqs.getQuoteEstimate(modifyRfqId, Number(modifyPrice), undefined, undefined, undefined, Number(modifyQty) || undefined);
        setModifyBreakdown(result);
      } catch (err) {
        setModifyBreakdown(null);
      } finally {
        setModifyBreakdownLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [showModifyDialog, modifyRfqId, modifyPrice, modifyQty]);

  const handleModifyTermsSubmit = async () => {
    if (!modifyRfqId || !modifyPrice || !modifyQty) return;
    try {
      setIsModifyingTerms(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${modifyRfqId}/admin-modify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
        },
        body: JSON.stringify({ price: Number(modifyPrice), quantity: Number(modifyQty), notes: modifyNotes })
      });
      if (res.ok) {
        toast({ title: 'Terms Adjusted', description: 'Sourcing card updated in conversation thread.' });
        setShowModifyDialog(false);
        setModifyPrice('');
        setModifyQty('');
        setModifyNotes('');
        fetchConversations();
        fetchMessages();
      } else {
        toast({ title: 'Error', description: 'Adjustment submission failed.', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsModifyingTerms(false);
    }
  };

  const handleGenerateOffer = async () => {
    if (!selectedConversation?.rfqId) return;
    try {
      setIsGeneratingOffer(true);
      await api.rfqs.sendPaymentRequest(selectedConversation.rfqId, offerDiscountType, Number(offerDiscountValue) || 0, offerDiscountAbsorbedBy);

      setShowOfferDialog(false);
      setOfferPrice('');
      setOfferQty('');
      setOfferDiscountType('percentage');
      setOfferDiscountValue('');
      setOfferDiscountAbsorbedBy('seller');
      setOfferBreakdown(null);
      fetchConversations();
      fetchMessages();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Failed to send payment request', description: e.message, variant: 'destructive' });
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Set whenever a (different) conversation is opened; consumed by fetchMessages once that
  // conversation's history actually lands, so the chat opens scrolled to the latest message
  // instead of the top, and doesn't re-jump on every 3s poll while admin is reading history.
  const shouldScrollToBottomRef = useRef(false);

  const playNotificationSound = useCallback(() => {
    /* 
    try {
      const audio = new Audio('/notification_sound.wav');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play blocked by browser:', e));
    } catch (e) {
      console.log('Audio play failed:', e);
    }
    */
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.messages.getConversations();
      const mapped: Conversation[] = data.map((c: any) => ({
        id: c.participant_id,
        participantName: c.participant_name,
        participantAvatar: c.participant_avatar,
        participantCompany: c.participant_company,
        participantType: c.participant_role === 'vendor' ? 'vendor' : 'buyer',
        lastMessage: c.last_message,
        lastMessageTime: new Date(c.last_message_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        unreadCount: (c.participant_id === selectedConversation?.id) ? 0 : parseInt(c.unread_count, 10),
        isOnline: c.is_online,
        isVerified: true,
        messages: [],
        isGroup: c.is_group,
        groupType: c.group_type,
        rfqId: c.rfq_id,
        canIntervene: c.can_intervene,
        directChatActive: c.direct_chat_active,
        linkedProductPrice: Number(c.target_price || 0),
        linkedProductQty: Number(c.quantity || 0),
        linkedProductId: c.product_id || undefined,
        linkedProductName: c.is_group ? (c.participant_company !== 'Marketplace Sourcing' ? c.participant_company : undefined) : undefined,
        negotiationStep: c.negotiation_step
      }));

      // Play sound if unread count increased globally
      const totalUnreadNow = mapped.reduce((sum, c) => sum + c.unreadCount, 0);
      setConversations(prev => {
        const totalUnreadPrev = prev.reduce((sum, c) => sum + c.unreadCount, 0);
        if (totalUnreadNow > totalUnreadPrev) {
          // playNotificationSound(); // Commented out for now
        }
        return mapped;
      });

      // Keep the open conversation's negotiation state in sync too — otherwise action
      // buttons (Approve Seller Counter, Forward to Seller, etc.) stay stale until the
      // admin closes and reopens the conversation, even though the sidebar list refreshed.
      // linkedProductPrice/linkedProductQty MUST be included here — they're what the "Send
      // Sourcing Statement & Payment Request" dialog actually bills the buyer from. Leaving
      // them out (as this only used to sync negotiationStep/directChatActive/canIntervene)
      // meant that dialog kept showing whatever price/qty was agreed WHEN THE ADMIN FIRST
      // OPENED THIS CHAT, even after "Adjust/Modify Terms" changed it and the buyer/seller
      // both confirmed the new figure — a live, confirmed case of this sending a payment
      // request at the wrong (stale, pre-negotiation) price.
      setSelectedConversation(prev => {
        if (!prev) return prev;
        const fresh = mapped.find(c => c.id === prev.id);
        if (!fresh) return prev;
        if (
          prev.negotiationStep === fresh.negotiationStep &&
          prev.directChatActive === fresh.directChatActive &&
          prev.canIntervene === fresh.canIntervene &&
          prev.linkedProductPrice === fresh.linkedProductPrice &&
          prev.linkedProductQty === fresh.linkedProductQty
        ) {
          return prev;
        }
        return {
          ...prev,
          negotiationStep: fresh.negotiationStep,
          directChatActive: fresh.directChatActive,
          canIntervene: fresh.canIntervene,
          linkedProductPrice: fresh.linkedProductPrice,
          linkedProductQty: fresh.linkedProductQty
        };
      });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation?.id, playNotificationSound]); // Add dependency on selected ID

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation?.id || !user?.id) return;
    try {
      const isGroup = !!selectedConversation.isGroup;
      const history = await api.messages.getHistory(selectedConversation.id, isGroup);
      const mappedMessages: Message[] = history.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id === user?.id ? 'admin' : (m.sender_id ? m.sender_id : 'system'),
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: m.is_read ? 'read' : 'sent',
        metadata: m.metadata,
        senderName: m.sender_name,
        senderRole: m.sender_role
      }));

      setSelectedConversation(prev => {
        if (!prev || prev.id !== selectedConversation.id) return prev;
        if (JSON.stringify(prev.messages) === JSON.stringify(mappedMessages)) return prev;
        return { ...prev, messages: mappedMessages };
      });

      if (shouldScrollToBottomRef.current) {
        shouldScrollToBottomRef.current = false;
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        });
      }

      // If there are unread messages from the other user, mark them as read
      const hasUnread = history.some((m: any) => m.sender_id !== user.id && !m.is_read);
      if (hasUnread) {
        api.messages.markAsRead(selectedConversation.id, isGroup).then(() => {
          window.dispatchEvent(new CustomEvent('refreshAdminStats'));
          fetchConversations();
        }).catch(err => console.error('Failed to mark as read in poll:', err));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [selectedConversation?.id, selectedConversation?.isGroup, user?.id, fetchConversations]);

  const handleToggleIntervention = async () => {
    if (!selectedConversation?.id) return;
    const newStatus = !selectedConversation.canIntervene;
    try {
      await api.messages.toggleIntervention(selectedConversation.id, newStatus);
      setSelectedConversation(prev => prev ? { ...prev, canIntervene: newStatus } : null);
      await fetchConversations();
      await fetchMessages();
    } catch (err: any) {
      console.error('Failed to toggle intervention:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // 10s for sidebar
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Deep-links from a notification/message ("chatGroupId=X" in the URL) should only ever
  // auto-open that conversation ONCE — the URL itself never changes again after that (clicking
  // a different conversation, or "Go to Order Group", updates React state directly, not the
  // browser URL). Without this guard, the conversations list refreshing on its own 10s poll
  // re-ran this effect, saw the URL still said "open X", and forcibly snapped the admin back to
  // X every time — even after they'd deliberately navigated to a different chat (e.g. from the
  // RFQ negotiation chat to its Order Group).
  const processedDeepLinkRef = useRef<string | null>(null);
  useEffect(() => {
    if (conversations.length === 0) return;
    const params = new URLSearchParams(location.search);
    const chatGroupId = params.get('chatGroupId') || params.get('groupId');
    const rfqId = params.get('rfqId');
    const key = chatGroupId ? `group:${chatGroupId}` : (rfqId ? `rfq:${rfqId}` : null);
    if (!key || processedDeepLinkRef.current === key) return;

    if (chatGroupId) {
      const found = conversations.find(c => c.id === chatGroupId);
      if (found) {
        processedDeepLinkRef.current = key;
        if (!selectedConversation || selectedConversation.id !== found.id) openConversation(found);
      }
    } else if (rfqId) {
      const found = conversations.find(c => c.rfqId === rfqId);
      if (found) {
        processedDeepLinkRef.current = key;
        if (!selectedConversation || selectedConversation.id !== found.id) openConversation(found);
      }
    }
  }, [conversations, selectedConversation?.id, location.search]);

  const [modifyMetadata, setModifyMetadata] = useState<any>(null);

  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setModifyRfqId(customEvent.detail.rfqId);
        setModifyPrice(String(customEvent.detail.price || ''));
        setModifyQty(String(customEvent.detail.qty || ''));
        setModifyMetadata(customEvent.detail);
        setShowModifyDialog(true);
      }
    };
    window.addEventListener('triggerModifyTerms', handleTrigger);
    return () => window.removeEventListener('triggerModifyTerms', handleTrigger);
  }, []);

  useEffect(() => {
    if (selectedConversation?.id) {
      shouldScrollToBottomRef.current = true;
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // 3s for active chat
      return () => clearInterval(interval);
    }
  }, [selectedConversation?.id, fetchMessages]);

  useEffect(() => {
    if (selectedConversation?.isGroup && selectedConversation?.groupType === 'order_group' && selectedConversation?.rfqId) {
      const fetchOrderRfq = () => api.rfqs.get(selectedConversation.rfqId!).then(setOrderRfq).catch(() => { });
      fetchOrderRfq();
      const interval = setInterval(fetchOrderRfq, 15000); // settlement status can change over time
      return () => clearInterval(interval);
    } else {
      setOrderRfq(null);
    }
  }, [selectedConversation?.id, selectedConversation?.isGroup, selectedConversation?.groupType, selectedConversation?.rfqId]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!showNewChat) return;
      try {
        const data = await api.profiles.list(showNewChat, 'approved');
        setAvailableParticipants(data);
      } catch (error) {
        console.error('Failed to fetch participants:', error);
      }
    };
    fetchParticipants();
  }, [showNewChat]);

  const handleStartChat = async (participant: any) => {
    const existing = conversations.find(c => c.id === participant.id);
    if (existing) {
      setSelectedConversation(existing);
    } else {
      const newConv: Conversation = {
        id: participant.id,
        participantName: participant.full_name,
        participantAvatar: participant.logo_url,
        participantCompany: participant.business_name || '',
        participantType: participant.role === 'vendor' ? 'vendor' : 'buyer',
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0,
        isOnline: participant.is_online,
        isVerified: true,
        messages: []
      };
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
    }
    setShowNewChat(null);
    setParticipantSearch('');
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participantCompany.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'buyers') return matchesSearch && c.participantType === 'buyer';
    if (activeTab === 'vendors') return matchesSearch && c.participantType === 'vendor';
    return matchesSearch;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const buyerUnread = conversations.filter(c => c.participantType === 'buyer').reduce((sum, c) => sum + c.unreadCount, 0);
  const vendorUnread = conversations.filter(c => c.participantType === 'vendor').reduce((sum, c) => sum + c.unreadCount, 0);

  useEffect(() => {
    const handleTriggerOpenOrderGroup = (e: Event) => {
      const customEvent = e as CustomEvent;
      const chatGroupId = customEvent.detail?.chatGroupId;
      const found = conversations.find(c => c.id === chatGroupId);
      if (found) openConversation(found);
    };
    window.addEventListener('triggerOpenOrderGroup', handleTriggerOpenOrderGroup);
    return () => window.removeEventListener('triggerOpenOrderGroup', handleTriggerOpenOrderGroup);
  }, [conversations]);

  useEffect(() => {
    const handleTriggerSendPayment = () => {
      setShowOfferDialog(true);
    };
    window.addEventListener('triggerSendPaymentRequest', handleTriggerSendPayment);
    return () => {
      window.removeEventListener('triggerSendPaymentRequest', handleTriggerSendPayment);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const openConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    // Locally zero out count for immediate feedback
    setConversations(prev => prev.map(c =>
      c.id === conv.id ? { ...c, unreadCount: 0 } : c
    ));
    try {
      const isGroup = !!conv.isGroup;
      await api.messages.markAsRead(conv.id, isGroup);
      // Trigger global stats refresh for the Admin Bell
      window.dispatchEvent(new CustomEvent('refreshAdminStats'));
      // Wait a bit for DB to commit before fetching fresh list
      setTimeout(fetchConversations, 500);
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const receiverId = selectedConversation.isGroup ? null : selectedConversation.id;
      const chatGroupId = selectedConversation.isGroup ? selectedConversation.id : null;
      await api.messages.send(receiverId, messageInput.trim(), chatGroupId);
      setMessageInput('');
      fetchConversations();
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleForwardToVendor = (conv: Conversation) => {
    if (conv.participantType !== 'buyer' || !conv.linkedVendorId) return;

    // Find the linked vendor conversation
    const vendorConv = conversations.find(c => c.id === conv.linkedVendorId);
    if (vendorConv) {
      setSelectedConversation(vendorConv);
    }
  };

  return (
    <div className="h-full flex bg-background overflow-hidden">
      {/* Conversation List */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border flex flex-col bg-card",
        selectedConversation && "hidden md:flex"
      )}>
        {/* Tabs */}
        <div className="p-3 border-b border-border">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="w-full bg-muted">
              <TabsTrigger value="all" className="flex-1 gap-1.5 data-[state=active]:bg-b2b-orange data-[state=active]:text-white">
                <MessageSquare className="h-4 w-4" />
                All
                {totalUnread > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="buyers" className="flex-1 gap-1.5 data-[state=active]:bg-b2b-orange data-[state=active]:text-white">
                <User className="h-4 w-4" />
                Buyers
                {buyerUnread > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background">
                    {buyerUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="vendors" className="flex-1 gap-1.5 data-[state=active]:bg-b2b-orange data-[state=active]:text-white">
                <Store className="h-4 w-4" />
                Vendors
                {vendorUnread > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background">
                    {vendorUnread}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search & Actions */}
        <div className="p-3 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-border"
              />
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="bg-b2b-orange hover:bg-b2b-orange/90 h-10 w-10 shrink-0">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <DropdownMenuLabel>Start New Chat</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowNewChat('vendor')}>
                    <Store className="h-4 w-4 mr-2" /> New Vendor Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowNewChat('buyer')}>
                    <User className="h-4 w-4 mr-2" /> New Buyer Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* New Chat Dialog */}
        <Dialog open={!!showNewChat} onOpenChange={() => setShowNewChat(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Start Conversation with {showNewChat === 'vendor' ? 'Vendor' : 'Buyer'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${showNewChat}s...`}
                  className="pl-9"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {availableParticipants
                    .filter(p => p.full_name.toLowerCase().includes(participantSearch.toLowerCase()) ||
                      p.business_name?.toLowerCase().includes(participantSearch.toLowerCase()))
                    .map(p => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                        onClick={() => handleStartChat(p)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{p.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold truncate">{p.full_name}</p>
                            {p.is_online && (
                              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" title="Online" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{p.business_name || p.email}</p>
                        </div>
                      </button>
                    ))}
                  {availableParticipants.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-10">No {showNewChat}s found</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center animate-pulse">
              <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-3" />
              <div className="h-4 w-32 bg-muted mx-auto" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="font-semibold text-foreground">No conversations yet</h3>
              <p className="text-sm text-muted-foreground mt-1 px-6 text-center">
                Click the <Plus className="h-3 w-3 inline" /> button to start a new chat with a vendor or buyer.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={cn(
                    "w-full p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer",
                    selectedConversation?.id === conv.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={conv.participantAvatar} />
                        <AvatarFallback className={cn(
                          "font-semibold",
                          conv.isGroup
                            ? (conv.groupType === 'order_group' ? "bg-purple-500/20 text-purple-500 border border-purple-200" : "bg-teal-500/20 text-teal-500 border border-teal-200")
                            : (conv.participantType === 'buyer' ? "bg-blue-500/20 text-blue-400" : "bg-b2b-orange/20 text-b2b-orange")
                        )}>
                          {conv.isGroup ? (
                            conv.groupType === 'order_group' ? <Users className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />
                          ) : (
                            conv.participantName.split(' ').map(n => n[0]).join('').slice(0, 2)
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conv.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-sky-500 border-2 border-card rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                          <p
                            className="font-semibold text-sm truncate text-foreground flex-shrink min-w-0"
                            title={conv.participantName}
                          >
                            {conv.participantName}
                          </p>
                          {conv.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Online" />
                          )}
                          {conv.isVerified && (
                            <Shield className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          )}
                          {conv.isGroup && (
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-bold px-1.5 py-0 rounded flex-shrink-0 uppercase tracking-wider",
                              conv.groupType === 'negotiation'
                                ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400"
                                : "border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                            )}>
                              {conv.groupType === 'negotiation' ? 'Negotiation' : 'Order Chat'}
                            </Badge>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs flex-shrink-0",
                          conv.unreadCount > 0 ? "text-emerald-600 font-medium" : "text-muted-foreground"
                        )}>
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.participantCompany}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && selectedConversation?.id !== conv.id && (
                          <Badge className="bg-emerald-600 text-white h-5 px-1.5 text-xs flex-shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>

                      {/* Linked Product/Vendor Info for Buyers */}
                      {conv.participantType === 'buyer' && conv.linkedProductName && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                          <CornerDownRight className="h-3 w-3" />
                          <span className="truncate">{conv.linkedProductName}</span>
                          <span className="text-muted-foreground/50">→</span>
                          <span className="truncate text-b2b-orange">{conv.linkedVendorName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {/* min-w-0 is required here, not just on the header row inside it — this is itself a
            flex item in the outer [Conversation List] + [Chat Area] row (see the container a
            few lines up). Without it, a long unwrapped title anywhere inside forces THIS whole
            column to its content's width first, which then squeezes/hides the conversation
            list sidebar before any inner truncate ever gets a chance to matter. */}
      <div className={cn(
        "flex-1 flex flex-col bg-background min-w-0",
        !selectedConversation && "hidden md:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-border bg-card flex items-center gap-3 min-w-0 overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarImage src={selectedConversation.participantAvatar} />
                  <AvatarFallback className={cn(
                    "font-semibold",
                    selectedConversation.isGroup
                      ? (selectedConversation.groupType === 'order_group' ? "bg-purple-500/20 text-purple-500 border border-purple-200" : "bg-teal-500/20 text-teal-500 border border-teal-200")
                      : (selectedConversation.participantType === 'buyer' ? "bg-blue-500/20 text-blue-400" : "bg-b2b-orange/20 text-b2b-orange")
                  )}>
                    {selectedConversation.isGroup ? (
                      selectedConversation.groupType === 'order_group' ? <Users className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />
                    ) : (
                      selectedConversation.participantName.split(' ').map(n => n[0]).join('').slice(0, 2)
                    )}
                  </AvatarFallback>
                </Avatar>
                {selectedConversation.isOnline && !selectedConversation.isGroup && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-sky-500 border-2 border-card rounded-full" />
                )}
              </div>

              {/* min-w-0 has to be on every nested flex level down to the truncated text —
                    a long RFQ/product-name-derived title (participantName) was otherwise
                    forcing this whole row (and the page under it) wider than the viewport
                    instead of actually truncating with an ellipsis. */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-foreground truncate min-w-0">
                    {selectedConversation.participantName}
                  </span>
                  {selectedConversation.isVerified && (
                    <Shield className="h-4 w-4 text-b2b-orange flex-shrink-0" />
                  )}
                  <Badge variant="outline" className={cn(
                    "text-xs flex-shrink-0",
                    selectedConversation.isGroup
                      ? (selectedConversation.groupType === 'order_group' ? "border-purple-500 text-purple-500 bg-purple-50/50" : "border-teal-500 text-teal-500 bg-teal-50/50")
                      : (selectedConversation.participantType === 'buyer' ? "border-blue-500 text-blue-400" : "border-b2b-orange text-b2b-orange")
                  )}>
                    {selectedConversation.isGroup ? (selectedConversation.groupType === 'order_group' ? 'Order Group' : 'Negotiation') : (selectedConversation.participantType === 'buyer' ? 'Buyer' : 'Vendor')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate min-w-0">
                  {selectedConversation.participantCompany}
                  {selectedConversation.isOnline && !selectedConversation.isGroup && ' • Online'}
                </p>
              </div>

              {/* Action buttons for buyer conversations */}
              {selectedConversation.participantType === 'buyer' && selectedConversation.linkedVendorId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-b2b-orange text-b2b-orange hover:bg-b2b-orange hover:text-white"
                      onClick={() => handleForwardToVendor(selectedConversation)}
                    >
                      <CornerDownRight className="h-4 w-4 mr-1.5" />
                      View Vendor Chat
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Open conversation with {selectedConversation.linkedVendorName}
                  </TooltipContent>
                </Tooltip>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                  <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Archive Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Linked Product Banner for Buyer Chats */}
            {/* {selectedConversation.participantType === 'buyer' && selectedConversation.linkedProductName && (
                <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Product Inquiry:</span>
                  <span className="font-medium text-foreground">{selectedConversation.linkedProductName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-b2b-orange font-medium">{selectedConversation.linkedVendorName}</span>
                </div>
              )} */}

            {/* Order Summary Panel (financial breakdown, all roles) */}
            {selectedConversation.isGroup && selectedConversation.groupType === 'order_group' && orderRfq && (
              <OrderGroupSummaryPanel rfq={orderRfq} role="admin" onSettled={() => api.rfqs.get(orderRfq.id).then(setOrderRfq)} />
            )}

            {/* Spectator Intervention Banner & Admin Negotiation Controls */}
            {selectedConversation.isGroup && selectedConversation.groupType === 'negotiation' && (
              <div className="px-4 py-3 border-b flex flex-col gap-3 bg-slate-50/80">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛠️</span>
                    <div className="text-left">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Admin Negotiation Control Panel</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Current Step: <span className="font-extrabold text-indigo-600 uppercase tracking-widest text-[9px]">{selectedConversation.negotiationStep || 'rfq_submitted'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Only show Modify Terms during active negotiation */}
                    {!['buyer_confirmed_admin', 'buyer_confirmed_seller_counter', 'forwarded_to_seller',
                      'seller_accepted_terms', 'payment_pending', 'payment_submitted', 'payment_confirmed_escrow'
                    ].includes(selectedConversation.negotiationStep || '') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-wider"
                          onClick={() => {
                            setModifyRfqId(selectedConversation.rfqId);
                            setModifyPrice(String(selectedConversation.linkedProductPrice || ''));
                            setModifyQty(String(selectedConversation.linkedProductQty || ''));
                            // Without this, the dialog's CatalogSlabDialogBanner fell back to
                            // `selectedConversation` directly, which has no product_id/
                            // product_name/quantity fields under those exact names — its slab
                            // lookup could never match anything, so "Loading slab rate..."
                            // never resolved (it wasn't actually still loading, it had already
                            // failed silently).
                            setModifyMetadata({
                              rfqId: selectedConversation.rfqId,
                              product_id: selectedConversation.linkedProductId,
                              product_name: selectedConversation.linkedProductName,
                              quantity: selectedConversation.linkedProductQty,
                              target_price: selectedConversation.linkedProductPrice
                            });
                            setShowModifyDialog(true);
                          }}
                        >
                          Modify Terms
                        </Button>
                      )}

                    <Button
                      size="sm"
                      variant={selectedConversation.directChatActive ? 'destructive' : 'default'}
                      className="text-[10px] uppercase font-bold tracking-wider"
                      onClick={async () => {
                        const nextActive = !selectedConversation.directChatActive;
                        try {
                          await api.rfqs.toggleDirectChat(selectedConversation.rfqId!, nextActive);
                          toast({ title: nextActive ? 'Direct Connection Enabled' : 'Direct Connection Disabled', description: nextActive ? 'Buyer & Vendor can now chat directly.' : 'Mediator mode re-engaged.' });
                          await fetchConversations();
                          await fetchMessages();
                        } catch (err: any) {
                          toast({ title: 'Failed to toggle direct connection', description: err.message, variant: 'destructive' });
                        }
                      }}
                    >
                      {selectedConversation.directChatActive ? 'Disable Direct Connection' : 'Enable Direct Connection'}
                    </Button>
                  </div>
                </div>

                {/* Dynamic Workflow Actions based on negotiationStep */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 justify-end">
                  {(selectedConversation.negotiationStep === 'buyer_confirmed_admin' || selectedConversation.negotiationStep === 'buyer_confirmed_seller_counter') && (
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider"
                      onClick={async () => {
                        try {
                          await api.rfqs.forwardToSeller(selectedConversation.rfqId!);
                          toast({ title: 'Sent to Seller', description: 'RFQ finalized terms successfully forwarded to vendor.' });
                          await fetchConversations();
                          await fetchMessages();
                        } catch (err: any) {
                          toast({ title: 'Failed to forward', description: err.message, variant: 'destructive' });
                        }
                      }}
                    >
                      Forward Finalized Terms to Seller →
                    </Button>
                  )}

                  {selectedConversation.negotiationStep === 'seller_countered' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider"
                      onClick={async () => {
                        try {
                          await api.rfqs.adminApproveCounter(selectedConversation.rfqId!);
                          toast({ title: 'Approved', description: 'Seller counter terms approved and buyer alert dispatched.' });
                          await fetchConversations();
                          await fetchMessages();
                        } catch (err: any) {
                          toast({ title: 'Failed to approve', description: err.message, variant: 'destructive' });
                        }
                      }}
                    >
                      ⚡ Approve Seller Counter
                    </Button>
                  )}

                  {selectedConversation.negotiationStep === 'seller_accepted_terms' && (
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider"
                      onClick={() => setShowOfferDialog(true)}
                    >
                      ✉️ Send Payment Request & Coupon
                    </Button>
                  )}

                  {selectedConversation.negotiationStep === 'payment_submitted' && (
                    <Button
                      size="sm"
                      className="bg-success hover:bg-success/90 text-white font-bold text-[10px] uppercase tracking-wider"
                      onClick={async () => {
                        try {
                          await api.rfqs.adminConfirmPayment(selectedConversation.rfqId!);
                          toast({ title: 'Payment Confirmed', description: 'Payment verified. Multi-party Order group initialized.' });
                          await fetchConversations();
                          await fetchMessages();
                        } catch (err: any) {
                          toast({ title: 'Failed to confirm payment', description: err.message, variant: 'destructive' });
                        }
                      }}
                    >
                      ✅ Confirm Payment Received
                    </Button>
                  )}
                </div>
              </div>
            )}

            {selectedConversation.isGroup && selectedConversation.groupType === 'order_group' && (
              <div className={cn(
                "px-4 py-3 border-b flex items-center justify-between transition-all duration-300",
                selectedConversation.canIntervene
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-700"
              )}>
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {selectedConversation.canIntervene ? '⚡' : '👁️'}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest leading-none">
                      {selectedConversation.canIntervene ? 'Active Intervention Mode' : 'Passive Spectator Mode'}
                    </p>
                    <p className="text-[10px] font-bold opacity-80 mt-0.5">
                      {selectedConversation.canIntervene
                        ? 'You have active typing privileges. Your responses are visible to all members.'
                        : 'You are observing this conversation between the Buyer and Seller.'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className={cn(
                    "font-black text-[10px] uppercase tracking-widest px-4 shadow-sm transition-all duration-200",
                    selectedConversation.canIntervene
                      ? "bg-zinc-800 text-white hover:bg-zinc-900"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  )}
                  onClick={handleToggleIntervention}
                >
                  {selectedConversation.canIntervene ? 'Exit Intervention' : '⚡ Intervene'}
                </Button>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map(msg => {
                  const isAdmin = msg.senderId === 'admin';
                  const isSystem = msg.senderId === 'system';

                  // A message with a real metadata.type (rfq_terms_confirmed, etc.) always gets
                  // the rich actionable card, even when it was sent with no human sender
                  // (sender_id null → isSystem true) — most of these workflow-transition
                  // messages ARE sent that way. Checking isSystem first was silently downgrading
                  // them to a plain announcement pill with no button, e.g. "Forward Order
                  // Details to Seller" never had a chance to render even though the card for it
                  // already existed below. Only a truly generic system message (no type at all)
                  // falls back to the plain pill.
                  if (isSystem && !(msg.metadata && msg.metadata.type)) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2 max-w-full">
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-2xl px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest select-none text-center whitespace-pre-wrap max-w-[85%]">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  if (msg.metadata && msg.metadata.type) {
                    const isCentered = ['order_init', 'order_confirmed', 'delivery_completed'].includes(msg.metadata.type);
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "w-full flex mb-2",
                          isCentered ? "justify-center" : (isAdmin ? "justify-end" : "justify-start")
                        )}
                      >
                        <SourcingActionCard
                          message={msg}
                          userRole="admin"
                          onRefresh={async () => { await fetchConversations(); await fetchMessages(); }}
                          negotiationStep={selectedConversation.negotiationStep}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isAdmin ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                        isAdmin
                          ? "bg-b2b-orange text-white rounded-br-md"
                          : "bg-card text-foreground rounded-bl-md border border-border"
                      )}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                        <div className={cn(
                          "flex items-center justify-end gap-1.5 mt-1.5",
                          isAdmin ? "text-white/70" : "text-muted-foreground"
                        )}>
                          <span className="text-[10px]">{msg.timestamp}</span>
                          {isAdmin && <MessageStatus status={msg.status} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 border-t border-border bg-card">
              <div className="flex items-center gap-2">
                {selectedConversation?.groupType === 'negotiation' && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowOfferDialog(true)}
                    className="border-b2b-orange text-b2b-orange hover:bg-b2b-orange/10 shrink-0"
                    title="Create negotiated offer coupon"
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                )}
                <Input
                  placeholder={selectedConversation?.isGroup && selectedConversation?.groupType === 'order_group' && !selectedConversation?.canIntervene ? "Spectating conversation... Toggle Intervention to type" : "Type a message as Admin..."}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1 bg-muted border-border"
                  disabled={!!(selectedConversation?.isGroup && selectedConversation?.groupType === 'order_group' && !selectedConversation?.canIntervene)}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !!(selectedConversation?.isGroup && selectedConversation?.groupType === 'order_group' && !selectedConversation?.canIntervene)}
                  className="bg-b2b-orange hover:bg-b2b-orange/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Special Offer Coupon Dialog */}
              <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Send Sourcing Statement & Payment Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-sm">
                    <p className="text-xs text-muted-foreground">
                      This will generate the final invoice billing statement and payment request for the Buyer. You can optionally attach a discount below.
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg border space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span>Agreed Price:</span>
                        <span className="font-bold">₹{Number(selectedConversation?.linkedProductPrice || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agreed Quantity:</span>
                        <span className="font-bold">{selectedConversation?.linkedProductQty || 0} units</span>
                      </div>
                      <div className="flex justify-between border-t pt-1.5 font-bold text-slate-900">
                        <span>Base Sourcing Value:</span>
                        <span>₹{(Number(selectedConversation?.linkedProductPrice || 0) * Number(selectedConversation?.linkedProductQty || 0)).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-xs">Discount (optional)</label>
                      <div className="flex gap-1.5">
                        <div className="flex rounded-lg border overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={() => setOfferDiscountType('percentage')}
                            className={cn(
                              "px-2.5 text-xs font-bold transition-colors",
                              offerDiscountType === 'percentage' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                            )}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setOfferDiscountType('flat')}
                            className={cn(
                              "px-2.5 text-xs font-bold transition-colors border-l",
                              offerDiscountType === 'flat' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                            )}
                          >
                            ₹
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max={offerDiscountType === 'percentage' ? 100 : undefined}
                          placeholder={offerDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 50'}
                          value={offerDiscountValue}
                          onChange={(e) => {
                            let v = e.target.value;
                            if (offerDiscountType === 'percentage' && v !== '' && Number(v) > 100) v = '100';
                            setOfferDiscountValue(v);
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {Number(offerDiscountValue) > 0 && (
                      <div className="space-y-1 animate-in fade-in duration-150">
                        <label className="font-semibold text-xs">Who absorbs this discount?</label>
                        <div className="flex rounded-lg border overflow-hidden">
                          {([
                            { id: 'seller', label: 'Seller' },
                            { id: 'platform', label: 'Platform' },
                            { id: 'split', label: '50-50' }
                          ] as const).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setOfferDiscountAbsorbedBy(opt.id)}
                              className={cn(
                                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                                opt.id !== 'seller' && "border-l",
                                offerDiscountAbsorbedBy === opt.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(offerBreakdown || offerBreakdownLoading) && (
                      <div className="bg-slate-50 p-3 rounded-lg border space-y-1.5">
                        {offerBreakdownLoading && !offerBreakdown ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Calculating...</p>
                        ) : offerBreakdown && (
                          <>
                            {/* Buyer's bill, top to bottom: what the order actually costs, tax,
                                then the discount coming off it, ending in what buyer pays. */}
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Order Total ({offerBreakdown.quantity} units)</span>
                              <span className="font-semibold text-slate-800">₹{offerBreakdown.rawOrderValue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">GST ({offerBreakdown.gstRate}%)</span>
                              <span className="font-semibold text-slate-800">₹{offerBreakdown.gst.toLocaleString()}</span>
                            </div>
                            {offerBreakdown.discountAmount > 0 && (
                              <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                                <span>Coupon Discount ({offerBreakdown.discountType === 'flat' ? `₹${offerBreakdown.discountValue} flat` : `${offerBreakdown.discountValue}%`})</span>
                                <span>− ₹{offerBreakdown.discountAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs pb-1.5 border-b border-dashed">
                              <span className="font-bold text-slate-900">Total Buyer Payable</span>
                              <span className="font-black text-slate-900">₹{offerBreakdown.buyerTotal.toLocaleString()}</span>
                            </div>

                            {/* Platform's and vendor's own split of that order — separate from
                                what the buyer sees above. */}
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground pt-0.5">Platform & Vendor Split</p>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Platform Commission</span>
                              <span className="font-semibold text-primary">₹{offerBreakdown.commission.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Vendor Net</span>
                              <span className="font-semibold text-emerald-600">₹{offerBreakdown.vendorNet.toLocaleString()}</span>
                            </div>
                            {offerBreakdown.discountAmount > 0 && (
                              <p className="text-[10px] text-muted-foreground italic">
                                Discount absorbed by: {offerDiscountAbsorbedBy === 'platform' ? 'Platform (commission reduced)' : offerDiscountAbsorbedBy === 'split' ? 'Split 50-50' : "Seller (vendor's payout reduced)"}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handleGenerateOffer}
                      disabled={isGeneratingOffer}
                      className="w-full bg-b2b-orange hover:bg-b2b-orange/90 text-white font-bold"
                    >
                      {isGeneratingOffer ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✉️ Send Statement & Request Payment'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Custom Sourcing Term Adjustment Dialog Popup */}
              <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adjust Sourcing Proposal Terms</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4 text-sm">
                    <CatalogSlabDialogBanner metadata={modifyMetadata || selectedConversation} liveQuantity={modifyQty} />

                    <div className="space-y-2">
                      <label className="font-semibold text-xs">Adjusted Unit Sourcing Price (₹) *</label>
                      <Input
                        type="number"
                        placeholder="e.g. 1000"
                        value={modifyPrice}
                        onChange={(e) => setModifyPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-semibold text-xs">Adjusted Sourcing Volume *</label>
                      <Input
                        type="number"
                        placeholder="e.g. 100"
                        value={modifyQty}
                        onChange={(e) => setModifyQty(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                        Modification Reason / Remark *
                      </label>
                      <Textarea
                        placeholder="Explain why terms were adjusted (e.g. Volume discount applied, special delivery surcharge, tier pricing adjustment)..."
                        value={modifyNotes}
                        onChange={(e) => setModifyNotes(e.target.value)}
                        rows={3}
                        className="text-xs"
                      />
                    </div>

                    {modifyPrice && modifyQty && (
                      <div className="p-3 bg-muted rounded-xl text-xs space-y-1.5 border border-slate-200">
                        <p className="font-bold border-b pb-1 text-slate-800">Financial Splits Calculation</p>
                        {modifyBreakdownLoading && !modifyBreakdown ? (
                          <p className="text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Calculating...</p>
                        ) : modifyBreakdown ? (
                          <>
                            <div className="flex justify-between">
                              <span>Product Base Value:</span>
                              <span className="font-bold">₹{modifyBreakdown.rawOrderValue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-indigo-600">
                              <span>Platform Commission:</span>
                              <span className="font-bold">- ₹{modifyBreakdown.commission.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 font-bold">
                              <span>Expected Vendor Settlement:</span>
                              <span>₹{modifyBreakdown.vendorNet.toLocaleString()}</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-destructive">Could not load breakdown.</p>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handleModifyTermsSubmit}
                      disabled={isModifyingTerms || !modifyPrice || !modifyQty || !modifyNotes.trim()}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    >
                      {isModifyingTerms ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm & Apply Terms Adjustment'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {selectedConversation?.isGroup && selectedConversation?.groupType === 'order_group' && !selectedConversation?.canIntervene ? (
                  <span className="text-amber-500 font-bold uppercase tracking-widest text-[9px] animate-pulse">⚠️ Passive Spectator Mode Active</span>
                ) : (
                  <>You are responding as <span className="font-medium"><span className="font-extrabold text-black">J</span>umma<span className="font-extrabold text-b2b-gst">B</span>aba<span className="text-b2b-orange">.com</span> Support</span></>
                )}
              </p>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-b2b-orange/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-b2b-orange" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Unified Admin Inbox
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Select a conversation to start mediating between buyers and vendors.
                All communications flow through JummaBaba Support.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
