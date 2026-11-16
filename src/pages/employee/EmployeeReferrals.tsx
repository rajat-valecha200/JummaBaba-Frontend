import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, Copy, Eye, ExternalLink, Loader2, Lock, MessageCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Everyone this employee referred, task by task (the list comes from the admin's task table): what
// has been released, what is blocked and why, what hasn't started — plus a ready-made message for
// the next step. Names only, never a referred user's email/phone (platform-wide rule).
const isRejection = (s: any) => s.state === 'blocked' && /reject/i.test(s.reason || '');
// Small, fixed-size action buttons so up to four of them stay in one row on the referral cards.
const actionBtn = 'h-7 px-2.5 text-[11px] gap-1';
const actionIcon = 'h-3 w-3';
const stateIcon = (s: any) => {
  if (isRejection(s) || s.state === 'cancelled') return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  if (s.state === 'released') return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (s.state === 'blocked') return <Lock className="h-4 w-4 text-amber-500 shrink-0" />;
  return <Circle className="h-4 w-4 text-primary shrink-0" />;
};

// The message to send for whatever this person needs to do next.
function nextMessage(r: any): string | null {
  const name = String(r.name || '').split(' ')[0] || 'there';
  const origin = window.location.origin;
  const find = (k: string) => r.stages.find((s: any) => s.key === k);
  if (r.type === 'seller') {
    if (r.status === 'pending') return `Hi ${name}, your JummaBaba seller profile is waiting for approval. Please check that your documents (GST, PAN, cancelled cheque) are complete so it can be approved quickly.`;
    if (r.status === 'rejected') return `Hi ${name}, your JummaBaba seller profile needs a few fixes before it can be approved${r.rejection_reason ? ` (${r.rejection_reason})` : ''}. Please log in, open Business Profile and update the details. Happy to help if you get stuck.`;
    const fp = find('seller_first_product');
    if (fp?.state === 'todo') return `Hi ${name}, congratulations — your JummaBaba seller account is approved! Next step: upload your first product at ${origin}/vendor/products. It takes about 5 minutes and buyers can start ordering right away.`;
    if (fp && isRejection(fp)) return `Hi ${name}, one of your products on JummaBaba needs a fix before it can go live. Please open Products, check the reason shown, update it and resubmit.`;
    if (fp?.state === 'blocked') return `Hi ${name}, your product on JummaBaba is with our team for approval. It usually goes live shortly — I'll let you know as soon as it does.`;
    if (find('seller_first_sale')?.state === 'todo') return `Hi ${name}, your products are live on JummaBaba! Share your catalogue with your buyers and ask them to order through the platform: ${origin}/supplier/${r.user_id}`;
    return null;
  }
  if (find('buyer_first_purchase')?.state === 'todo') return `Hi ${name}, thanks for joining JummaBaba! Browse products from verified suppliers and place your first order at ${origin} — let me know if you'd like help picking a supplier.`;
  return null;
}

export default function EmployeeReferrals() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'seller' | 'buyer'>('all');
  const [productsFor, setProductsFor] = useState<any>(null);
  const [products, setProducts] = useState<any[] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    api.employees.referrals()
      .then(setRows)
      .catch((err) => toast({ title: 'Could not load referrals', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const openProducts = async (r: any) => {
    setProductsFor(r);
    setProducts(null);
    try { setProducts(await api.employees.referralProducts(r.user_id)); }
    catch (err: any) { toast({ title: 'Could not load products', description: err.message, variant: 'destructive' }); }
  };

  const shown = rows.filter((r) => tab === 'all' || r.type === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Referrals</h1>
          <p className="text-muted-foreground">{rows.length} people joined through your code</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="seller">Sellers</TabsTrigger>
            <TabsTrigger value="buyer">Buyers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : shown.length === 0 ? (
        <Card className="border-border/50 rounded-2xl"><CardContent className="py-16 text-center text-muted-foreground">
          No referrals yet. Share your link from the dashboard — anyone who signs up through it shows up here.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((r) => {
            const msg = nextMessage(r);
            return (
              <Card key={r.user_id} className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Joined {new Date(r.referred_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex flex-wrap justify-end items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="uppercase text-[10px] font-bold">{r.type}</Badge>
                      {r.points_released > 0 && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{r.points_released} released</Badge>}
                      {r.points_blocked > 0 && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">{r.points_blocked} blocked</Badge>}
                    </div>
                  </div>

                  <ol className="space-y-2.5">
                    {r.stages.map((s: any) => (
                      <li key={s.key} className="text-sm">
                        <div className="flex items-center gap-2.5">
                          {stateIcon(s)}
                          <span className={cn('flex-1', s.state === 'cancelled' && 'text-muted-foreground line-through')}>
                            {s.label}
                            {s.max_count !== null && s.max_count !== undefined && s.count > 0 && <span className="text-xs text-muted-foreground"> ({s.count} of {s.max_count})</span>}
                            {/* So the employee can actually tell the referred person what order
                                size to aim for — pointless to show once it's already earned. */}
                            {s.min_order_value && s.state !== 'released' && (
                              <span className="text-xs text-muted-foreground"> (order ≥ ₹{Number(s.min_order_value).toLocaleString('en-IN')})</span>
                            )}
                          </span>
                          {s.points > 0 && (
                            <span className={cn('text-xs font-bold', s.state === 'released' ? 'text-emerald-600' : s.state === 'blocked' ? 'text-amber-600' : 'text-muted-foreground')}>
                              +{s.points}{s.state === 'blocked' ? ' blocked' : ''}
                            </span>
                          )}
                        </div>
                        {s.reason && <p className={cn('text-xs ml-[26px] mt-0.5', isRejection(s) ? 'text-destructive' : 'text-muted-foreground')}>{s.reason}</p>}
                      </li>
                    ))}
                  </ol>

                  {r.type === 'buyer' && r.window_ends_at && r.stages.find((s: any) => s.key === 'buyer_first_purchase')?.state === 'todo' && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Purchase must be placed within {Math.max(0, Math.ceil((new Date(r.window_ends_at).getTime() - Date.now()) / 86400000))} days
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.type === 'seller' && (
                      <>
                        {r.status === 'approved' ? (
                          <Button size="sm" variant="outline" className={actionBtn} onClick={() => {
                            const url = `${window.location.origin}/supplier/${r.user_id}`;
                            navigator.clipboard.writeText(url);
                            toast({ title: 'Profile link copied — share it with the buyer' });
                            window.open(url, '_blank', 'noopener');
                          }}><ExternalLink className={actionIcon} />Profile link</Button>
                        ) : (
                          <Button size="sm" variant="outline" className={actionBtn} disabled title="Available once the seller is approved"><ExternalLink className={actionIcon} />Profile link</Button>
                        )}
                        <Button size="sm" variant="outline" className={actionBtn} onClick={() => openProducts(r)}><Eye className={actionIcon} />Approval status</Button>
                      </>
                    )}
                    {msg && (
                      <>
                        <Button size="sm" variant="outline" className={actionBtn} onClick={() => { navigator.clipboard.writeText(msg); toast({ title: 'Message copied' }); }}>
                          <Copy className={actionIcon} />Copy message
                        </Button>
                        <Button size="sm" className={cn(actionBtn, 'bg-emerald-600 hover:bg-emerald-700 text-white')} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')}>
                          <MessageCircle className={actionIcon} />WhatsApp
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!productsFor} onOpenChange={(o) => !o && setProductsFor(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productsFor?.name} — product approval status</DialogTitle>
            <DialogDescription>Read-only, and includes products still pending or rejected — the public profile only ever shows approved ones. Approval is done by the JummaBaba team.</DialogDescription>
          </DialogHeader>
          {!products ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No products uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => {
                const img = Array.isArray(p.images) ? p.images[0] : undefined;
                const src = img && !String(img).startsWith('http') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${String(img).startsWith('/') ? '' : '/'}${img}` : img;
                return (
                  <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-muted/50">
                    {src ? <img src={src} alt={p.name} className="h-16 w-16 rounded-lg object-cover shrink-0" /> : <div className="h-16 w-16 rounded-lg bg-muted shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">From {formatPrice(p.min_price)} · MOQ {p.moq} {p.unit}</p>
                      {p.status === 'rejected' && p.rejection_reason && <p className="text-xs text-destructive mt-1">Rejected: {p.rejection_reason}</p>}
                    </div>
                    <Badge className={p.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 self-start' : p.status === 'rejected' ? 'bg-destructive/10 text-destructive self-start' : 'bg-amber-500/10 text-amber-600 self-start'}>
                      {p.status === 'pending' ? 'approval pending' : p.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
