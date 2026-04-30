import { useState, useEffect } from 'react';
import { Save, Plus, Pencil, Trash2, MapPin, Building, Phone, Mail, CheckCircle, Loader2, Info, ShoppingBag, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api, apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  description: string;
  businessType: string;
  gstNumber: string;
  panNumber: string;
  establishedYear: string;
}

const initialProfile: ProfileData = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  description: '',
  businessType: 'Retailer',
  gstNumber: '',
  panNumber: '',
  establishedYear: '',
};

const businessTypes = [
  'Retailer',
  'Wholesaler',
  'Distributor',
  'Manufacturer',
  'Contractor',
  'Other',
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

export default function BuyerProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    label: '', name: '', phone: '', address: '', city: '', state: '', pincode: '', isDefault: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ orders: 0, rfqs: 0, memberSince: '—' });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await api.auth.getMe();
        const businessDetails = data.business_details || {};
        
        setProfile({
          name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          companyName: data.business_name || '',
          description: data.description || businessDetails.description || '',
          businessType: businessTypes.find(t => t.toLowerCase() === (data.business_type || businessDetails.businessType || '').toLowerCase()) || 'Retailer',
          gstNumber: data.gst_number || businessDetails.gstNumber || '',
          panNumber: data.pan_number || businessDetails.panNumber || '',
          establishedYear: data.established_year || businessDetails.establishedYear || '',
        });

        const memberSince = data.created_at
          ? new Date(data.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
          : '—';

        // Fetch basic counts
        let orderCount = 0;
        let rfqCount = 0;
        try {
          const statsData = await api.stats.get();
          orderCount = statsData.orders || 0;
          rfqCount = statsData.rfqs || 0;
        } catch { /* ignore */ }

        setStats({ orders: orderCount, rfqs: rfqCount, memberSince });
        
        // Load addresses from backend
        setAddresses(businessDetails.addresses || []);

      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.profiles.update(user!.id, {
        full_name: profile.name,
        business_name: profile.companyName,
        business_type: profile.businessType,
        description: profile.description,
        phone: profile.phone,
        gst_number: profile.gstNumber,
        pan_number: profile.panNumber,
        established_year: profile.establishedYear,
      });
      toast({ title: 'Profile updated successfully!' });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const persistAddresses = async (newAddresses: Address[]) => {
    try {
      await api.profiles.update(user!.id, {
        addresses: newAddresses
      });
      setAddresses(newAddresses);
      return true;
    } catch (error: any) {
      toast({ title: 'Failed to save address', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const handleSaveAddress = async () => {
    let newAddresses = [...addresses];
    if (editingAddress) {
      newAddresses = addresses.map(a => a.id === editingAddress.id ? { ...a, ...addressForm } : a);
    } else {
      const newAddr = { id: `addr-${Date.now()}`, ...addressForm };
      // If first address or marked default, ensure it's the only default
      if (newAddresses.length === 0) newAddr.isDefault = true;
      if (newAddr.isDefault) {
        newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
      }
      newAddresses.push(newAddr);
    }
    
    if (await persistAddresses(newAddresses)) {
      setAddressDialogOpen(false);
      toast({ title: editingAddress ? 'Address updated' : 'Address added' });
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteAddressId) return;
    const newAddresses = addresses.filter(a => a.id !== deleteAddressId);
    if (await persistAddresses(newAddresses)) {
      setDeleteDialogOpen(false);
      setDeleteAddressId(null);
      toast({ title: 'Address deleted' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const completionPercent = [
    profile.name, profile.companyName, profile.phone, 
    profile.gstNumber, addresses.length > 0
  ].filter(Boolean).length * 20;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Buyer Profile</h1>
          <p className="text-muted-foreground">Manage your personal and business credentials</p>
        </div>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          Your profile information helps sellers verify your business when you raise RFQs.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Identity
                </CardTitle>
                <CardDescription>Professional details for B2B transactions</CardDescription>
              </div>
              <Button 
                variant={isEditingProfile ? "default" : "outline"} 
                size="sm" 
                onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isEditingProfile ? <Save className="h-4 w-4 mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                {isEditingProfile ? "Save" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Person</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Business Name</Label>
                  <Input
                    id="companyName"
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={profile.businessType}
                    onValueChange={(v) => setProfile({ ...profile, businessType: v })}
                    disabled={!isEditingProfile}
                  >
                    <SelectTrigger id="businessType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Est. Year</Label>
                  <Input
                    id="establishedYear"
                    placeholder="e.g. 2010"
                    value={profile.establishedYear}
                    onChange={(e) => setProfile({ ...profile, establishedYear: e.target.value })}
                    disabled={!isEditingProfile}
                    maxLength={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">About Your Business</Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    placeholder="Tell sellers about your sourcing needs, expertise, and requirements..."
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    disabled={!isEditingProfile}
                    className="min-h-[120px] resize-none pr-10"
                  />
                  <div className="absolute right-3 top-3 text-muted-foreground/30">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    value={profile.gstNumber}
                    onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value.toUpperCase() })}
                    disabled={!isEditingProfile}
                    className="font-mono"
                    maxLength={15}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    value={profile.panNumber}
                    onChange={(e) => setProfile({ ...profile, panNumber: e.target.value.toUpperCase() })}
                    disabled={!isEditingProfile}
                    className="font-mono"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Sourcing & Billing Addresses
                </CardTitle>
                <CardDescription>Add multiple locations for deliveries and invoices</CardDescription>
              </div>
              <Button size="sm" onClick={() => { 
                setEditingAddress(null); 
                setAddressForm({ label: '', name: profile.name, phone: profile.phone, address: '', city: '', state: '', pincode: '', isDefault: addresses.length === 0 });
                setAddressDialogOpen(true); 
              }}>
                <Plus className="h-4 w-4 mr-2" /> Add New
              </Button>
            </CardHeader>
            <CardContent>
              {addresses.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div key={address.id} className={cn(
                      "p-4 rounded-xl border transition-all duration-200 relative group",
                      address.isDefault ? "bg-primary/[0.03] border-primary/30 shadow-sm" : "bg-muted/30 border-transparent hover:border-muted-foreground/20"
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={address.isDefault ? "default" : "outline"} className="text-[10px] uppercase tracking-wider px-2 py-0">
                            {address.label || 'Location'}
                          </Badge>
                          {address.isDefault && <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Default</span>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => { 
                            setEditingAddress(address); 
                            setAddressForm({ ...address });
                            setAddressDialogOpen(true); 
                          }}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => { 
                            setDeleteAddressId(address.id);
                            setDeleteDialogOpen(true);
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="font-bold text-sm truncate">{address.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {address.phone}
                      </p>
                      <Separator className="my-2 bg-border/50" />
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {address.address}
                      </p>
                      <p className="text-xs font-medium mt-1">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                  <MapPin className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No addresses added yet</p>
                  <Button variant="link" size="sm" onClick={() => setAddressDialogOpen(true)}>Add your first location</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Account Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 transition-transform hover:scale-[1.02]">
                  <ShoppingBag className="h-5 w-5 text-primary mb-2" />
                  <p className="text-2xl font-black tracking-tight">{stats.orders}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Orders</p>
                </div>
                <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 transition-transform hover:scale-[1.02]">
                  <FileText className="h-5 w-5 text-orange-500 mb-2" />
                  <p className="text-2xl font-black tracking-tight">{stats.rfqs}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active RFQs</p>
                </div>
              </div>
              <div className="space-y-3 p-4 rounded-2xl bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle className={cn("h-4 w-4", user?.status === 'approved' ? "text-success" : "text-orange-500")} /> Account Status
                  </span>
                  <Badge 
                    variant={user?.status === 'approved' ? 'success' : user?.status === 'rejected' ? 'destructive' : 'secondary'} 
                    className="h-6 px-3 rounded-full font-bold capitalize"
                  >
                    {user?.status || 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Member Since
                  </span>
                  <span className="font-bold">{stats.memberSince}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-success/5 border-b border-success/10 pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                Profile Strength
                <Badge variant="outline" className="bg-white/50">{completionPercent}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5 border">
                  <div 
                    className="h-full bg-success rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-1000 ease-out" 
                    style={{ width: `${completionPercent}%` }} 
                  />
                </div>
                <div className="grid gap-2">
                  {[
                    { label: 'Business Identity', done: profile.companyName && profile.businessType },
                    { label: 'Contact Details', done: profile.name && profile.phone },
                    { label: 'GST/PAN Verified', done: profile.gstNumber && profile.panNumber },
                    { label: 'Shipping Address', done: addresses.length > 0 },
                    { label: 'Business Description', done: profile.description.length > 20 },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                      <span className={cn(item.done ? "text-foreground font-medium" : "text-muted-foreground")}>{item.label}</span>
                      {item.done ? <CheckCircle className="h-4 w-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2 border-muted" />}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>Enter the location details for your business sourcing</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (e.g. Office, Warehouse)</Label>
                <Input value={addressForm.label} onChange={e => setAddressForm({...addressForm, label: e.target.value})} placeholder="Main Office" />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} placeholder="John Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-2">
              <Label>Address Line</Label>
              <Textarea value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} placeholder="123, Business Park, Phase 1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} placeholder="Mumbai" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={addressForm.state} onValueChange={v => setAddressForm({...addressForm, state: v})}>
                  <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                  <SelectContent>
                    {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} placeholder="400001" maxLength={6} />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox 
                  id="isDefault" 
                  checked={addressForm.isDefault} 
                  onCheckedChange={(checked) => setAddressForm({...addressForm, isDefault: !!checked})} 
                />
                <Label htmlFor="isDefault" className="text-sm font-medium leading-none cursor-pointer">Set as default address</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress}>Save Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This address will be permanently removed from your profile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
