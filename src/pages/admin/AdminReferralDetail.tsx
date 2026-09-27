import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Loader2, Lock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { stateStyle } from './AdminEmployeeDetail';

const cardCls = 'border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden';
const headCls = 'border-b border-border/50 bg-slate-50/50 px-6 py-4';
const userStatusStyle: Record<string, string> = {
  approved: 'bg-emerald-500/10 text-emerald-600', pending: 'bg-amber-500/10 text-amber-600', rejected: 'bg-destructive/10 text-destructive',
};
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

// One referred seller/buyer, as the admin sees it: who they are (contact details included — admins
// may see them), where they stand on every reward task, and every points entry they produced.
export default function AdminReferralDetail() {
  const { id = '', userId = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.employees.adminReferralDetail(id, userId), api.employees.adminOverview(id)])
      .then(([d, o]) => { setData(d); setEmployee(o.profile); })
      .catch((e) => toast({ title: 'Could not load', description: e.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [id, userId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return <div className="py-16 text-center"><p className="text-muted-foreground mb-4">This referral wasn't found.</p><Button variant="outline" onClick={() => navigate(`/admin/employees/${id}`)}>Back</Button></div>;

  const { referral, profile, ledger, products, orders } = data;
  const isSeller = referral.type === 'seller';
  const row = (label: string, value: any, mono = false) => (
    <div className="flex justify-between gap-4 py-2 border-b border-border/40 last:border-0 text-sm"><span className="text-muted-foreground shrink-0">{label}</span><span className={cn('text-right break-all', mono ? 'font-mono' : 'font-medium')}>{value || '—'}</span></div>
  );
  const stageIcon = (s: any) => {
    if (s.state === 'released') return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    if (s.state === 'blocked') return <Lock className="h-4 w-4 text-amber-500 shrink-0" />;
    if (s.state === 'cancelled') return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    return <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      <Link to={`/admin/employees/${id}?tab=referrals`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 mr-1" />Back to {employee?.full_name || 'employee'}</Link>

      <Card className={cardCls}>
        <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold break-words">{referral.name}</h1>
              <Badge variant="outline" className="uppercase text-[10px]">{referral.type}</Badge>
              <Badge className={userStatusStyle[profile.status] || ''}>{profile.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Referred by <Link className="font-medium text-primary hover:underline" to={`/admin/employees/${id}`}>{employee?.full_name}</Link> on {fmtDate(referral.referred_at)}
              {referral.code_used ? <> using code <span className="font-mono">{referral.code_used}</span></> : null}
            </p>
            {profile.status === 'rejected' && profile.rejection_reason && <p className="text-sm text-destructive">Rejected: {profile.rejection_reason}</p>}
          </div>
          <Button variant="outline" onClick={() => navigate(isSeller ? '/admin/vendors' : '/admin/users')}><ExternalLink className="h-4 w-4 mr-1.5" />Open in {isSeller ? 'Vendors' : 'Users'}</Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className={cardCls}>
          <CardHeader className={headCls}><CardTitle className="text-lg">Profile</CardTitle></CardHeader>
          <CardContent className="p-5">
            {row('Name', profile.full_name)}{row('Business', profile.business_name)}{row('Email', profile.email)}{row('Mobile', profile.phone)}
            {row('Location', profile.location)}{row('Business type', profile.business_type)}{row('Established', profile.established_year)}
            {row('GST', profile.gst_number, true)}{row('PAN', profile.pan_number, true)}{row('Registered', fmtDate(profile.created_at))}
          </CardContent>
        </Card>

        <Card className={cardCls}>
          <CardHeader className={`${headCls} flex-row items-center justify-between space-y-0`}>
            <CardTitle className="text-lg">Points progress</CardTitle>
            <span className="text-xs text-muted-foreground">{referral.points_released} released · {referral.points_blocked} blocked</span>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {referral.stages.map((s: any) => (
              <div key={s.key} className="text-sm">
                <div className="flex items-center gap-2.5">
                  {stageIcon(s)}
                  <span className={cn('flex-1', s.state === 'cancelled' && 'line-through text-muted-foreground')}>
                    {s.label}{s.max_count !== null && s.max_count !== undefined && s.count > 0 ? <span className="text-xs text-muted-foreground"> ({s.count} of {s.max_count})</span> : null}
                  </span>
                  <Badge className={stateStyle[s.state]}>{s.state === 'todo' ? 'not yet' : s.state}</Badge>
                  <span className="text-xs font-bold w-10 text-right">+{s.points}</span>
                </div>
                {s.reason && <p className={cn('text-xs ml-[26px] mt-0.5', /reject/i.test(s.reason) ? 'text-destructive' : 'text-muted-foreground')}>{s.reason}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className={cardCls}>
        <CardHeader className={headCls}><CardTitle className="text-lg">Points entries from this {referral.type}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {ledger.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">No points entries yet.</p> : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Task</TableHead><TableHead>Points</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{ledger.map((l: any) => {
                const shown = l.status === 'released' && l.payout_id ? 'paid' : l.status;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(l.created_at)}</TableCell>
                    <TableCell><p className="text-sm font-medium">{l.task_label}</p><p className="text-xs text-muted-foreground">{l.description}</p>{l.blocked_reason && <p className="text-xs text-amber-600">{l.blocked_reason}</p>}</TableCell>
                    <TableCell className={l.status === 'cancelled' ? 'line-through text-muted-foreground' : 'font-bold'}>{l.points}</TableCell>
                    <TableCell><Badge className={stateStyle[l.status === 'released' && !l.payout_id ? 'released' : shown] || ''}>{shown}</Badge></TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      {isSeller && (
        <Card className={cardCls}>
          <CardHeader className={headCls}><CardTitle className="text-lg">Products ({products.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {products.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">No products uploaded yet.</p> : (
              <div className="overflow-x-auto"><Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>From</TableHead><TableHead>Status</TableHead><TableHead>Uploaded</TableHead></TableRow></TableHeader>
                <TableBody>{products.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}{p.rejection_reason && <p className="text-xs text-destructive font-normal">Rejected: {p.rejection_reason}</p>}</TableCell>
                    <TableCell>{formatPrice(Number(p.min_price))}</TableCell>
                    <TableCell><Badge className={userStatusStyle[p.status] || 'bg-slate-500/10 text-slate-500'}>{p.status}</Badge></TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(p.created_at)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className={cardCls}>
        <CardHeader className={headCls}><CardTitle className="text-lg">Orders ({orders.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">No orders yet.</p> : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>As</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead><TableHead>Placed</TableHead></TableRow></TableHeader>
              <TableBody>{orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{String(o.id).slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="capitalize">{o.as}</TableCell>
                  <TableCell className="font-medium">{formatPrice(o.value)}</TableCell>
                  <TableCell><Badge className={o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : o.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}>{o.status}</Badge></TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{fmtDate(o.ordered_at)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
