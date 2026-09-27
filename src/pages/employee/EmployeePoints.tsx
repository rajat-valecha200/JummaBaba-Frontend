import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarClock, Loader2, Lock, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/b2b/StatsCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusStyle: Record<string, string> = {
  blocked: 'bg-amber-500/10 text-amber-600',
  released: 'bg-emerald-500/10 text-emerald-600',
  paid: 'bg-blue-500/10 text-blue-600',
  cancelled: 'bg-slate-500/10 text-slate-500',
};
const cardCls = 'border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden';
const headCls = 'border-b border-border/50 bg-slate-50/50 px-6 py-4';

export default function EmployeePoints() {
  const [data, setData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([api.employees.points(), api.employees.payments()])
      .then(([pts, pays]) => { setData(pts); setPayments(pays); })
      .catch((err) => toast({ title: 'Could not load points', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return <p className="text-muted-foreground">Could not load your points. Please refresh.</p>;

  const { wallet, ledger } = data;
  const nextDate = new Date(wallet.next_payout_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Points &amp; Payouts</h1>
        <p className="text-muted-foreground">
          Points show up as <b>blocked</b> the moment something happens, and become <b>available</b> once the task's condition is met. Available points are paid out on the team's payout schedule ({String(wallet.cycle_label || '').split(' (')[0].toLowerCase()}).
        </p>
      </div>

      {wallet.details_status === 'missing' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
          <span><b>Complete your profile to receive payouts on time.</b> Your bank and PAN details are missing, so we can't pay you yet.</span>
          <Link to="/employee/profile" className="font-semibold text-primary underline">Complete profile</Link>
        </div>
      )}
      {wallet.details_status === 'unverified' && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">Your payout details are with the team for verification. You'll be able to receive payouts once they're verified.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Available points" value={wallet.available_points} subtitle={`≈ ${formatPrice(wallet.available_amount)} to be paid`} icon={Award} iconClassName="bg-orange-500/10 text-orange-500" />
        <StatsCard title="Blocked points" value={wallet.blocked_points} subtitle="Waiting for approval / order completion" icon={Lock} iconClassName="bg-amber-500/10 text-amber-500" />
        <StatsCard title="Paid so far" value={formatPrice(wallet.paid_amount)} subtitle={`${wallet.paid_points} points`} icon={Wallet} iconClassName="bg-emerald-500/10 text-emerald-500" />
      </div>

      <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-sm flex flex-wrap items-center gap-x-6 gap-y-1">
        <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" />Next payout: <b>{nextDate}</b></span>
        {wallet.min_redeem_points > 0 && (
          wallet.eligible
            ? <span className="text-emerald-700">You have reached the minimum of {wallet.min_redeem_points} points — eligible for the next payout.</span>
            : <span className="text-amber-700">Not eligible yet — minimum {wallet.min_redeem_points} points to redeem{wallet.available_points > 0 ? `, ${wallet.points_to_eligible} more to go` : ''}. Your points stay safe and count towards the next payout.</span>
        )}
        {wallet.mode === 'tiered' && wallet.next_tier && (
          <span><b>{wallet.next_tier.points_needed} more points</b> this month and your next points are worth <b>{formatPrice(wallet.next_tier.next_rate)}</b> each.</span>
        )}
      </div>

      {wallet.breakdown?.length > 0 && (
        <Card className={cardCls}>
          <CardHeader className={headCls}><CardTitle className="text-lg">How your available points are valued</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-2 text-sm">
            {wallet.breakdown.map((b: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>
                  {wallet.mode === 'tiered' && `${b.month} · `}{b.points} points × {formatPrice(b.rate)}
                  {wallet.mode === 'tiered' && <span className="text-muted-foreground"> (slab {b.from}–{b.upto ?? '∞'})</span>}
                </span>
                <b>{formatPrice(b.amount)}</b>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className={cardCls}>
        <CardHeader className={headCls}><CardTitle className="text-lg">Payments</CardTitle></CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Points</TableHead><TableHead>Amount</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className={p.status === 'void' ? 'opacity-50' : ''}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{p.points}</TableCell>
                      <TableCell className="font-bold">{p.kind === 'reset' ? '—' : formatPrice(p.amount)}</TableCell>
                      <TableCell className="text-xs max-w-[360px]">
                        {p.kind === 'reset' ? <>Points reset by admin{p.note ? `: ${p.note}` : ''}</> : <>Paid{p.reference ? ` · ref ${p.reference}` : ''}</>}
                        {p.status === 'void' && <Badge variant="outline" className="ml-2 text-[10px]">cancelled</Badge>}
                        {p.kind === 'payment' && p.breakdown?.length > 0 && (
                          <p className="text-muted-foreground mt-0.5">
                            {p.breakdown.map((b: any, i: number) => (
                              <span key={i}>{i > 0 && ' · '}{b.month ? `${b.month}: ` : ''}{b.points}×{formatPrice(b.rate)}</span>
                            ))}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cardCls}>
        <CardHeader className={headCls}><CardTitle className="text-lg">Points history</CardTitle></CardHeader>
        <CardContent className="p-0">
          {ledger.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">Nothing yet — points appear here as soon as a referred user signs up.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Task</TableHead><TableHead>Points</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ledger.map((e: any) => {
                    const shown = e.status === 'released' && e.payout_id ? 'paid' : e.status;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm whitespace-nowrap">{new Date(e.created_at).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{e.task_label}</p>
                          <p className="text-xs text-muted-foreground max-w-[340px] truncate">{e.description}</p>
                          {e.blocked_reason && <p className={`text-xs max-w-[340px] ${/reject/i.test(e.blocked_reason) ? 'text-destructive' : 'text-amber-600'}`}>{e.blocked_reason}</p>}
                        </TableCell>
                        <TableCell className={e.status === 'cancelled' ? 'line-through text-muted-foreground' : 'font-bold'}>+{e.points}</TableCell>
                        <TableCell><Badge className={statusStyle[shown]}>{shown}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
