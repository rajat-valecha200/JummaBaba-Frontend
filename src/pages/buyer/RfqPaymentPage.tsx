import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  QrCode, 
  Ticket,
  AlertCircle,
  Loader2, 
  Package, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { playNotificationChime } from '@/lib/sound';

export default function RfqPaymentPage() {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rfq, setRfq] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UTR submission state
  const [utrNumber, setUtrNumber] = useState('');
  const [agreedEscrow, setAgreedEscrow] = useState(false);
  const [agreedDetails, setAgreedDetails] = useState(false);

  const fetchRfqDetails = async () => {
    if (!rfqId) return;
    try {
      setIsLoading(true);
      const data = await api.rfqs.get(rfqId);
      
      let details = typeof data.response_details === 'string' 
        ? JSON.parse(data.response_details) 
        : data.response_details || {};
      
      if (details.response_details && typeof details.response_details === 'object') {
        details = { ...details, ...details.response_details };
      }

      const normalized = {
        ...data,
        response_details: details
      };
      
      setRfq(normalized);
    } catch (e: any) {
      console.error('Failed to load RFQ payment page data', e);
      toast({ title: 'Error', description: 'Failed to load sourcing payment details.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqDetails();
  }, [rfqId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Purchase Request Not Found</h2>
        <Button onClick={() => navigate('/buyer/rfqs')}>Back to Sourcing Requests</Button>
      </div>
    );
  }

  // Cost breakdown comes from the backend (initiateOrderPayment, or the older
  // adminSendPaymentRequest flow) — it's the authoritative math (real commission rate, real
  // discount if admin attached one). We never recompute this client-side.
  const breakdown = rfq.response_details?.payment_breakdown || {};
  const hasBreakdown = Object.keys(breakdown).length > 0;

  const price = Number(breakdown.price ?? rfq.target_price ?? rfq.negotiated_price ?? 0);
  const quantity = Number(breakdown.quantity ?? rfq.quantity ?? 0);
  const baseValue = Number(breakdown.baseAmount ?? price * quantity);
  const discountAmount = Number(breakdown.discountAmount || 0);
  // discountType/discountValue (flat ₹ or %) is the current shape from admin's per-quote
  // discount; discountPercentage is the older shape from adminSendPaymentRequest's coupon flow.
  const discountLabel = breakdown.discountType === 'flat'
    ? `₹${breakdown.discountValue} flat OFF`
    : `${breakdown.discountValue ?? breakdown.discountPercentage ?? 0}% OFF`;
  const discountedBase = Number(breakdown.discountedBase ?? baseValue - discountAmount);
  const platformFee = Number(breakdown.platformFee || 0);
  const gst = Number(breakdown.gst || 0);
  // GST rate is admin-configurable — derive the displayed % from the actual bill amounts
  // instead of assuming a fixed rate, which would lie once admin changes it in Settings.
  const gstRate = discountedBase > 0 ? Math.round((gst / discountedBase) * 100) : 18;
  const finalTotal = Number(breakdown.finalAmount ?? discountedBase + platformFee + gst);

  const currentStep = rfq.negotiation_step;

  const handleSubmitPaymentReference = async () => {
    if (!utrNumber.trim()) {
      toast({ title: 'Transaction Reference Required', description: 'Please enter your bank UTR or IMPS reference number.', variant: 'destructive' });
      return;
    }
    if (!agreedEscrow || !agreedDetails) {
      toast({ title: 'Terms Acceptance Required', description: 'Please check both confirmation boxes to proceed.', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.rfqs.buyerSubmitPayment(rfq.id, utrNumber.trim());
      playNotificationChime();
      toast({ title: 'Payment Reference Dispatched!', description: 'Submitted for Admin Verification.' });
      fetchRfqDetails();
    } catch (e: any) {
      toast({ title: 'Submission Failed', description: e.message || 'Could not submit payment reference.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-border/40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/buyer/rfqs')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">RFQ Payment Confirmation</h1>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/5 font-bold uppercase text-[10px]">
                Step 9 / 11
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">Reference: RFQ-{rfq.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <Badge className="bg-slate-900 text-white font-bold text-xs py-1 px-3">
          Payment Verification Active
        </Badge>
      </div>

      {/* State Banner Notifications */}
      {currentStep === 'payment_submitted' && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 flex items-center gap-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 text-white">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-amber-700 dark:text-amber-400">Payment Reference Submitted ✓</h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium">
              Reference UTR: <span className="font-bold underline">{rfq.response_details?.payment_reference || 'Submitted'}</span> — Administrator is verifying bank deposit receipts. Order will elevate to processing upon verification.
            </p>
          </div>
        </div>
      )}

      {['payment_confirmed_escrow', 'ordered', 'confirmed', 'shipped', 'delivered', 'completed'].includes(currentStep) && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Payment Verified!</h4>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">
              Your sourcing payment has been verified. Manufacturing & processing started with vendor <span className="font-bold">{rfq.vendor_business_name || 'Verified Supplier'}</span>.
            </p>
          </div>
          <Button onClick={() => navigate('/buyer/orders')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
            Track Order →
          </Button>
        </div>
      )}

      {/* BookMyShow / Swiggy Style 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (7 Cols - 60% Width): Summary, Breakdown, Escrow Terms, Checkboxes */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Order Specs Summary Card */}
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <Package className="h-4 w-4 text-indigo-600" /> Sourcing Requirement Specifications
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{rfq.product_name || 'Industrial Product Inquiry'}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-md line-clamp-2">{rfq.description || 'No additional specifications specified.'}</p>
                </div>
                <Badge variant="secondary" className="font-bold text-xs bg-indigo-500/10 text-indigo-600">
                  {rfq.quantity} {rfq.unit || 'units'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Supplier Business</p>
                  <p className="font-bold text-foreground mt-0.5">{rfq.vendor_business_name || 'Verified Premium Manufacturer'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Agreed Unit Price</p>
                  <p className="font-bold text-foreground mt-0.5">{formatPrice(price)} / unit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Detailed Itemized Cost Breakdown Card */}
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <FileText className="h-4 w-4 text-indigo-600" /> Itemized Valuation Statement
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Base Gross Value ({quantity} × {formatPrice(price)}):</span>
                <span className="font-bold">{formatPrice(baseValue)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between font-semibold text-emerald-600">
                  <span>Discount ({discountLabel}):</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              {platformFee > 0 && (
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">
                    Platform Service Fee{discountedBase > 0 ? ` (${((platformFee / discountedBase) * 100).toFixed(1)}%)` : ''}:
                  </span>
                  <span>{formatPrice(platformFee)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">GST Statutory Tax ({gstRate}%):</span>
                <span>{formatPrice(gst)}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-sm pt-1">
                <span className="font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Total Net Amount Payable:</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatPrice(finalTotal)}</span>
              </div>

              {!hasBreakdown && (
                <p className="text-[11px] text-amber-600 font-semibold pt-1">
                  Waiting for Admin to issue the official billing statement — figures shown are estimates.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 3. Payment Verification Terms Card */}
          <Card className="border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <ShieldCheck className="h-5 w-5" /> Payment Verification Policy
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your bank transfer is verified by our team before the order is confirmed. Funds are <span className="font-bold text-foreground">NOT released</span> to the vendor until you receive your cargo and confirm satisfactory delivery.
            </p>
          </Card>

          {/* 4. Terms Acceptance Checkboxes */}
          {currentStep === 'payment_pending' && (
            <Card className="border-border/60 shadow-sm rounded-2xl p-5 space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms-escrow"
                  checked={agreedEscrow}
                  onCheckedChange={(checked) => setAgreedEscrow(!!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="terms-escrow" className="text-xs font-semibold text-foreground leading-snug cursor-pointer">
                  I agree to JummaBaba B2B payment terms and understand funds will be verified and held by JummaBaba until final cargo delivery confirmation. *
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="terms-details" 
                  checked={agreedDetails}
                  onCheckedChange={(checked) => setAgreedDetails(!!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="terms-details" className="text-xs font-semibold text-foreground leading-snug cursor-pointer">
                  I confirm that product specifications, volume, and total price of {formatPrice(finalTotal)} are accurate. *
                </label>
              </div>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN (5 Cols - 40% Sticky Width): Coupon, Bank Details, QR Slot, UTR Submission */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Applied Discount Panel — this is an admin-attached per-order discount issued
                 with the billing statement, not a buyer-entered coupon code. */}
          {discountAmount > 0 && (
            <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                  <Ticket className="h-4 w-4 text-indigo-600" /> Discount Applied
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> {rfq.response_details?.coupon_code || 'Special Pricing'} Active
                  </span>
                  <span>{discountLabel}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. Platform Bank Transfer Account Details */}
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <Building2 className="h-4 w-4 text-indigo-600" /> Platform Bank Transfer Details
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name:</span>
                <span className="font-bold text-foreground">JummaBaba Sourcing Pvt Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number:</span>
                <span className="font-mono font-bold text-foreground tracking-wider">923020048172651</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IFSC Code:</span>
                <span className="font-mono font-bold text-foreground">UTIB0000842</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Branch:</span>
                <span className="font-bold text-foreground">Axis Bank — Industrial Finance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Modes:</span>
                <span className="font-bold text-indigo-600">RTGS / IMPS / NEFT</span>
              </div>
            </CardContent>
          </Card>

          {/* 3. UPI QR Code Placeholder Slot (Future extension) */}
          <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 rounded-2xl p-5 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <QrCode className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">UPI Instant QR Code Transfer</h4>
            <p className="text-[11px] text-muted-foreground">Scan & Pay via BHIM / GPay / PhonePe (Admin Upload Slot)</p>
          </Card>

          {/* 4. Payment Reference Submission Form */}
          <Card className="border-2 border-indigo-500/30 shadow-lg rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-indigo-600 text-white pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Deposit Reference Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {currentStep === 'payment_pending' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Bank Transfer UTR / IMPS Reference *
                    </label>
                    <Input
                      placeholder="e.g. UTR2918274619"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="font-mono text-xs h-10 uppercase"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitPaymentReference}
                    disabled={isSubmitting || !utrNumber.trim() || !agreedEscrow || !agreedDetails}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-indigo-600/20"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      `Submit Payment Confirmation (${formatPrice(finalTotal)})`
                    )}
                  </Button>
                </>
              ) : (
                <div className="p-3 bg-muted rounded-xl text-xs space-y-1 text-center font-semibold">
                  <p className="text-muted-foreground">Submitted UTR Reference:</p>
                  <p className="font-mono font-bold text-indigo-600 text-sm">{rfq.response_details?.payment_reference || 'Reference On File'}</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
