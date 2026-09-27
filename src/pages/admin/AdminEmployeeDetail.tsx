import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, ChevronRight, ClipboardPlus, Copy, Loader2, RefreshCw, RotateCcw, Search, ShieldAlert, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard } from '@/components/b2b/StatsCard';
import { Pager } from '@/components/admin/Pager';
import { PayDialog, ResetDialog, CustomTaskDialog } from '@/components/admin/EmployeeDialogs';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Award, Lock, Store, Users } from 'lucide-react';

const cardCls = 'border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden';
const headCls = 'border-b border-border/50 bg-slate-50/50 px-6 py-4';
const PAGE = 15;

export const stateStyle: Record<string, string> = {
  blocked: 'bg-amber-500/10 text-amber-600',
  released: 'bg-emerald-500/10 text-emerald-600',
  paid: 'bg-blue-500/10 text-blue-600',
  cancelled: 'bg-slate-500/10 text-slate-500',
  todo: 'bg-slate-500/10 text-slate-400',
};
const userStatusStyle: Record<string, string> = {
  approved: 'bg-emerald-500/10 text-emerald-600', pending: 'bg-amber-500/10 text-amber-600', rejected: 'bg-destructive/10 text-destructive',
};
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function AdminEmployeeDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'referrals';
  const setTab = (t: string) => setParams({ tab: t }, { replace: true });

  const [ov, setOv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState<any>(null);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const loadOverview = useCallback(async () => {
    try { setOv(await api.employees.adminOverview(id)); }
    catch (err: any) { toast({ title: 'Could not load employee', description: err.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { setLoading(true); loadOverview(); }, [loadOverview]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ov) return <div className="py-16 text-center"><p className="text-muted-foreground mb-4">Employee not found.</p><Button variant="outline" onClick={() => navigate('/admin/employees')}>Back to employees</Button></div>;

  const { profile, wallet, payout, referrals } = ov;
  const detailsBadge = wallet.details_status === 'verified'
    ? <Badge className="bg-emerald-500/10 text-emerald-600"><BadgeCheck className="h-3 w-3 mr-1" />Payout details verified</Badge>
    : wallet.details_status === 'unverified'
      ? <Badge className="bg-amber-500/10 text-amber-600"><ShieldAlert className="h-3 w-3 mr-1" />Payout details need verification</Badge>
      : <Badge className="bg-destructive/10 text-destructive"><ShieldAlert className="h-3 w-3 mr-1" />Payout details not filled in</Badge>;
  const target = { id, full_name: profile.full_name, ...wallet };
  const canPay = wallet.eligible && wallet.details_status === 'verified';

  return (
    <div className="space-y-6">
      <Link to="/admin/employees" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 mr-1" />All employees</Link>

      <Card className={cardCls}>
        <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-black">{String(profile.full_name || '?').charAt(0).toUpperCase()}</div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{profile.full_name}</h1>
                <Badge className={profile.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}>{profile.status === 'approved' ? 'active' : 'deactivated'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground break-words">{profile.email}{profile.phone ? ` · ${profile.phone}` : ''}{profile.location ? ` · ${profile.location}` : ''}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button className="font-mono text-xs bg-muted rounded px-2 py-1 flex items-center gap-1.5" onClick={() => { navigator.clipboard.writeText(profile.referral_code); toast({ title: 'Code copied' }); }}>
                  {profile.referral_code}<Copy className="h-3 w-3" />
                </button>
                <span className="text-xs text-muted-foreground">Joined {fmtDate(profile.created_at)}</span>
                {detailsBadge}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setCustomOpen(true)}><ClipboardPlus className="h-4 w-4 mr-1.5" />Add custom task</Button>
            <Button variant="outline" disabled={!canPay} title={canPay ? undefined : wallet.details_status !== 'verified' ? 'Verify the payout details first (Details tab)' : 'Not eligible to be paid yet'} onClick={() => setPayTarget(target)}><Wallet className="h-4 w-4 mr-1.5" />Mark paid</Button>
            <Button variant="outline" disabled={wallet.available_points <= 0} onClick={() => setResetTarget(target)}><RotateCcw className="h-4 w-4 mr-1.5" />Reset points</Button>
            <Button variant="ghost" size="icon" title="Recalculate points from current data" onClick={async () => { await api.employees.adminRecalculate(id).catch(() => {}); await loadOverview(); toast({ title: 'Points recalculated' }); }}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Available points" value={wallet.available_points} subtitle={`≈ ${formatPrice(wallet.available_amount)}${wallet.eligible ? '' : wallet.available_points > 0 ? ` · needs ${wallet.points_to_eligible} more` : ''}`} icon={Award} iconClassName="bg-orange-500/10 text-orange-500" />
        <StatsCard title="Blocked points" value={wallet.blocked_points} subtitle="waiting on approval / orders" icon={Lock} iconClassName="bg-amber-500/10 text-amber-500" />
        <StatsCard title="Paid so far" value={formatPrice(wallet.paid_amount)} subtitle={`${wallet.paid_points} points${wallet.last_paid_at ? ` · last ${fmtDate(wallet.last_paid_at)}` : ''}`} icon={Wallet} iconClassName="bg-emerald-500/10 text-emerald-500" />
        <StatsCard title="Referred" value={referrals.sellers + referrals.buyers} subtitle={`${referrals.sellers} sellers (${referrals.sellers_approved} approved) · ${referrals.buyers} buyers`} icon={Users} iconClassName="bg-indigo-500/10 text-indigo-500" />
      </div>

      {wallet.breakdown?.length > 0 && (
        <Card className={cardCls}>
          <CardHeader className={headCls}><CardTitle className="text-lg">How {profile.full_name}'s available points are valued</CardTitle></CardHeader>
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="points">Points history</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="leads">Leads{ov.leads > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{ov.leads}</span>}</TabsTrigger>
          <TabsTrigger value="details">Details{wallet.details_status !== 'verified' && <span className="ml-1.5 h-2 w-2 rounded-full bg-destructive inline-block" />}</TabsTrigger>
        </TabsList>
        <TabsContent value="referrals" className="mt-4"><ReferralsTab id={id} /></TabsContent>
        <TabsContent value="points" className="mt-4"><PointsTab id={id} onChanged={loadOverview} /></TabsContent>
        <TabsContent value="payments" className="mt-4"><PaymentsTab id={id} onChanged={loadOverview} /></TabsContent>
        <TabsContent value="leads" className="mt-4"><LeadsTab id={id} /></TabsContent>
        <TabsContent value="details" className="mt-4"><DetailsTab id={id} ov={ov} onChanged={loadOverview} /></TabsContent>
      </Tabs>

      <PayDialog target={payTarget} onClose={() => setPayTarget(null)} onDone={loadOverview} />
      <ResetDialog target={resetTarget} onClose={() => setResetTarget(null)} onDone={loadOverview} />
      <CustomTaskDialog employee={{ id, full_name: profile.full_name }} open={customOpen} onClose={() => setCustomOpen(false)} onDone={() => { setTab('points'); return loadOverview(); }} />
    </div>
  );
}

// ---------------------------------------------------------------- Referrals
function ReferralsTab({ id }: { id: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const dq = useDebounced(q);

  useEffect(() => { setPage(1); }, [dq, type, status]);
  useEffect(() => {
    setLoading(true);
    api.employees.adminReferralsPage(id, { q: dq, type: type === 'all' ? undefined : type, status: status === 'all' ? undefined : status, page, limit: PAGE })
      .then(setData).catch((e) => toast({ title: 'Could not load referrals', description: e.message, variant: 'destructive' })).finally(() => setLoading(false));
  }, [id, dq, type, status, page]);

  return (
    <Card className={cardCls}>
      <CardHeader className={`${headCls} space-y-3`}>
        <CardTitle className="text-lg">Referred sellers &amp; buyers</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={type} onValueChange={setType}><SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="seller">Sellers</SelectItem><SelectItem value="buyer">Buyers</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading && !data ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          : !data || data.rows.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">No referrals match.</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Profile</TableHead><TableHead>Progress</TableHead><TableHead>Released</TableHead><TableHead>Blocked</TableHead><TableHead>Referred</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {data.rows.map((r: any) => (
                  <TableRow key={r.user_id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/admin/employees/${id}/referrals/${r.user_id}`)}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><Badge variant="outline" className="uppercase text-[10px]">{r.type}</Badge></TableCell>
                    <TableCell><Badge className={userStatusStyle[r.status] || ''}>{r.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {r.stages.map((s: any) => <span key={s.key} title={`${s.label}: ${s.state}${s.reason ? ` — ${s.reason}` : ''}`} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stateStyle[s.state]}`}>{s.label}</span>)}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{r.points_released}</TableCell>
                    <TableCell className="text-amber-600">{r.points_blocked}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.referred_at)}</TableCell>
                    <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- Points history
function PointsTab({ id, onChanged }: { id: string; onChanged: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const dq = useDebounced(q);
  useEffect(() => { setPage(1); }, [dq, status]);
  useEffect(() => {
    setLoading(true);
    api.employees.adminLedgerPage(id, { q: dq, status: status === 'all' ? undefined : status, page, limit: PAGE })
      .then(setData).catch((e) => toast({ title: 'Could not load points', description: e.message, variant: 'destructive' })).finally(() => setLoading(false));
  }, [id, dq, status, page, tick]);
  const refresh = async () => { setTick((t) => t + 1); await onChanged(); };

  const release = async (row: any) => {
    try { await api.employees.adminReleaseEntry(row.id); toast({ title: 'Task verified — points released' }); await refresh(); }
    catch (e: any) { toast({ title: 'Could not release', description: e.message, variant: 'destructive' }); }
  };
  const cancel = async (row: any) => {
    const reason = prompt(row.status === 'blocked' ? 'Reason for cancelling these points (shown in the history):' : 'Reason for reversing these points (shown in the history):');
    if (reason === null) return;
    try { await api.employees.adminReverseEntry(row.id, reason); toast({ title: 'Points cancelled' }); await refresh(); }
    catch (e: any) { toast({ title: 'Could not cancel', description: e.message, variant: 'destructive' }); }
  };

  return (
    <Card className={cardCls}>
      <CardHeader className={`${headCls} space-y-3`}>
        <CardTitle className="text-lg">Points history</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search task, person or note" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">All</SelectItem><SelectItem value="blocked">Blocked</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent></Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading && !data ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          : !data || data.rows.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">Nothing here.</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Task</TableHead><TableHead>Points</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {data.rows.map((l: any) => {
                  const shown = l.status === 'released' && l.payout_id ? 'paid' : l.status === 'released' ? 'available' : l.status;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs whitespace-nowrap">{fmtDate(l.created_at)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{l.task_label}{l.referred_name ? <span className="text-muted-foreground font-normal"> · {l.referred_name}</span> : null}</p>
                        <p className="text-xs text-muted-foreground max-w-[380px]">{l.description}</p>
                        {l.blocked_reason && <p className={`text-xs max-w-[380px] ${/reject/i.test(l.blocked_reason) ? 'text-destructive' : 'text-amber-600'}`}>{l.blocked_reason}</p>}
                      </TableCell>
                      <TableCell className={l.status === 'cancelled' ? 'line-through text-muted-foreground' : 'font-bold'}>{l.points}</TableCell>
                      <TableCell><Badge className={stateStyle[l.status === 'released' && !l.payout_id ? 'released' : shown] || ''}>{shown}</Badge></TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {l.event_type === 'custom' && l.status === 'blocked' && <Button size="sm" variant="outline" className="mr-1" onClick={() => release(l)}>Release</Button>}
                        {l.status !== 'cancelled' && !l.payout_id && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(l)}>{l.status === 'blocked' ? 'Cancel' : 'Reverse'}</Button>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- Payments
function PaymentsTab({ id, onChanged }: { id: string; onChanged: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[] | null>(null);
  const load = useCallback(() => api.employees.adminEmployeePayments(id).then(setRows).catch((e) => toast({ title: 'Could not load payments', description: e.message, variant: 'destructive' })), [id]);
  useEffect(() => { load(); }, [load]);
  const voidIt = async (p: any) => {
    const reason = prompt(`Void this ${p.kind === 'reset' ? 'reset' : 'payment'}? The ${p.points} points go back to the employee's balance. Reason:`);
    if (reason === null) return;
    try { await api.employees.adminVoidPayout(p.id, reason); toast({ title: 'Voided — points restored' }); await load(); await onChanged(); }
    catch (e: any) { toast({ title: 'Could not void', description: e.message, variant: 'destructive' }); }
  };
  return (
    <Card className={cardCls}>
      <CardHeader className={headCls}><CardTitle className="text-lg">Payments &amp; resets</CardTitle></CardHeader>
      <CardContent className="p-0">
        {!rows ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          : rows.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">Nothing recorded yet.</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>What</TableHead><TableHead>Points</TableHead><TableHead>Amount</TableHead><TableHead>Released at rate</TableHead><TableHead>Reference / reason</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id} className={p.status === 'void' ? 'opacity-60' : ''}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleString('en-IN')}<p className="text-muted-foreground">{p.created_by_name}</p></TableCell>
                    <TableCell><Badge className={p.kind === 'reset' ? 'bg-slate-500/10 text-slate-600' : 'bg-blue-500/10 text-blue-600'}>{p.kind === 'reset' ? 'reset' : `paid · ${p.method}`}</Badge>{p.status === 'void' && <Badge variant="outline" className="ml-1 text-[10px]">void</Badge>}</TableCell>
                    <TableCell>{p.points}</TableCell>
                    <TableCell className="font-bold">{p.kind === 'reset' ? '—' : formatPrice(p.amount)}</TableCell>
                    <TableCell className="text-xs max-w-[240px]">
                      {p.kind === 'payment' && p.breakdown?.length > 0 ? p.breakdown.map((b: any, i: number) => (
                        <span key={i}>{i > 0 && ' · '}{b.month ? `${b.month}: ` : ''}{b.points}×{formatPrice(b.rate)}</span>
                      )) : '—'}
                    </TableCell>
                    <TableCell className="text-xs max-w-[220px]">{p.reference || p.note}{p.note && p.reference ? <span className="text-muted-foreground"> · {p.note}</span> : null}{p.status === 'void' && <p className="text-destructive">Void: {p.void_reason}</p>}</TableCell>
                    <TableCell className="text-right">{p.status === 'paid' && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => voidIt(p)}>Void</Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- Leads (the employee's own prospect list)
function LeadsTab({ id }: { id: string }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[] | null>(null);
  const [open, setOpen] = useState<any>(null);
  useEffect(() => { api.employees.adminEmployeeLeads(id).then(setRows).catch((e) => toast({ title: 'Could not load leads', description: e.message, variant: 'destructive' })); }, [id]);
  const st: Record<string, string> = { new: 'bg-slate-500/10 text-slate-600', contacted: 'bg-blue-500/10 text-blue-600', interested: 'bg-amber-500/10 text-amber-600', registered: 'bg-emerald-500/10 text-emerald-600', lost: 'bg-destructive/10 text-destructive' };
  return (
    <Card className={cardCls}>
      <CardHeader className={headCls}><CardTitle className="text-lg">Leads the employee is working on</CardTitle></CardHeader>
      <CardContent className="p-0">
        {!rows ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          : rows.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">No leads added yet.</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Type</TableHead><TableHead>City</TableHead><TableHead>Status</TableHead><TableHead>Added</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setOpen(l)}>
                    <TableCell className="font-medium">{l.business_name}{l.contact_name ? <span className="block text-xs text-muted-foreground font-normal">{l.contact_name}</span> : null}</TableCell>
                    <TableCell><Badge variant="outline" className="uppercase text-[10px]">{l.lead_type}</Badge></TableCell>
                    <TableCell>{l.city || '—'}</TableCell>
                    <TableCell><Badge className={st[l.status] || ''}>{l.status}</Badge></TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(l.created_at)}</TableCell>
                    <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{open?.business_name}</DialogTitle><DialogDescription>Lead added on {fmtDate(open?.created_at)} · last updated {fmtDate(open?.updated_at)}</DialogDescription></DialogHeader>
          {open && (
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Type</dt><dd className="capitalize">{open.lead_type}</dd>
              <dt className="text-muted-foreground">Contact</dt><dd>{open.contact_name || '—'}</dd>
              <dt className="text-muted-foreground">Phone</dt><dd>{open.phone || '—'}</dd>
              <dt className="text-muted-foreground">Email</dt><dd className="break-all">{open.email || '—'}</dd>
              <dt className="text-muted-foreground">City</dt><dd>{open.city || '—'}</dd>
              <dt className="text-muted-foreground">Status</dt><dd><Badge className={st[open.status] || ''}>{open.status}</Badge></dd>
              <dt className="text-muted-foreground">Notes</dt><dd className="whitespace-pre-wrap">{open.notes || '—'}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------- Details (profile + payout details)
function DetailsTab({ id, ov, onChanged }: { id: string; ov: any; onChanged: () => void | Promise<void> }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const { profile, payout } = ov;
  const verify = async () => {
    setBusy(true);
    try { await api.employees.adminVerifyDetails(id); toast({ title: 'Payout details verified' }); await onChanged(); }
    catch (e: any) { toast({ title: 'Could not verify', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const row = (label: string, value: any, mono = false) => (
    <div className="flex justify-between gap-4 py-2 border-b border-border/40 last:border-0 text-sm"><span className="text-muted-foreground">{label}</span><span className={`text-right break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value || '—'}</span></div>
  );
  const missingLabels: Record<string, string> = { date_of_birth: 'Date of birth', pan: 'PAN', account_holder: 'Account holder name', account_number: 'Account number', ifsc: 'IFSC' };
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className={cardCls}>
        <CardHeader className={headCls}><CardTitle className="text-lg">Employee</CardTitle></CardHeader>
        <CardContent className="p-5">
          {row('Name', profile.full_name)}{row('Email (login)', profile.email)}{row('Mobile', profile.phone)}{row('Location', profile.location)}
          {row('Referral code', profile.referral_code, true)}{row('Joined', fmtDate(profile.created_at))}
        </CardContent>
      </Card>
      <Card className={cardCls}>
        <CardHeader className={`${headCls} flex-row items-center justify-between space-y-0`}>
          <CardTitle className="text-lg">Payout details</CardTitle>
          {payout.complete && !payout.verified && <Button size="sm" disabled={busy} onClick={verify}><BadgeCheck className="h-4 w-4 mr-1.5" />Mark as verified</Button>}
        </CardHeader>
        <CardContent className="p-5">
          {!payout.complete && (
            <div className="mb-4 rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm">
              The employee hasn't finished their profile. Still missing: <b>{payout.missing.map((m: string) => missingLabels[m] || m).join(', ')}</b>. Payments stay blocked until it's complete and verified.
            </div>
          )}
          {payout.complete && !payout.verified && (
            <div className="mb-4 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-sm">
              Check the account holder name matches the PAN name, then mark as verified. Any later change to bank or PAN details clears the verification.
            </div>
          )}
          {payout.verified && <p className="mb-4 text-sm text-emerald-700 flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" />Verified on {fmtDate(payout.verified_at)}</p>}
          {row('Date of birth', payout.date_of_birth ? fmtDate(payout.date_of_birth) : '')}
          {row('PAN', payout.pan, true)}
          {row('Account holder', payout.account_holder)}
          {row('Account number', payout.account_number, true)}
          {row('IFSC', payout.ifsc, true)}
          {row('Bank', payout.bank_name)}
          {row('UPI id', payout.upi_id, true)}
          {payout.updated_at && <p className="text-xs text-muted-foreground mt-3">Last updated {new Date(payout.updated_at).toLocaleString('en-IN')}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
