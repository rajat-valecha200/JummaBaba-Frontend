import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ClipboardList, 
  Search, 
  Trash2, 
  Download, 
  Loader2, 
  Calendar,
  Mail,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminWaitlist() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWaitlist = async () => {
    try {
      const data = await api.waitlist.list();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({
        title: "Fetch Failed",
        description: err.message || "Failed to load waitlist signups.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this email from the waitlist?")) return;
    setDeletingId(id);
    try {
      await api.waitlist.remove(id);
      toast({
        title: "Entry Removed",
        description: "The email has been deleted from the waitlist.",
      });
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete waitlist entry.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      toast({
        title: "Export Cancelled",
        description: "There are no signups to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Email", "Signed Up At"];
    const rows = entries.map(e => [
      e.email,
      new Date(e.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jummababa_waitlist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Success",
      description: `Successfully exported ${entries.length} signups to CSV.`,
    });
  };

  const filteredEntries = entries.filter(entry => 
    entry.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Waitlist Signups</h1>
          <p className="text-muted-foreground">Monitor and manage business launch waitlist leads ({entries.length} total)</p>
        </div>

        <Button 
          onClick={handleExportCSV}
          className="rounded-xl font-bold text-xs uppercase tracking-wider h-11 px-5 shadow-lg shadow-primary/10"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl">
        <CardHeader className="border-b bg-muted/20 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-wider">Early Leads</CardTitle>
              <CardDescription>Review verified customer acquisition targets</CardDescription>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search signups by email..." 
              className="pl-9 h-10 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-4">
              <Mail className="h-12 w-12 mx-auto text-slate-300" />
              <p className="font-bold text-sm">No waitlist signups found</p>
              <p className="text-xs text-slate-400">Waitlist signups will populate automatically as users submit their emails.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Business Email</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Registration Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{entry.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>
                            {new Date(entry.created_at).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === entry.id}
                          onClick={() => handleDelete(entry.id)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition"
                        >
                          {deletingId === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
