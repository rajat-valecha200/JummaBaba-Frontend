import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const STATUSES = ['new', 'contacted', 'interested', 'registered', 'lost'];
const statusStyle: Record<string, string> = {
  new: 'bg-slate-500/10 text-slate-600',
  contacted: 'bg-blue-500/10 text-blue-600',
  interested: 'bg-amber-500/10 text-amber-600',
  registered: 'bg-emerald-500/10 text-emerald-600',
  lost: 'bg-destructive/10 text-destructive',
};
const blank = { lead_type: 'seller', business_name: '', contact_name: '', phone: '', email: '', city: '', notes: '' };

// The employee's own pipeline of people they're talking to, before they've signed up. When one of
// them later registers with this employee's code (matching phone/email), the lead flips to
// "registered" automatically.
export default function EmployeeLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blank);
  const { toast } = useToast();

  const load = async () => {
    try {
      setLeads(await api.employees.listLeads());
    } catch (err: any) {
      toast({ title: 'Could not load leads', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.employees.createLead(form);
      toast({ title: 'Lead added' });
      setOpen(false);
      setForm(blank);
      await load();
    } catch (err: any) {
      toast({ title: 'Could not add lead', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await api.employees.updateLead(id, { status });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await api.employees.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const f = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">People you're talking to who haven't signed up yet</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add lead</Button>
      </div>

      <Card className="border-border/50 bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No leads yet. Add the businesses you're pitching so you can track them.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business / contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <p className="font-medium">{l.business_name}</p>
                        {l.contact_name && <p className="text-xs text-muted-foreground">{l.contact_name}</p>}
                        {l.notes && <p className="text-xs text-muted-foreground max-w-[260px] truncate">{l.notes}</p>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="uppercase text-[10px]">{l.lead_type}</Badge></TableCell>
                      <TableCell className="text-sm">{l.phone || '—'}</TableCell>
                      <TableCell className="text-sm">{l.city || '—'}</TableCell>
                      <TableCell>
                        {l.status === 'registered' ? (
                          <Badge className={statusStyle.registered}>registered</Badge>
                        ) : (
                          <Select value={l.status} onValueChange={(v) => setStatus(l.id, v)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.filter((s) => s !== 'registered').map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add lead</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>They will join as</Label>
              <Select value={form.lead_type} onValueChange={(v) => setForm({ ...form, lead_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Business name *</Label><Input value={form.business_name} onChange={f('business_name')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Contact person</Label><Input value={form.contact_name} onChange={f('contact_name')} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={f('phone')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={f('email')} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={f('city')} /></div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={f('notes')} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.business_name.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
