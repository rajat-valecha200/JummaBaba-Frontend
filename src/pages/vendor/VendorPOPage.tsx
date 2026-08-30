import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { computeOrderBreakdown } from '@/lib/orderBreakdown';

// Same pattern as buyer/InvoicePage.tsx (client-side render + window.print()/html2pdf, no
// server-generated document to fetch) — reused deliberately rather than the earlier approach of
// opening the backend's pre-rendered PO HTML file, since Print/Download here already work and
// are already tested.
//
// Deliberately does NOT show Platform Commission — a Purchase Order tells the seller what to
// supply, at what price, to whom; commission/settlement is a platform-vendor financial matter
// that belongs on the Earnings page and the Order Summary panel, not on the PO itself. Also
// never shows the buyer's email/phone — same privacy rule as everywhere else this session
// (rfqService.js listRfqs) — only Name + delivery address, which a PO legitimately needs.
export default function VendorPOPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const poRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rfqId) return;
    const fetchData = async () => {
      try {
        setRfq(await api.rfqs.get(rfqId));
      } catch (e) {
        console.error('Failed to load purchase order details', e);
      }
      setLoading(false);
    };
    fetchData();
  }, [rfqId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!poRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          filename: `${poId}.pdf`,
          margin: 0.3,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        })
        .from(poRef.current)
        .save();
    } catch (e) {
      console.error('Failed to generate PO PDF', e);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-sm">
        <p className="text-muted-foreground mb-4">Purchase Order details could not be found or are not ready yet.</p>
        <Button onClick={() => navigate('/vendor/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const bd = computeOrderBreakdown(rfq);
  const poId = `JB-PO-${rfq.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      {/* Action Header Bar (hidden during printing) */}
      <div className="max-w-4xl mx-auto flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => navigate('/vendor/orders')} className="gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex gap-3">
          <Button onClick={handlePrint} variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50 text-slate-700">
            <Printer className="h-4 w-4" />
            Print PO
          </Button>
          <Button onClick={handleDownloadPDF} disabled={downloading} className="gap-2 bg-b2b-orange hover:bg-b2b-orange/90 text-white shadow-md">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? 'Preparing...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* PO Sheet */}
      <Card ref={poRef} className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden print:max-w-none print:border-0 print:shadow-none print:rounded-none">
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
              <h1 className="text-xl font-bold text-slate-800 tracking-wider">PURCHASE ORDER</h1>
              <p className="text-xs text-slate-500"><strong>PO Number:</strong> {poId}</p>
              <p className="text-xs text-slate-500"><strong>Order Date:</strong> {new Date(rfq.created_at || Date.now()).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid sm:grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <h3 className="font-bold text-teal-700 text-xs uppercase tracking-wider">Issued To (Seller)</h3>
              <p className="font-semibold text-slate-800">{rfq.vendor_business_name || rfq.business_name || 'Registered Seller'}</p>
            </div>
            {/* Ship-to: name + delivery address only — a PO legitimately needs to know where to
                send the goods, but the buyer's email/phone must never reach the seller (see
                rfqService.js listRfqs's privacy rule, applied everywhere else this session). */}
            <div className="space-y-2 sm:text-right">
              <h3 className="font-bold text-teal-700 text-xs uppercase tracking-wider">Ship To</h3>
              <p className="font-semibold text-slate-800">{rfq.buyer_name || 'B2B Client'}</p>
              {rfq.delivery_location && <p className="text-slate-500 text-xs">{rfq.delivery_location}</p>}
            </div>
          </div>

          {/* PO Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4 text-left">Product / Sourcing Requirement</th>
                  <th className="p-4 text-center">Quantity</th>
                  <th className="p-4 text-right">Agreed Rate</th>
                  <th className="p-4 text-right">Order Value</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100">
                <tr>
                  <td className="p-4 text-left align-top">
                    <p className="font-semibold">{rfq.product_name || 'Agreed Industrial Item'}</p>
                    <p className="text-xs text-slate-400 mt-1 italic">{rfq.description || 'Custom specifications match.'}</p>
                  </td>
                  <td className="p-4 text-center align-top">{bd.quantity} {rfq.unit || 'units'}</td>
                  <td className="p-4 text-right align-top">{formatPrice(bd.unitPrice)}</td>
                  <td className="p-4 text-right align-top font-semibold">{formatPrice(bd.baseAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total & Seal — no GST/commission breakdown here on purpose; this is what the
              buyer agreed to receive at, full stop. Settlement math lives on the Earnings page. */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4">
            <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 max-w-xs">
              <ShieldCheck className="h-10 w-10 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-800">
                <p className="font-bold uppercase tracking-wider mb-0.5">Confirmed Order</p>
                <p className="opacity-90">Buyer's payment for this order was verified by JummaBaba before confirmation.</p>
              </div>
            </div>

            <div className="w-full sm:w-80 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-800 font-extrabold text-base pt-1">
                <span>Order Value:</span>
                <span className="text-b2b-orange">{formatPrice(bd.baseAmount)}</span>
              </div>
            </div>
          </div>

          {/* Legal / Notes footer */}
          <div className="text-center text-[10px] text-slate-400 mt-12 border-t border-slate-100 pt-6">
            <p>This is a computer-generated Purchase Order issued via JummaBaba.com and requires no physical signature.</p>
            <p className="mt-1">For any queries, please reach out to support@jummababa.com or contact us on the platform messenger.</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
