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
  Settings
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

function CatalogSlabDialogBanner({ metadata }: { metadata?: any }) {
  const meta = metadata || {};
  const [slabInfo, setSlabInfo] = useState<{ price: number; range?: string } | null>(() => {
    if (meta.catalog_slab_price) {
      return { price: Number(meta.catalog_slab_price), range: meta.catalog_slab_range };
    }
    return null;
  });

  useEffect(() => {
    if (meta.catalog_slab_price) {
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
            const qNum = Number(meta.quantity || meta.requested_quantity || meta.qty) || 0;
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
        console.error('Failed to lookup catalog slab for dialog:', err);
      }
    };

    fetchSlab();
    return () => { isMounted = false; };
  }, [meta.product_id, meta.product_name, meta.productName, meta.quantity, meta.requested_quantity, meta.catalog_slab_price]);

  const targetPrice = meta.target_price || meta.targetPrice || meta.linkedProductPrice;

  return (
    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1.5 shadow-sm">
      <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Catalog Slab Rate {slabInfo?.range ? `(${slabInfo.range})` : ''}:
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
  const [errorMsg, setErrorMsg] = useState<string>('');

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

          {userRole === 'admin' && (
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
              {userRole === 'vendor' && (!metadata.rfq_status || metadata.rfq_status === 'pending') && (
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
          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Official Commercial Quotation</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Direct Vendor Quote</p>
            </div>
          </div>

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

          {userRole !== 'buyer' && userRole !== 'vendor' && (
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] py-1 border border-emerald-500/10">
                Awaiting Buyer Decision
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Value:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{Number(metadata.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-semibold text-foreground">{metadata.quantity} {metadata.unit}</span>
            </div>
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
            <Link to="/vendor/orders" className="block mt-2">
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
      const discountVal = Number(metadata.discount_percentage) || 0;
      const baseTotalVal = Number(metadata.negotiated_price) * Number(metadata.quantity);
      const savings = baseTotalVal * (discountVal / 100);
      const finalTotalVal = baseTotalVal - savings;
      
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-b2b-orange/25 bg-b2b-orange/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-b2b-orange/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-b2b-orange/10 text-b2b-orange">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Negotiated Coupon Offer</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Agreed Sourcing Deal</p>
            </div>
          </div>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per Unit:</span>
              <span className="font-bold text-foreground">₹{Number(metadata.negotiated_price).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity Agreed:</span>
              <span className="font-bold text-foreground">{metadata.quantity} units</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Special Discount:</span>
                <span>{discountVal}% Off (-₹{savings.toLocaleString('en-IN')})</span>
              </div>
            )}
            <div className="flex justify-between border-t border-b2b-orange/10 pt-2 text-sm font-black">
              <span>Total Value:</span>
              <span className="text-b2b-orange">₹{finalTotalVal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-b2b-orange/20 text-center">
            {userRole === 'buyer' ? (
              <Link to={`/buyer/checkout?rfqId=${metadata.rfq_id}`}>
                <Button className="w-full bg-b2b-orange hover:bg-b2b-orange/90 text-white font-bold h-9 rounded-lg">
                  ⚡ Proceed to Checkout
                </Button>
              </Link>
            ) : (
              <Badge className="bg-b2b-orange/10 text-b2b-orange border border-b2b-orange/25 py-1 text-[10px] uppercase font-bold tracking-wider">
                {userRole === 'admin' ? 'Offer Sent to Buyer' : 'Special Offer Generated'}
              </Badge>
            )}
          </div>
        </div>
      );

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
                <>
                  <div className="flex justify-between text-indigo-600 font-semibold">
                    <span>Platform Commission Fee (10%):</span>
                    <span>- ₹{(Number(metadata.price) * Number(metadata.quantity) * 0.10).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Vendor Settlement Payout:</span>
                    <span>₹{(Number(metadata.price) * Number(metadata.quantity) * 0.90).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
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
            <div className="border-t border-slate-200/50 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product Base Value:</span>
                <span className="font-bold">₹{(Number(metadata.price) * Number(metadata.quantity)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Platform Commission Fee (10%):</span>
                <span>- ₹{(Number(metadata.price) * Number(metadata.quantity) * 0.1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold border-t border-dashed border-emerald-500/10 pt-1 text-xs">
                <span>Vendor Net Settlement Payout:</span>
                <span>₹{(Number(metadata.price) * Number(metadata.quantity) * 0.9).toLocaleString()}</span>
              </div>
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

    case 'rfq_payment_request':
      const breakdown = metadata.breakdown || {};
      return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 backdrop-blur-md p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b border-indigo-500/20 pb-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Sourcing Statement & Payment Request</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">JummaBaba Billing Invoice</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700 bg-white/50 p-3 rounded-lg border border-indigo-500/10 mb-2">
            <div className="flex justify-between">
              <span>Agreed Price:</span>
              <span className="font-bold text-foreground">₹{Number(breakdown.price).toLocaleString()} / Unit</span>
            </div>
            <div className="flex justify-between">
              <span>Agreed Quantity:</span>
              <span className="font-bold text-foreground">{breakdown.quantity} units</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1 mt-1 text-foreground">
              <span>Subtotal Sourcing Cost:</span>
              <span>₹{Number(breakdown.baseAmount).toLocaleString()}</span>
            </div>
            {Number(breakdown.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({breakdown.discountPercentage}% off):</span>
                <span>-₹{Number(breakdown.discountAmount).toLocaleString()}</span>
              </div>
            )}
            {Number(breakdown.platformFee) > 0 && (
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>
                  Platform Service Commission
                  {Number(breakdown.discountedBase) > 0 ? ` (${((Number(breakdown.platformFee) / Number(breakdown.discountedBase)) * 100).toFixed(1)}%)` : ''}:
                </span>
                <span>₹{Number(breakdown.platformFee).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>GST Tax (18%):</span>
              <span>₹{Number(breakdown.gst).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black border-t border-double pt-1.5 mt-1.5 text-indigo-600 text-sm">
              <span>Total Buyer Payable:</span>
              <span>₹{Math.round(Number(breakdown.finalAmount)).toLocaleString()}</span>
            </div>
          </div>
          <Badge className="w-full justify-center bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 py-1 text-[10px] uppercase font-bold tracking-wider">
            Awaiting Buyer Payment
          </Badge>
        </div>
      );

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
  const [offerDiscount, setOfferDiscount] = useState('');
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);

  // Term adjustment dialog state
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [modifyPrice, setModifyPrice] = useState('');
  const [modifyQty, setModifyQty] = useState('');
  const [modifyNotes, setModifyNotes] = useState('');
  const [modifyRfqId, setModifyRfqId] = useState('');
  const [isModifyingTerms, setIsModifyingTerms] = useState(false);

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
      const rfqId = selectedConversation.rfqId;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${rfqId}/payment-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jb_token')}`
        },
        body: JSON.stringify({
          discountPercentage: Number(offerDiscount) || 0
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send payment request');
      }

      setShowOfferDialog(false);
      setOfferPrice('');
      setOfferQty('');
      setOfferDiscount('');
      fetchConversations();
      fetchMessages();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsGeneratingOffer(false);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
      setSelectedConversation(prev => {
        if (!prev) return prev;
        const fresh = mapped.find(c => c.id === prev.id);
        if (!fresh) return prev;
        if (
          prev.negotiationStep === fresh.negotiationStep &&
          prev.directChatActive === fresh.directChatActive &&
          prev.canIntervene === fresh.canIntervene
        ) {
          return prev;
        }
        return { ...prev, negotiationStep: fresh.negotiationStep, directChatActive: fresh.directChatActive, canIntervene: fresh.canIntervene };
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

  useEffect(() => {
    if (conversations.length === 0) return;
    const params = new URLSearchParams(location.search);
    const chatGroupId = params.get('chatGroupId') || params.get('groupId');
    const rfqId = params.get('rfqId');

    if (chatGroupId) {
      const found = conversations.find(c => c.id === chatGroupId);
      if (found && (!selectedConversation || selectedConversation.id !== found.id)) {
        openConversation(found);
      }
    } else if (rfqId) {
      const found = conversations.find(c => c.rfqId === rfqId);
      if (found && (!selectedConversation || selectedConversation.id !== found.id)) {
        openConversation(found);
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
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // 3s for active chat
      return () => clearInterval(interval);
    }
  }, [selectedConversation?.id, fetchMessages]);

  useEffect(() => {
    if (selectedConversation?.isGroup && selectedConversation?.groupType === 'order_group' && selectedConversation?.rfqId) {
      const fetchOrderRfq = () => api.rfqs.get(selectedConversation.rfqId!).then(setOrderRfq).catch(() => {});
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
          "w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card",
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
        <div className={cn(
          "flex-1 flex flex-col bg-background",
          !selectedConversation && "hidden md:flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-border bg-card flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="flex-shrink-0"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative">
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

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {selectedConversation.participantName}
                    </span>
                    {selectedConversation.isVerified && (
                      <Shield className="h-4 w-4 text-b2b-orange" />
                    )}
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      selectedConversation.isGroup 
                        ? (selectedConversation.groupType === 'order_group' ? "border-purple-500 text-purple-500 bg-purple-50/50" : "border-teal-500 text-teal-500 bg-teal-50/50")
                        : (selectedConversation.participantType === 'buyer' ? "border-blue-500 text-blue-400" : "border-b2b-orange text-b2b-orange")
                    )}>
                      {selectedConversation.isGroup ? (selectedConversation.groupType === 'order_group' ? 'Order Group' : 'Negotiation') : (selectedConversation.participantType === 'buyer' ? 'Buyer' : 'Vendor')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
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
              {selectedConversation.participantType === 'buyer' && selectedConversation.linkedProductName && (
                <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Product Inquiry:</span>
                  <span className="font-medium text-foreground">{selectedConversation.linkedProductName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-b2b-orange font-medium">{selectedConversation.linkedVendorName}</span>
                </div>
              )}

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
                    
                    if (isSystem) {
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
                         This will generate the final invoice billing statement and payment request for the Buyer. You can optionally apply a discount coupon percentage below.
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
                       
                       <div className="space-y-2">
                         <label className="font-semibold text-xs">Apply Discount Coupon Percentage (%)</label>
                         <Input 
                           type="number" 
                           placeholder="e.g. 10 (Optional)" 
                           value={offerDiscount}
                           onChange={(e) => setOfferDiscount(e.target.value)}
                         />
                       </div>

                       <div className="bg-slate-50 p-3 rounded-lg border space-y-1 text-xs text-indigo-600">
                         <div className="flex justify-between">
                           <span>Discount Applied:</span>
                           <span>{offerDiscount ? `${offerDiscount}%` : '0%'}</span>
                         </div>
                         <div className="flex justify-between font-bold">
                           <span>Total Buyer Payable (Incl GST 18% + platform fee):</span>
                           <span>
                             ₹{Math.round(
                               (Number(selectedConversation?.linkedProductPrice || 0) * Number(selectedConversation?.linkedProductQty || 0) * (1 - (Number(offerDiscount) || 0) / 100)) * 1.18 + 
                               (Number(selectedConversation?.linkedProductPrice || 0) * Number(selectedConversation?.linkedProductQty || 0) * (1 - (Number(offerDiscount) || 0) / 100)) * 0.10
                             ).toLocaleString()}
                           </span>
                         </div>
                       </div>

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
                      <CatalogSlabDialogBanner metadata={modifyMetadata || selectedConversation} />

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
                          <div className="flex justify-between">
                            <span>Product Base Value:</span>
                            <span className="font-bold">₹{(Number(modifyPrice) * Number(modifyQty)).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-indigo-600">
                            <span>Platform Fee Commission (10%):</span>
                            <span className="font-bold">- ₹{(Number(modifyPrice) * Number(modifyQty) * 0.10).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>Expected Vendor Settlement (90%):</span>
                            <span>₹{(Number(modifyPrice) * Number(modifyQty) * 0.90).toLocaleString()}</span>
                          </div>
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
