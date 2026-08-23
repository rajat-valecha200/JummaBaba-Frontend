import React, { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

interface QuoteEstimate {
  orderValue: number;
  gstRate: number;
  gst: number;
  buyerTotal: number;
  commission: number;
  vendorNet: number;
}

interface QuoteFormProps {
  rfqId?: string;
  onSubmit: (details: any) => void;
  isLoading?: boolean;
  initialPrice?: number | null;
  initialQuantity?: number;
}

export function QuoteForm({ rfqId, onSubmit, isLoading, initialPrice, initialQuantity }: QuoteFormProps) {
  // The RFQ's quantity is already fixed by the negotiation that happened before this was
  // forwarded — the vendor is only ever confirming or adjusting the ONE price for that ONE
  // quantity, not defining tiered pricing (that's a product-listing concept, not a quote-on-
  // a-specific-RFQ concept). So this is a single price field, not a slab table.
  const [price, setPrice] = useState<string>(initialPrice ? String(initialPrice) : '');
  const [leadTime, setLeadTime] = useState('');
  const [notes, setNotes] = useState('');
  const [estimate, setEstimate] = useState<QuoteEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  // Give the vendor the exact same transparency the buyer gets — order value, GST, total —
  // plus what only the vendor needs to see: platform commission and their real net payout.
  // Computed server-side so it matches actual settlement math, not a frontend guess.
  useEffect(() => {
    const numPrice = Number(price);
    if (!rfqId || !numPrice || numPrice <= 0) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    setEstimateLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await api.rfqs.getQuoteEstimate(rfqId, numPrice);
        if (!cancelled) setEstimate(result);
      } catch (err) {
        if (!cancelled) setEstimate(null);
      } finally {
        if (!cancelled) setEstimateLoading(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [rfqId, price]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      price_slabs: [{ min_quantity: Number(initialQuantity) || 0, unit_price: Number(price) || 0 }],
      lead_time: leadTime,
      vendor_notes: notes,
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
    });
  };

  return (
    <Card className="border-border bg-white shadow-2xl rounded-3xl overflow-hidden border-none max-h-[90vh] flex flex-col">
      <CardHeader className="border-b bg-slate-50/50 p-6 flex-shrink-0">
        <CardTitle className="text-xl font-black uppercase tracking-tighter text-slate-900">Submit Formal Quote</CardTitle>
      </CardHeader>
      <CardContent className="p-6 overflow-y-auto min-h-0 flex-1 scrollbar-thin">
        {initialPrice && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Buyer's Target</p>
              <p className="text-sm font-bold text-slate-700">
                {initialQuantity} units @ <span className="text-primary">{initialPrice ? `₹${initialPrice}` : 'N/A'}</span>
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
              Prefilled for you
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Your Price (₹/unit) {initialQuantity ? `for ${initialQuantity} units` : ''}
              </Label>
              <Input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="h-12 bg-slate-50 border-slate-200 text-primary placeholder:text-primary/20 focus:bg-white transition-all font-black text-lg rounded-xl px-4"
                placeholder="0.00"
                required
              />
              <p className="text-[10px] text-slate-400 px-1">Agreed as-is, or enter your own price if you need to adjust it.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Delivery Lead Time</Label>
              <Input
                placeholder="Ex: 5-7 working days"
                value={leadTime}
                onChange={e => setLeadTime(e.target.value)}
                className="h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all font-medium rounded-xl px-4"
              />
            </div>
          </div>

          {(estimate || estimateLoading) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Estimated Breakdown at This Price</p>
              {estimateLoading && !estimate ? (
                <p className="text-xs text-slate-400 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Calculating...</p>
              ) : estimate && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Order Value ({initialQuantity} units)</span>
                    <span className="font-semibold text-slate-800">₹{estimate.orderValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">GST ({estimate.gstRate}%, buyer pays)</span>
                    <span className="font-semibold text-slate-800">₹{estimate.gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Buyer's Total Bill</span>
                    <span className="font-semibold text-slate-800">₹{estimate.buyerTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Platform Commission</span>
                    <span className="font-semibold text-destructive">− ₹{estimate.commission.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="font-bold text-slate-900">You'll Earn</span>
                    <span className="font-black text-primary">₹{estimate.vendorNet.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">Paid out after the buyer confirms delivery and JummaBaba releases settlement.</p>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Terms & Special Notes</Label>
            <Textarea 
              placeholder="Specify payment terms, shipping conditions, etc." 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all min-h-[120px] text-sm rounded-xl p-4 resize-none"
            />
          </div>

          <div className="pt-2 sticky bottom-0 bg-white">
            <Button 
              type="submit" 
              className="w-full h-14 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white border-none text-xs group rounded-2xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Submitting Quote...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                  Send Quote for Review
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
