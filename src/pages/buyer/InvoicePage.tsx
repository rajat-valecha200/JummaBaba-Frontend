import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

export default function InvoicePage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const rfqRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${rfqId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jummababa_token')}`
          }
        });
        if (rfqRes.ok) {
          const rfqData = await rfqRes.json();
          setRfq(rfqData);
        }

        const offerRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/rfqs/${rfqId}/offer`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jummababa_token')}`
          }
        });
        if (offerRes.ok) {
          const offerData = await offerRes.json();
          setOffer(offerData);
        }
      } catch (e) {
        console.error('Failed to load invoice details', e);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceData();
  }, [rfqId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Triggers standard print dialog configured to "Save as PDF" cleanly
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!rfq || !offer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-sm">
        <p className="text-muted-foreground mb-4">Invoice details could not be found or are not ready yet.</p>
        <Button onClick={() => navigate('/buyer/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const basePrice = Number(offer.negotiated_price);
  const quantity = Number(offer.quantity);
  const subtotal = basePrice * quantity;
  const discountVal = Number(offer.discount_percentage || 0) / 100;
  const discountAmount = subtotal * discountVal;
  const discountedSubtotal = subtotal - discountAmount;
  
  const platformCommissionRate = Math.min(0.10, Math.max(0.08, discountVal > 0 ? discountVal : 0.09));
  const platformCommission = discountedSubtotal * platformCommissionRate;
  
  const gst = discountedSubtotal * 0.18;
  const shipping = discountedSubtotal > 50000 ? 0 : 2500;
  const total = discountedSubtotal + gst + shipping;

  const invoiceId = `JB-INV-${rfq.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0 print:m-0">
      {/* Action Header Bar (Hidden during printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => navigate('/buyer/orders')} className="gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex gap-3">
          <Button onClick={handlePrint} variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50 text-slate-700">
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Button onClick={handleDownloadPDF} className="gap-2 bg-b2b-orange hover:bg-b2b-orange/90 text-white shadow-md">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Sheet */}
      <Card className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        <CardContent className="p-8 sm:p-12 space-y-8">
          
          {/* Top Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-2">
              <div className="text-3xl font-black text-b2b-orange tracking-tight">
                Jumma<span className="text-teal-700">Baba</span><span className="text-b2b-orange">.com</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                JummaBaba.com Marketplace Pvt Ltd<br />
                GSTIN: 27AABCJ1234A1Z5 | PAN: AABCJ1234A
              </p>
            </div>
            <div className="sm:text-right space-y-1">
              <h1 className="text-xl font-bold text-slate-800 tracking-wider">TAX INVOICE</h1>
              <p className="text-xs text-slate-500"><strong>Invoice Number:</strong> {invoiceId}</p>
              <p className="text-xs text-slate-500"><strong>Billing Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid sm:grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <h3 className="font-bold text-teal-700 text-xs uppercase tracking-wider">Billed To (Buyer)</h3>
              <p className="font-semibold text-slate-800">{rfq.buyer_name || 'B2B Client'}</p>
              {rfq.buyer_email && <p className="text-slate-500 text-xs">{rfq.buyer_email}</p>}
              {rfq.buyer_phone && <p className="text-slate-500 text-xs">{rfq.buyer_phone}</p>}
            </div>
            <div className="space-y-2 sm:text-right">
              <h3 className="font-bold text-teal-700 text-xs uppercase tracking-wider">Service Provider</h3>
              <p className="font-semibold text-slate-800">JummaBaba.com Office</p>
              <p className="text-slate-500 text-xs">123, Trade Centre, Andheri East</p>
              <p className="text-slate-500 text-xs">Mumbai, Maharashtra - 400069</p>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4 text-left">Product / Sourcing Requirement</th>
                  <th className="p-4 text-center">Quantity</th>
                  <th className="p-4 text-right">Negotiated Rate</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100">
                <tr>
                  <td className="p-4 text-left align-top">
                    <p className="font-semibold">{rfq.product_name || 'Agreed Industrial Item'}</p>
                    <p className="text-xs text-slate-400 mt-1 italic">{rfq.description || 'Custom specifications match.'}</p>
                  </td>
                  <td className="p-4 text-center align-top">{quantity} {rfq.unit || 'units'}</td>
                  <td className="p-4 text-right align-top">{formatPrice(basePrice)}</td>
                  <td className="p-4 text-right align-top font-semibold">{formatPrice(subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Breakdown & Seals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4">
            
            {/* Watermark/Seal (Hidden during standard screen viewing but printable/professional) */}
            <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 max-w-xs">
              <ShieldCheck className="h-10 w-10 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-800">
                <p className="font-bold uppercase tracking-wider mb-0.5">Verified & Secured</p>
                <p className="opacity-90">This transaction has been routed through JummaBaba Escrow services.</p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-80 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Product Base Cost:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Agreed Discount ({offer.discount_percentage}%):</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Platform Commission (Included):</span>
                <span>{formatPrice(platformCommission)} ({(platformCommissionRate * 100).toFixed(0)}%)</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (18%):</span>
                <span>{formatPrice(gst)}</span>
              </div>
              <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
                <span>Shipping / Logistics:</span>
                <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-extrabold text-base pt-1">
                <span>Total Amount:</span>
                <span className="text-b2b-orange">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Legal / Notes footer */}
          <div className="text-center text-[10px] text-slate-400 mt-12 border-t border-slate-100 pt-6">
            <p>This is a computer-generated Tax Invoice under the authority of JummaBaba.com and requires no physical signature.</p>
            <p className="mt-1">For any queries, please reach out to support@jummababa.com or contact us on the platform messenger.</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
