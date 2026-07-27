import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Package, User, Building, MapPin, Info, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { OrderTracking } from '@/components/orders/OrderTracking';
import { OrderGroupSummaryPanel } from '@/components/orders/OrderGroupSummaryPanel';
import { RfqAuditTrail } from '@/components/orders/RfqAuditTrail';
import { buildAuditTrail } from '@/lib/auditTrail';
import { RfqTimeline, getRfqSteps } from '@/components/b2b/RfqTimeline';

const BACK_PATH: Record<string, string> = {
  buyer: '/buyer/rfqs',
  vendor: '/vendor/rfqs',
  admin: '/admin/rfqs',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  responded: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ordered: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  confirmed: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  shipped: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delivered: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
  closed: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
};

export default function RfqDetailPage({ role }: { role: 'buyer' | 'vendor' | 'admin' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rfq, setRfq] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!id) return;
    try {
      const [rfqData, timelineData] = await Promise.all([
        api.rfqs.get(id),
        api.rfqs.getTimeline(id).catch(() => []),
      ]);
      setRfq(rfqData);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
    } catch (e) {
      console.error('Failed to load RFQ detail', e);
      toast({ title: 'Error', description: 'Failed to load this record.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 20000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rfq) {
    return <div className="p-8 text-center text-muted-foreground">Record not found.</div>;
  }

  const auditEntries = buildAuditTrail(timeline);
  const hasOrder = ['ordered', 'confirmed', 'shipped', 'delivered', 'completed'].includes(rfq.status);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="outline" size="icon" onClick={() => navigate(BACK_PATH[role])} className="rounded-full flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-foreground truncate">{rfq.product_name || 'Sourcing Requirement'}</h1>
              <Badge className={cn("px-3 py-1 font-black text-[10px] uppercase tracking-widest flex-shrink-0", STATUS_STYLES[rfq.status] || STATUS_STYLES.pending)}>
                {rfq.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">Reference: {rfq.id}</p>
          </div>
        </div>

        {(rfq.order_group_id || rfq.negotiation_group_id) && (
          <Link to={`/${role}/messages?chatGroupId=${rfq.order_group_id || rfq.negotiation_group_id}`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs rounded-xl flex-shrink-0">
              <MessageSquare className="h-4 w-4" /> {rfq.order_group_id ? 'Go to Order Chat' : 'Go to Chat Room'}
            </Button>
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: lifecycle + tracking + audit trail */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Purchase Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <RfqTimeline steps={getRfqSteps(rfq.status, rfq.moderation_status)} />
            </CardContent>
          </Card>

          {hasOrder && (
            <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="pt-6">
                <OrderTracking
                  currentStatus={rfq.status}
                  orderNumber={`ORD-${rfq.id.slice(0, 8).toUpperCase()}`}
                  orderDate={rfq.created_at}
                  shippingCarrier={rfq.shipping_details?.shippingCarrier || rfq.shipping_details?.carrier}
                  trackingNumber={rfq.shipping_details?.trackingNumber || rfq.shipping_details?.awb}
                  shippedAt={rfq.shipping_details?.shippedAt}
                  deliveredAt={rfq.shipping_details?.deliveredAt}
                  dispatchLocation={rfq.shipping_details?.dispatchLocation}
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Info className="h-3.5 w-3.5" /> Full Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <RfqAuditTrail entries={auditEntries} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: financial summary + stakeholders */}
        <div className="space-y-6">
          {hasOrder && (
            <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden p-0">
              <OrderGroupSummaryPanel rfq={rfq} role={role} />
            </Card>
          )}

          <Card className="border-none shadow-sm bg-slate-900 text-white rounded-2xl overflow-hidden">
            <CardHeader className="py-4 border-b border-white/10">
              <CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">Stakeholders</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 bg-white text-foreground">
              {role !== 'buyer' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <User className="h-3 w-3" /> Buyer
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{rfq.buyer_name || 'Verified Client'}</p>
                    {role === 'admin' && <p className="text-xs text-muted-foreground">{rfq.buyer_email}</p>}
                    <div className="flex items-start gap-2 mt-2 p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <p>{rfq.delivery_location || 'Address on file'}</p>
                    </div>
                  </div>
                </div>
              )}

              {role !== 'buyer' && role !== 'vendor' && <Separator />}

              {role !== 'vendor' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Building className="h-3 w-3" /> Vendor
                  </div>
                  <div>
                    <p className="font-bold text-primary">{rfq.vendor_business_name || 'Premium Supplier'}</p>
                  </div>
                </div>
              )}

              {role === 'buyer' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Package className="h-3 w-3" /> Requirement
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rfq.quantity} {rfq.unit || 'units'} @ {formatPrice(rfq.target_price)}/unit
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
