import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PriceSlab {
  min_quantity: number;
  unit_price: number;
}

interface QuoteFormProps {
  onSubmit: (details: any) => void;
  isLoading?: boolean;
  initialPrice?: number | null;
  initialQuantity?: number;
}

export function QuoteForm({ onSubmit, isLoading, initialPrice, initialQuantity }: QuoteFormProps) {
  const [slabs, setSlabs] = useState<any[]>([{ min_quantity: initialQuantity || 1, unit_price: initialPrice || '' }]);
  const [leadTime, setLeadTime] = useState('');
  const [notes, setNotes] = useState('');

  const addSlab = () => setSlabs([...slabs, { min_quantity: '', unit_price: '' }]);
  const removeSlab = (index: number) => setSlabs(slabs.filter((_, i) => i !== index));
  
  const updateSlab = (index: number, field: string, value: string) => {
    const newSlabs = [...slabs];
    newSlabs[index] = { ...newSlabs[index], [field]: value };
    setSlabs(newSlabs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      price_slabs: slabs.map(s => ({
        min_quantity: Number(s.min_quantity) || 0,
        unit_price: Number(s.unit_price) || 0
      })),
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
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">Pricing Configuration</Label>
            {slabs.map((slab, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index} 
                className="flex items-end gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm"
              >
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Min Quantity</Label>
                  <Input 
                    type="number" 
                    value={slab.min_quantity} 
                    onChange={e => updateSlab(index, 'min_quantity', e.target.value)}
                    className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-primary/20 transition-all font-bold rounded-xl"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Unit Price (₹)</Label>
                  <Input 
                    type="number" 
                    value={slab.unit_price} 
                    onChange={e => updateSlab(index, 'unit_price', e.target.value)}
                    className="h-11 bg-white border-slate-200 text-primary placeholder:text-primary/20 focus:ring-primary/20 transition-all font-black text-lg rounded-xl"
                    placeholder="0.00"
                  />
                </div>
                {index > 0 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeSlab(index)}
                    className="h-11 w-11 text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addSlab}
              className="w-full h-11 border-dashed border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-500 hover:text-primary transition-all text-[10px] font-black uppercase tracking-[0.2em] rounded-xl"
            >
              <Plus className="h-3 w-3 mr-2" /> Add Price Slab
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
