import { useEffect, useState } from 'react';
import { CalendarClock, ChevronRight, Copy, Eye, KeyRound, Loader2, Pencil, Plus, RotateCcw, Trash2, UserCheck, UserPlus, UserX, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PayDialog, ResetDialog } from '@/components/admin/EmployeeDialogs';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const cardCls = 'border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden';
const headCls = 'border-b border-border/50 bg-slate-50/50 px-6 py-4';

type TaskForm = {
  id?: string; trigger_key: string; label: string; description: string; points: string; release_on: string;
  max_count: string; window_days: string; min_order_value: string; is_active: boolean;
};

export default function AdminEmployees() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payables, setPayables] = useState<any>(null);
  const [liability, setLiability] = useState<any>(null);
  const [taskData, setTaskData] = useState<{ tasks: any[]; triggers: any[]; release_rules: any[] } | null>(null);
  const [settings, setSettings] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [tiers, setTiers] = useState<{ upto: string; rate: string }[]>([]);
  const [rates, setRates] = useState<{ current: number; history: any[] } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', location: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [pwTarget, setPwTarget] = useState<any>(null);
  const [newPw, setNewPw] = useState('');
  const [rateForm, setRateForm] = useState({ rupees_per_point: '', effective_from: '', note: '' });

  const [payTarget, setPayTarget] = useState<any>(null);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [historyTarget, setHistoryTarget] = useState<any>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  const [taskForm, setTaskForm] = useState<TaskForm | null>(null);
  const [settingsTab, setSettingsTab] = useState<'referral' | 'payouts' | 'redeem'>('referral');
  const [previewPts, setPreviewPts] = useState('1000');

  const loadAll = async () => {
    try {
      const [emps, pay, lb, td, st, tr, rt] = await Promise.all([
        api.employees.adminList(), api.employees.adminPayments(), api.employees.adminLiability(), api.employees.adminTasks(),
        api.employees.adminSettings(), api.employees.adminTiers(), api.employees.adminRates(),
      ]);
      setEmployees(emps); setPayables(pay); setLiability(lb); setTaskData(td); setSettings(st); setRates(rt);
      setSettingsForm(Object.fromEntries(st.map((r: any) => [r.key, String(r.value)])));
      setTiers(tr.map((t: any) => ({ upto: t.upto === null ? '' : String(t.upto), rate: String(t.rate) })));
    } catch (err: any) {
      toast({ title: 'Could not load', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  const act = async (fn: () => Promise<any>, ok: string) => {
    try {
      const res = await fn();
      toast({ title: ok });
      await loadAll();
      return res ?? true;
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const createEmployee = async () => {
    setSaving(true);
    const done = await act(() => api.employees.adminCreate(form), 'Employee created');
    setSaving(false);
    if (done) { setCreateOpen(false); setForm({ full_name: '', email: '', phone: '', location: '', password: '' }); }
  };

  const openHistory = async (emp: any) => {
    setHistoryTarget(emp);
    setHistory(null);
    try { setHistory(await api.employees.adminEmployeePayments(emp.id)); }
    catch (err: any) { toast({ title: 'Could not load payments', description: err.message, variant: 'destructive' }); }
  };

  const voidPayout = async (p: any) => {
    const reason = prompt(`Void this ${p.kind === 'reset' ? 'reset' : 'payment'}? The ${p.points} points go back to the employee's balance. Reason:`);
    if (reason === null) return;
    const done = await act(() => api.employees.adminVoidPayout(p.id, reason), 'Voided — points restored');
    if (done && historyTarget) await openHistory(historyTarget);
  };

  const trigger = (key: string) => taskData?.triggers.find((t) => t.key === key);
  const openTask = (t: any) => setTaskForm({
    id: t.id, trigger_key: t.trigger_key, label: t.label, description: t.description || '', points: String(t.points), release_on: t.release_on,
    max_count: t.max_count === null ? '' : String(t.max_count), window_days: t.window_days === null ? '' : String(t.window_days),
    min_order_value: String(t.min_order_value), is_active: t.is_active,
  });
  const saveTask = async () => {
    if (!taskForm) return;
    const body = {
      trigger_key: taskForm.trigger_key, label: taskForm.label, description: taskForm.description, points: Number(taskForm.points),
      release_on: taskForm.release_on, max_count: taskForm.max_count === '' ? null : Number(taskForm.max_count),
      window_days: taskForm.window_days === '' ? null : Number(taskForm.window_days), min_order_value: Number(taskForm.min_order_value) || 0,
      is_active: taskForm.is_active,
    };
    const done = await act(() => api.employees.adminUpdateTask(taskForm.id!, body), 'Task saved');
    if (done) setTaskForm(null);
  };

  const saveSettings = () => act(() => api.employees.adminUpdateSettings(settingsForm), 'Settings saved');
  // Payouts section: method, minimum, schedule and (when tiered) the slabs — one Save for all of it.
  const savePayouts = async () => {
    try {
      await api.employees.adminUpdateSettings(settingsForm);
      if (settingsForm.payout_mode === 'tiered') {
        await api.employees.adminSaveTiers(tiers.map((t, i) => ({ upto: i === tiers.length - 1 ? null : Number(t.upto), rate: Number(t.rate) })));
      }
      toast({ title: 'Payout settings saved' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Could not save', description: err.message, variant: 'destructive' });
    }
  };
  // Same marginal-slab maths as the server, only to preview the effect of the slabs on screen.
  const previewValue = (points: number) => {
    let value = 0; let lower = 0;
    tiers.forEach((t, i) => {
      const upper = i === tiers.length - 1 || t.upto === '' ? Infinity : Number(t.upto);
      const inSlab = Math.max(0, Math.min(points, upper) - lower);
      value += inSlab * (Number(t.rate) || 0);
      lower = upper;
    });
    return value;
  };
  const optValue = (o: any) => (typeof o === 'object' ? o.value : o);
  const optLabel = (o: any) => (typeof o === 'object' ? o.label : o);
  const setTier = (i: number, patch: Partial<{ upto: string; rate: string }>) => setTiers(tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const releaseLabel = (key: string) => taskData?.release_rules.find((r) => r.key === key)?.label || key;

  const payoutMode = settings.find((r) => r.key === 'payout_mode')?.value ?? 'flat';
  const settingsVal = (key: string) => settings.find((r) => r.key === key)?.value ?? '';
  const cycleLabel = (v: string) => optLabel((settings.find((r) => r.key === 'payout_cycle')?.options || []).find((o: any) => optValue(o) === v) ?? v);
  const owed = (payables?.employees || []).filter((e: any) => e.eligible).length;
  const tf = taskForm ? trigger(taskForm.trigger_key) : null;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees &amp; Referrals</h1>
          <p className="text-muted-foreground">Employees bring in sellers and buyers with their code and earn points.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Add employee</Button>
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payments">Payments{owed > 0 && <Badge className="ml-2 h-5 px-1.5" variant="destructive">{owed}</Badge>}</TabsTrigger>
          <TabsTrigger value="tasks">Tasks &amp; points</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ---------------- Employees ---------------- */}
        <TabsContent value="employees" className="mt-4">
          <Card className={cardCls}>
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <p className="text-center text-muted-foreground py-16">No employees yet. Add one and share the login with them.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead><TableHead>Code</TableHead><TableHead>Sellers</TableHead><TableHead>Buyers</TableHead>
                        <TableHead>Available</TableHead><TableHead>Blocked</TableHead><TableHead>Paid out</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell><button type="button" className="font-medium text-left hover:text-primary hover:underline" onClick={() => navigate(`/admin/employees/${e.id}`)}>{e.full_name}</button><p className="text-xs text-muted-foreground">{e.email}</p></TableCell>
                          <TableCell>
                            <button className="font-mono text-xs bg-muted rounded px-2 py-1 flex items-center gap-1.5" onClick={() => { navigator.clipboard.writeText(e.referral_code); toast({ title: 'Code copied' }); }}>
                              {e.referral_code}<Copy className="h-3 w-3" />
                            </button>
                          </TableCell>
                          <TableCell>{e.sellers}</TableCell>
                          <TableCell>{e.buyers}</TableCell>
                          <TableCell className="font-bold">{e.points_available}</TableCell>
                          <TableCell className="text-amber-600">{e.points_blocked}</TableCell>
                          <TableCell>{formatPrice(e.rupees_paid)}</TableCell>
                          <TableCell>
                            <Badge className={e.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}>
                              {e.status === 'approved' ? 'active' : 'deactivated'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button size="icon" variant="ghost" title="Open employee page" onClick={() => navigate(`/admin/employees/${e.id}`)}><Eye className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Reset password" onClick={() => { setPwTarget(e); setNewPw(''); }}><KeyRound className="h-4 w-4" /></Button>
                            {e.status === 'approved' ? (
                              <Button size="icon" variant="ghost" title="Deactivate" onClick={() => confirm(`Deactivate ${e.full_name}? They can't log in and their code stops working for new signups. Points already earned are kept.`) && act(() => api.employees.adminSetStatus(e.id, 'rejected'), 'Employee deactivated')}>
                                <UserX className="h-4 w-4 text-destructive" />
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost" title="Reactivate" onClick={() => act(() => api.employees.adminSetStatus(e.id, 'approved'), 'Employee reactivated')}>
                                <UserCheck className="h-4 w-4 text-emerald-600" />
                              </Button>
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
        </TabsContent>

        {/* ---------------- Payments ---------------- */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          {liability && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Available to pay', value: formatPrice(liability.available_amount), sub: `${liability.available_points} released points` },
                { label: 'Blocked (estimate)', value: formatPrice(liability.blocked_amount_estimate), sub: `${liability.blocked_points} points if all release` },
                { label: 'Paid so far', value: formatPrice(liability.paid_amount), sub: 'all employees' },
                { label: 'Total exposure', value: formatPrice(liability.total_exposure), sub: `${liability.mode} value` },
              ].map((c) => (
                <Card key={c.label} className={cardCls}><CardContent className="pt-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-black mt-1">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
                </CardContent></Card>
              ))}
            </div>
          )}
          <Card className={cardCls}>
            <CardHeader className={headCls}>
              <CardTitle className="text-lg">Pay employees</CardTitle>
              {payables && <p className="text-xs text-muted-foreground">
                Next payout date: <b>{new Date(payables.next_payout_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b> ({payables.config.payout_cycle} reminder) ·
                Minimum to redeem: <b>{payables.config.min_redeem_points} points</b>. Pay the employee outside the app, then record it here — their released points then restart from zero.
              </p>}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead><TableHead>Released (unpaid)</TableHead><TableHead>Amount</TableHead><TableHead>Blocked</TableHead>
                    <TableHead>Paid so far</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(payables?.employees || []).map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell><p className="font-medium">{e.full_name}</p><p className="text-xs font-mono text-muted-foreground">{e.referral_code}</p></TableCell>
                        <TableCell className="font-bold">{e.available_points}</TableCell>
                        <TableCell className="font-bold">{formatPrice(e.available_amount)}</TableCell>
                        <TableCell className="text-amber-600">{e.blocked_points}</TableCell>
                        <TableCell>{formatPrice(e.paid_amount)}<p className="text-[10px] text-muted-foreground">{e.paid_points} pts{e.last_paid_at ? ` · last ${new Date(e.last_paid_at).toLocaleDateString('en-IN')}` : ''}</p></TableCell>
                        <TableCell>
                          {e.eligible ? <Badge className="bg-emerald-500/10 text-emerald-600">ready to pay</Badge>
                            : e.available_points > 0 ? <Badge className="bg-amber-500/10 text-amber-600">not eligible yet · needs {e.points_to_eligible} more</Badge>
                            : <span className="text-xs text-muted-foreground">nothing to pay</span>}
                          {e.details_status !== 'verified' && (
                            <p className="text-[11px] mt-1 text-destructive">{e.details_status === 'missing' ? 'Payout details not filled in' : 'Payout details not verified'}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button size="sm" disabled={!e.eligible || e.details_status !== 'verified'} title={e.details_status === 'verified' ? undefined : 'Payout details must be filled in and verified first'} onClick={() => setPayTarget(e)}><Wallet className="h-4 w-4 mr-1" />Mark paid</Button>
                          <Button size="sm" variant="ghost" disabled={e.available_points <= 0} title="Reset points to zero" onClick={() => setResetTarget(e)}><RotateCcw className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => openHistory(e)}>History</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Tasks ---------------- */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          <Card className={cardCls}>
            <CardHeader className={headCls}>
              <CardTitle className="text-lg">Task master</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">What earns points, how many, and what releases them. Changes apply to new points — points already earned keep their value. Switch a task off to stop it earning. For one-off jobs, use <b>Add custom task</b> on an employee (Employees tab, then the <Eye className="inline h-3.5 w-3.5 -mt-0.5" /> button on that employee).</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Task</TableHead><TableHead>For</TableHead><TableHead>Points</TableHead><TableHead>Released when</TableHead><TableHead>Limits</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(taskData?.tasks || []).map((t) => {
                      const meta = trigger(t.trigger_key);
                      return (
                        <TableRow key={t.id}>
                          <TableCell><p className="font-medium">{t.label}</p><p className="text-xs text-muted-foreground max-w-[260px]">{t.description}</p></TableCell>
                          <TableCell><Badge variant="outline" className="uppercase text-[10px]">{meta?.user_type}</Badge></TableCell>
                          <TableCell className="font-bold">{t.points}</TableCell>
                          <TableCell className="text-sm">{releaseLabel(t.release_on)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {[t.max_count !== null && `up to ${t.max_count} sales`, t.window_days && `within ${t.window_days} days`, t.min_order_value > 0 && `orders ≥ ${formatPrice(t.min_order_value)}`].filter(Boolean).join(' · ') || '—'}
                          </TableCell>
                          <TableCell><Badge className={t.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}>{t.is_active ? 'on' : 'off'}</Badge></TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button size="icon" variant="ghost" onClick={() => openTask(t)}><Pencil className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Settings ---------------- */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Point value', value: payoutMode === 'tiered' ? 'Tiered slabs' : `Flat · ${formatPrice(rates?.current ?? 1)}/pt`, sub: payoutMode === 'tiered' ? `${tiers.length} slabs, counted per month` : 'one rate for every point' },
              { label: 'Minimum to redeem', value: `${settingsVal('min_redeem_points')} pts`, sub: 'below this: not eligible yet' },
              { label: 'Payout schedule', value: cycleLabel(settingsVal('payout_cycle')).split(' (')[0], sub: payables ? `next: ${new Date(payables.next_payout_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : '' },
              { label: 'Code window', value: `${settingsVal('referral_window_days')} days`, sub: 'to add a referral code' },
            ].map((c) => (
              <Card key={c.label} className={cardCls}><CardContent className="p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.label}</p>
                <p className="text-base sm:text-lg font-black mt-1 leading-tight">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-start">
            {/* Section menu: clearly button-like items — solid orange when selected, bordered cards otherwise */}
            <nav className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:w-64 shrink-0" aria-label="Settings sections">
              {[
                { key: 'referral', title: 'Referral code', sub: 'Who can add a code, and until when', Icon: UserPlus },
                { key: 'payouts', title: 'Payouts', sub: 'How points turn into money', Icon: Wallet },
                { key: 'redeem', title: 'Redeeming', sub: 'Minimum points and payout schedule', Icon: CalendarClock },
              ].map((item) => {
                const active = settingsTab === item.key;
                return (
                  <button key={item.key} type="button" onClick={() => setSettingsTab(item.key as 'referral' | 'payouts' | 'redeem')} aria-current={active ? 'page' : undefined}
                    className={`flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 rounded-xl border px-2 lg:px-3 py-2.5 lg:py-3 text-center lg:text-left shadow-sm transition-all ${active ? 'bg-primary border-primary text-primary-foreground shadow-md' : 'bg-white border-border hover:border-primary/50 hover:shadow-md'}`}>
                    <span className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${active ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}><item.Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 lg:flex-1">
                      <span className="block text-xs lg:text-sm font-bold leading-tight">{item.title}</span>
                      <span className={`hidden lg:block text-xs mt-0.5 ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{item.sub}</span>
                    </span>
                    <ChevronRight className={`hidden lg:block h-4 w-4 shrink-0 ${active ? '' : 'text-muted-foreground'}`} />
                  </button>
                );
              })}
            </nav>

            <div className="flex-1 min-w-0 space-y-4">
              {settingsTab === 'referral' && (
                <Card className={cardCls}>
                  <CardHeader className={headCls}><CardTitle className="text-lg">Referral code</CardTitle></CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-5">
                    {settings.filter((s) => s.key === 'referral_window_days').map((s) => (
                      <div key={s.key} className="space-y-1.5 max-w-xs">
                        <Label>{s.label}</Label>
                        <Input type="number" min={0} value={settingsForm[s.key] ?? ''} onChange={(e) => setSettingsForm({ ...settingsForm, [s.key]: e.target.value })} />
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      </div>
                    ))}
                    <Button onClick={saveSettings} className="w-full sm:w-auto">Save</Button>
                  </CardContent>
                </Card>
              )}

              {settingsTab === 'payouts' && (
                <>
                  <Card className={cardCls}>
                    <CardHeader className={headCls}><CardTitle className="text-lg">How points turn into money</CardTitle></CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-5">
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { value: 'flat', title: 'Flat', text: 'Every point is worth the same rupee amount.' },
                          { value: 'tiered', title: 'Tiered', text: 'The value per point changes as an employee crosses slabs during a calendar month.' },
                        ].map((o) => (
                          <button key={o.value} type="button" onClick={() => setSettingsForm({ ...settingsForm, payout_mode: o.value })}
                            className={`text-left rounded-xl border p-4 transition-colors ${settingsForm.payout_mode === o.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}>
                            <p className="font-bold">{o.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{o.text}</p>
                          </button>
                        ))}
                      </div>

                      {/* The setup for whichever method is selected shows right here */}
                      {settingsForm.payout_mode === 'tiered' ? (
                        <div className="space-y-3 rounded-xl bg-muted/30 border border-border/60 p-4">
                          <div>
                            <p className="font-bold text-sm">Slabs</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Counted per calendar month of release, like income-tax slabs. Points already paid earlier in the same month are taken into account, so a month costs the same however often you pay.</p>
                          </div>
                          {tiers.map((t, i) => {
                            const last = i === tiers.length - 1;
                            return (
                              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">{last ? 'Above the previous slab' : 'Up to (points)'}</Label>
                                  <Input type="number" disabled={last} value={last ? '' : t.upto} placeholder={last ? 'no limit' : ''} onChange={(e) => setTier(i, { upto: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">₹ per point</Label>
                                  <Input type="number" step="0.01" min={0} value={t.rate} onChange={(e) => setTier(i, { rate: e.target.value })} />
                                </div>
                                <Button size="icon" variant="ghost" disabled={tiers.length <= 1} title="Remove slab" onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            );
                          })}
                          <Button size="sm" variant="outline" onClick={() => {
                            const list = [...tiers];
                            const lastOpen = list.pop() || { upto: '', rate: '1' };
                            const prevUpto = list.length ? Number(list[list.length - 1].upto) : 0;
                            setTiers([...list, { upto: String(prevUpto + 500), rate: lastOpen.rate }, lastOpen]);
                          }}><Plus className="h-4 w-4 mr-1" />Add slab</Button>
                          <div className="rounded-lg bg-white border border-border/60 p-3 text-sm flex flex-wrap items-center gap-x-3 gap-y-2">
                            <span>Preview: an employee earning</span>
                            <Input type="number" min={0} className="w-24 h-8" value={previewPts} onChange={(e) => setPreviewPts(e.target.value)} />
                            <span>points in a month gets <b>{formatPrice(previewValue(Number(previewPts) || 0))}</b>{(Number(previewPts) || 0) > 0 && <> (avg {formatPrice(previewValue(Number(previewPts)) / Number(previewPts))} per point)</>}.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-xl bg-muted/30 border border-border/60 p-4">
                          <p className="text-sm">
                            Right now <b>1 point = {formatPrice(rates?.current ?? 1)}</b>
                            {(rates?.history.length ?? 0) === 0 && <span className="text-muted-foreground"> (default — you haven't set a rate yet)</span>}.
                          </p>
                          <p className="text-xs text-muted-foreground">A point is valued at the rate in force on the day it was <b>released</b>. If you change the rate on 20 October, everything released before that keeps the old rate.</p>
                          <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                            <div className="space-y-1.5"><Label className="text-xs">New value (₹ per point)</Label><Input type="number" min={0} step="0.01" value={rateForm.rupees_per_point} onChange={(e) => setRateForm({ ...rateForm, rupees_per_point: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Starts (blank = now)</Label><Input type="datetime-local" value={rateForm.effective_from} onChange={(e) => setRateForm({ ...rateForm, effective_from: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Note</Label><Input value={rateForm.note} onChange={(e) => setRateForm({ ...rateForm, note: e.target.value })} placeholder="optional" /></div>
                            <Button disabled={!(Number(rateForm.rupees_per_point) > 0)} onClick={async () => {
                              const ok = await act(() => api.employees.adminAddRate(Number(rateForm.rupees_per_point), rateForm.effective_from ? new Date(rateForm.effective_from).toISOString() : undefined, rateForm.note || undefined), 'New rate saved');
                              if (ok) setRateForm({ rupees_per_point: '', effective_from: '', note: '' });
                            }}>Set rate</Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">A new rate is applied straight away when you press "Set rate" — it doesn't wait for Save below.</p>
                          {(rates?.history.length ?? 0) > 0 && (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader><TableRow><TableHead>Starts</TableHead><TableHead>1 point =</TableHead><TableHead>Set by</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {(rates?.history || []).map((r) => (
                                    <TableRow key={r.id}>
                                      <TableCell className="text-sm whitespace-nowrap">{new Date(r.effective_from).toLocaleString('en-IN')}{new Date(r.effective_from) > new Date() && <Badge variant="outline" className="ml-2 text-[10px]">scheduled</Badge>}</TableCell>
                                      <TableCell className="font-bold">{formatPrice(r.rupees_per_point)}</TableCell>
                                      <TableCell className="text-sm">{r.created_by_name || 'System'}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{r.note || '—'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button onClick={savePayouts} className="w-full sm:w-auto">Save payout settings</Button>
                </>
              )}

              {settingsTab === 'redeem' && (
                  <Card className={cardCls}>
                    <CardHeader className={headCls}><CardTitle className="text-lg">Redeeming &amp; payout schedule</CardTitle></CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        {settings.filter((s) => ['min_redeem_points', 'payout_cycle'].includes(s.key)).map((s) => (
                          <div key={s.key} className="space-y-1.5">
                            <Label>{s.label}</Label>
                            {s.kind === 'select' ? (
                              <Select value={settingsForm[s.key]} onValueChange={(v) => setSettingsForm({ ...settingsForm, [s.key]: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{(s.options || []).map((o: any) => <SelectItem key={optValue(o)} value={optValue(o)}>{optLabel(o)}</SelectItem>)}</SelectContent>
                              </Select>
                            ) : (
                              <Input type="number" min={0} value={settingsForm[s.key] ?? ''} onChange={(e) => setSettingsForm({ ...settingsForm, [s.key]: e.target.value })} />
                            )}
                            <p className="text-xs text-muted-foreground">{s.description}</p>
                          </div>
                        ))}
                      </div>
                      <Button onClick={saveSettings} className="w-full sm:w-auto">Save</Button>
                    </CardContent>
                  </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create employee */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
            <DialogDescription>They get a portal login and a personal referral code automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Full name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email (login) *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Temporary password * (min 6)</Label><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createEmployee} disabled={saving || !form.full_name || !form.email || form.password.length < 6}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!pwTarget} onOpenChange={(o) => !o && setPwTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset password — {pwTarget?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-1.5"><Label>New password (min 6)</Label><Input value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPwTarget(null)}>Cancel</Button>
            <Button disabled={newPw.length < 6} onClick={async () => { if (await act(() => api.employees.adminResetPassword(pwTarget.id, newPw), 'Password reset')) setPwTarget(null); }}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment history */}
      <Dialog open={!!historyTarget} onOpenChange={(o) => !o && setHistoryTarget(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Payments &amp; resets — {historyTarget?.full_name}</DialogTitle></DialogHeader>
          {!history ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
            : history.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">Nothing recorded yet.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>What</TableHead><TableHead>Points</TableHead><TableHead>Amount</TableHead><TableHead>Reference / reason</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {history.map((p) => (
                  <TableRow key={p.id} className={p.status === 'void' ? 'opacity-60' : ''}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleString('en-IN')}<p className="text-muted-foreground">{p.created_by_name}</p></TableCell>
                    <TableCell><Badge className={p.kind === 'reset' ? 'bg-slate-500/10 text-slate-600' : 'bg-blue-500/10 text-blue-600'}>{p.kind === 'reset' ? 'reset' : `paid · ${p.method}`}</Badge>{p.status === 'void' && <Badge variant="outline" className="ml-1 text-[10px]">void</Badge>}</TableCell>
                    <TableCell>{p.points}</TableCell>
                    <TableCell className="font-bold">{p.kind === 'reset' ? '—' : formatPrice(p.amount)}</TableCell>
                    <TableCell className="text-xs max-w-[220px]">{p.reference || p.note}{p.note && p.reference ? <span className="text-muted-foreground"> · {p.note}</span> : null}{p.status === 'void' && <p className="text-destructive">Void: {p.void_reason}</p>}</TableCell>
                    <TableCell className="text-right">{p.status === 'paid' && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => voidPayout(p)}>Void</Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Task editor */}
      <Dialog open={!!taskForm} onOpenChange={(o) => !o && setTaskForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task — {tf?.label}</DialogTitle>
            <DialogDescription>{tf?.hint}</DialogDescription>
          </DialogHeader>
          {taskForm && tf && (
            <div className="grid gap-3">
              <div className="space-y-1.5"><Label>Name (shown to employees)</Label><Input value={taskForm.label} onChange={(e) => setTaskForm({ ...taskForm, label: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Input value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Points</Label><Input type="number" min={0} value={taskForm.points} onChange={(e) => setTaskForm({ ...taskForm, points: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label>Released when</Label>
                  <Select value={taskForm.release_on} onValueChange={(v) => setTaskForm({ ...taskForm, release_on: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{tf.releases.map((r: string) => <SelectItem key={r} value={r}>{releaseLabel(r)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {(tf.counted || tf.windowed || tf.order) && (
                <div className="grid grid-cols-2 gap-3">
                  {tf.counted && <div className="space-y-1.5"><Label>Number of further sales that earn</Label><Input type="number" min={0} value={taskForm.max_count} onChange={(e) => setTaskForm({ ...taskForm, max_count: e.target.value })} /></div>}
                  {tf.windowed && <div className="space-y-1.5"><Label>Window (days, blank = none)</Label><Input type="number" min={1} value={taskForm.window_days} onChange={(e) => setTaskForm({ ...taskForm, window_days: e.target.value })} /><p className="text-[11px] text-muted-foreground">Counted from the day the code was attached</p></div>}
                  {tf.order && <div className="space-y-1.5"><Label>Minimum order value (₹)</Label><Input type="number" min={0} value={taskForm.min_order_value} onChange={(e) => setTaskForm({ ...taskForm, min_order_value: e.target.value })} /></div>}
                </div>
              )}
              <div className="flex items-center gap-3"><Switch checked={taskForm.is_active} onCheckedChange={(v) => setTaskForm({ ...taskForm, is_active: v })} /><Label>Active — earns points for new activity</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTaskForm(null)}>Cancel</Button>
            <Button disabled={!taskForm?.label.trim() || taskForm.points === ''} onClick={saveTask}>Save task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PayDialog target={payTarget} onClose={() => setPayTarget(null)} onDone={loadAll} />
      <ResetDialog target={resetTarget} onClose={() => setResetTarget(null)} onDone={loadAll} />
    </div>
  );
}
