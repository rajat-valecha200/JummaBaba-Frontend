import { useState, useEffect } from 'react';
import {
  Eye, Search, Filter, Shield, ShoppingCart, Store, Loader2,
  CheckCircle, XCircle, FileText, File, ImageIcon, Download,
  Building2, MapPin, Phone, Mail, CalendarDays, BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api, apiFetch } from '@/lib/api';

type UserRole = 'buyer' | 'vendor' | 'admin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const resolveUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return <Badge className="bg-primary/10 text-primary border-primary/20"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    case 'vendor':
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Store className="h-3 w-3 mr-1" />Vendor</Badge>;
    default:
      return <Badge variant="outline"><ShoppingCart className="h-3 w-3 mr-1" />Buyer</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><BadgeCheck className="h-3 w-3 mr-1" />Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
  }
};

function DocSlot({ url, label }: { url: string | null; label: string }) {
  const resolved = resolveUrl(url);
  const isPdf = resolved?.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {resolved ? (
        <div className="border rounded-lg overflow-hidden bg-muted/30 aspect-video flex items-center justify-center relative group">
          {isPdf ? (
            <div className="flex flex-col items-center gap-2 text-primary">
              <File className="h-10 w-10" />
              <span className="text-xs font-medium">PDF Document</span>
            </div>
          ) : (
            <img
              src={resolved}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <a
            href={resolved}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <span className="bg-white text-black text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Download className="h-3 w-3" /> Open
            </span>
          </a>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg aspect-video flex flex-col items-center justify-center gap-1 text-muted-foreground/50 bg-muted/20">
          <ImageIcon className="h-8 w-8" />
          <span className="text-xs">Not uploaded</span>
        </div>
      )}
    </div>
  );
}

function UserActivityDialog({
  user,
  open,
  onClose,
}: {
  user: any;
  open: boolean;
  onClose: () => void;
}) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      const fetchActivity = async () => {
        try {
          setLoading(true);
          const allRfqs = await api.rfqs.list();
          const userRfqs = allRfqs.filter((r: any) => r.buyer_id === user.id);
          setActivities(userRfqs);
        } catch (error) {
          console.error('Failed to fetch user activity:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchActivity();
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Activity History: {user?.full_name || user?.business_name}
          </DialogTitle>
          <DialogDescription>
            All RFQs, inquiries, and orders placed by this user.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-[300px] py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Fetching activity records...</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Moderation</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((rfq) => (
                    <TableRow key={rfq.id}>
                      <TableCell className="text-xs font-medium">
                        {new Date(rfq.created_at).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm font-semibold truncate">{rfq.product_name}</p>
                        <p className="text-[10px] text-muted-foreground">ID: {rfq.id.slice(0, 8)}...</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {rfq.quantity} {rfq.unit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rfq.status === 'ordered' ? 'success' : 'secondary'} className="text-[10px] uppercase">
                          {rfq.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {rfq.moderation_status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <a href="/admin/rfqs" className="text-xs">View RFQ</a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No activity records found for this buyer.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserDetailDialog({
  user,
  open,
  onClose,
  onRefresh,
}: {
  user: any;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actioning, setActioning] = useState(false);

  if (!user) return null;

  const docs = user.document_paths || {};
  const bd = user.business_details || {};
  const addresses = bd.addresses || [];
  const initials = (user.full_name || user.email || '?')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleApprove = async () => {
    setActioning(true);
    try {
      await api.profiles.updateStatus(user.id, 'approved');
      toast({ title: '✅ User Approved', description: `${user.full_name || user.email} is now active.` });
      onRefresh();
      onClose();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally { setActioning(false); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setActioning(true);
    try {
      await api.profiles.updateStatus(user.id, 'rejected', rejectionReason);
      toast({ title: '❌ User Rejected', description: 'The rejection reason has been recorded.' });
      onRefresh();
      onClose();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setActioning(false);
      setRejectOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start pr-8">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {initials}
                </div>
                <div>
                  <p className="text-xl">{user.full_name || user.business_name || 'Unknown User'}</p>
                  <div className="flex gap-2 mt-1">{getRoleBadge(user.role)}{getStatusBadge(user.status)}</div>
                </div>
              </DialogTitle>
              {user.role === 'buyer' && (
                <Button variant="outline" size="sm" onClick={() => setActivityOpen(true)}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> View Activity
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 p-5 bg-muted/40 rounded-2xl border border-muted">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Phone Number</p>
                  <p className="text-sm font-semibold">{user.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Business Entity</p>
                  <p className="text-sm font-semibold">{user.business_name || 'Individual'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Registration Date</p>
                  <p className="text-sm font-semibold">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 px-1 text-muted-foreground">
                <Building2 className="h-4 w-4" /> Business Identity & Credentials
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-muted/40 rounded-2xl border border-muted">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Business Type</p>
                  <p className="text-xs font-semibold capitalize">{user.business_type || bd.businessType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Year</p>
                  <p className="text-xs font-semibold">{user.established_year || bd.establishedYear || 'N/A'}</p>
                </div>
                <div className="col-span-full pt-1">
                  <Separator className="my-2 opacity-50" />
                </div>
                {(user.description || bd.description) && (
                  <div className="col-span-full">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">About Business</p>
                    <p className="text-xs italic text-muted-foreground mt-1 mb-2">"{user.description || bd.description}"</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">GST Number</p>
                  <p className="text-xs font-mono font-bold text-primary">{user.gst_number || bd.gstNumber || 'PENDING'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">PAN Number</p>
                  <p className="text-xs font-mono font-bold text-primary">{user.pan_number || bd.panNumber || 'PENDING'}</p>
                </div>
              </div>
            </div>

            {/* Addresses (Added for Buyer/Vendor) */}
            {(addresses.length > 0 || user.location) && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2 px-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> Registered Locations ({addresses.length || (user.location ? 1 : 0)})
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {addresses.length > 0 ? addresses.map((addr: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border bg-muted/20 text-xs relative">
                      {addr.isDefault && <Badge className="absolute top-2 right-2 text-[8px] h-4 px-1">Default</Badge>}
                      <p className="font-bold text-primary mb-1">{addr.label || 'Address'}</p>
                      <p className="font-semibold">{addr.name}</p>
                      <p className="text-muted-foreground line-clamp-2 mt-0.5">{addr.address}</p>
                      <p className="font-medium mt-1">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  )) : (
                    <div className="p-3 rounded-xl border bg-muted/20 text-xs col-span-full">
                      <p className="font-bold text-primary mb-1">Primary Location</p>
                      <p className="text-muted-foreground capitalize">{user.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Uploads */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 px-1 text-muted-foreground">
                <BadgeCheck className="h-4 w-4" /> Verification Documents
              </h4>
              {Object.keys(docs).length === 0 && !docs.gst_certificate && !docs.pan_card ? (
                <div className="p-4 border-2 border-dashed rounded-2xl text-center text-muted-foreground text-sm bg-muted/10">
                  No verification documents uploaded yet
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <DocSlot url={docs.gst_certificate} label="GST Certificate" />
                  <DocSlot url={docs.pan_card} label="PAN Card" />
                  <DocSlot url={docs.cancelled_cheque} label="Cancelled Cheque" />
                </div>
              )}
            </div>

            {/* Rejection Reason (if already rejected) */}
            {user.status === 'rejected' && user.rejection_reason && (
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-sm text-destructive">
                <p className="font-bold mb-1 flex items-center gap-2"><XCircle className="h-4 w-4" /> Rejection Reason:</p>
                <p className="italic">"{user.rejection_reason}"</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {user.status === 'pending' && (
            <DialogFooter className="gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setRejectOpen(true)}
                disabled={actioning}
              >
                <XCircle className="h-4 w-4 mr-2" /> Reject Application
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleApprove}
                disabled={actioning}
              >
                {actioning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Approve & Activate
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Application</DialogTitle>
            <DialogDescription>Please provide a reason. This will be recorded for review.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Rejection Reason *</Label>
            <Textarea
              placeholder="e.g., Documents are unclear, Invalid GST number..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim() || actioning}>
              {actioning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserActivityDialog 
        user={user}
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
      />
    </>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.profiles.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const nameStr = `${u.full_name || ''} ${u.business_name || ''} ${u.email || ''}`.toLowerCase();
    return matchesRole && nameStr.includes(searchQuery.toLowerCase());
  });

  const buyers = users.filter(u => u.role === 'buyer');
  const vendors = users.filter(u => u.role === 'vendor');
  const pendingVendors = vendors.filter(v => v.status === 'pending');
  const admins = users.filter(u => u.role === 'admin');

  const UserTable = ({ rows }: { rows: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((user) => {
          const initials = (user.full_name || user.email || '?')
            .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
          return (
            <TableRow key={user.id} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="font-medium text-sm">{user.full_name || user.business_name || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{user.phone || '—'}</TableCell>
              <TableCell className="text-sm">{user.business_name || '—'}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>{getStatusBadge(user.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setSelectedUser(user); setDetailsOpen(true); }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
              No users found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Review registrations, verify documents, and manage user access.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-3xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-3xl font-bold text-blue-600">{buyers.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Buyers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-3xl font-bold text-amber-600">{vendors.length}</div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center">
              Vendors
              {pendingVendors.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1">{pendingVendors.length} pending</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-3xl font-bold text-primary">{admins.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <CardTitle>All Users</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="buyer">Buyers</SelectItem>
                  <SelectItem value="vendor">Vendors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({users.length})</TabsTrigger>
                <TabsTrigger value="pending" className="relative">
                  Pending
                  {pendingVendors.length > 0 && (
                    <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5">
                      {pendingVendors.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
                <TabsTrigger value="buyers">Buyers ({buyers.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <UserTable rows={filtered} />
              </TabsContent>
              <TabsContent value="pending">
                <UserTable rows={filtered.filter(u => u.status === 'pending')} />
              </TabsContent>
              <TabsContent value="vendors">
                <UserTable rows={filtered.filter(u => u.role === 'vendor')} />
              </TabsContent>
              <TabsContent value="buyers">
                <UserTable rows={filtered.filter(u => u.role === 'buyer')} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <UserDetailDialog
        user={selectedUser}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onRefresh={fetchUsers}
      />
    </div>
  );
}
