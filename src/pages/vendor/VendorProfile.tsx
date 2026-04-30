import { useEffect, useRef, useState } from 'react';
import { Save, Upload, CheckCircle, Clock, Building, MapPin, Phone, Mail, Globe, FileText, Shield, Info, Lock, Loader2, Eye } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TrustBadge } from '@/components/b2b/TrustBadge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiFetch } from '@/lib/api';

interface ProfileData {
  companyName: string;
  logo: string;
  description: string;
  businessType: string;
  yearEstablished: number;
  annualTurnover: string;
  employeeCount: string;
  gstNumber: string;
  gstVerified: boolean;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
}

const initialProfile: ProfileData = {
  companyName: '',
  logo: '',
  description: '',
  businessType: '',
  yearEstablished: new Date().getFullYear(),
  annualTurnover: 'Less than ₹1 Cr',
  employeeCount: '1-10',
  gstNumber: '',
  gstVerified: false,
  panNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  website: '',
};

const businessTypes = [
  'Manufacturer',
  'Manufacturer & Exporter',
  'Wholesaler',
  'Distributor',
  'Retailer',
  'Importer',
  'Service Provider',
];

const turnoverRanges = [
  'Less than ₹1 Cr',
  '₹1-10 Cr',
  '₹10-25 Cr',
  '₹25-50 Cr',
  '₹50-100 Cr',
  '₹100-500 Cr',
  'Above ₹500 Cr',
];

const employeeRanges = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

interface AccountStats {
  productCount: number;
  orderCount: number;
  memberSince: string;
}

export default function VendorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [gstVerifying, setGstVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.auth.getMe();
        const businessDetails = data.business_details || {};
        const docs = data.document_paths || {};
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        // Parse address: backend stores full address in location field, details split in business_details
        const locationStr: string = data.location || '';
        const city = businessDetails.city || '';
        const state = businessDetails.state || '';
        const pincode = businessDetails.pincode || '';
        
        // Street address = remove "city, state, pincode" suffix from location string
        const locationParts = [city, state, pincode].filter(Boolean);
        let streetAddress = locationStr;
        for (const part of locationParts) {
          streetAddress = streetAddress.replace(new RegExp(',?\\s*' + part + '\\s*,?', 'i'), '');
        }
        streetAddress = streetAddress.replace(/,\s*,/g, ',').replace(/^,|,$/g, '').trim();

        const rawBusinessType = data.business_type || businessDetails.business_type || businessDetails.businessType || 'Manufacturer';
        // Normalize business type to match one of our select options
        const normalizedBusinessType = businessTypes.find(
          t => t.toLowerCase() === rawBusinessType.toLowerCase()
        ) || 'Manufacturer';

        setProfile({
          companyName: data.companyName || data.business_name || data.full_name || '',
          logo: data.logo || '',
          description: data.description || businessDetails.description || '',
          businessType: normalizedBusinessType,
          yearEstablished: data.established_year || businessDetails.established_year || businessDetails.yearEstablished || new Date().getFullYear(),
          annualTurnover: businessDetails.annualTurnover || businessDetails.annual_turnover || 'Less than ₹1 Cr',
          employeeCount: businessDetails.employeeCount || businessDetails.employee_count || '1-10',
          gstNumber: data.gst_number || businessDetails.gst_number || businessDetails.gstNumber || '',
          gstVerified: data.status === 'approved',
          panNumber: data.pan_number || businessDetails.pan_number || businessDetails.panNumber || '',
          address: streetAddress || businessDetails.address || locationStr,
          city,
          state,
          pincode,
          phone: data.phone || '',
          email: data.email || '',
          website: businessDetails.website || '',
        });

        // Member since from created_at
        const memberSince = data.created_at
          ? new Date(data.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
          : '—';

        // Real product and order counts
        let productCount = 0;
        let orderCount = 0;
        try {
          const products = await apiFetch('/products?seller=me&limit=1');
          productCount = products.total ?? (Array.isArray(products) ? products.length : 0);
        } catch { /* ignore */ }
        try {
          const orders = await apiFetch('/orders?limit=1');
          orderCount = orders.total ?? (Array.isArray(orders) ? orders.length : 0);
        } catch { /* ignore */ }

        setStats({ productCount, orderCount, memberSince });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await api.profiles.update(user!.id, {
        business_name: profile.companyName,
        description: profile.description,
        business_type: profile.businessType,
        established_year: profile.yearEstablished,
        annual_turnover: profile.annualTurnover,
        employee_count: profile.employeeCount,
        location: [profile.address, profile.city, profile.state, profile.pincode].filter(Boolean).join(', '),
        phone: profile.phone,
        website: profile.website,
        business_details: {
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
          annualTurnover: profile.annualTurnover,
          employeeCount: profile.employeeCount,
          website: profile.website,
        },
      });
      toast({ title: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  };



  const updateField = (field: keyof ProfileData, value: string | number | boolean) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const upload = await apiFetch('/profiles/upload/logo', { method: 'POST', body: formData, headers: {} });
      await api.profiles.update(user.id, { logo_url: upload.path });
      setProfile((prev) => ({ ...prev, logo: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${upload.path}` }));
      toast({ title: 'Logo updated successfully!' });
    } catch (error: any) {
      toast({ title: 'Logo upload failed', description: error.message, variant: 'destructive' });
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Business Profile</h1>
          <p className="text-muted-foreground">Manage your company information and verification</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </div>

      {/* Communication Restriction Notice */}
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          All buyer communications are handled by JummaBaba Support. Your contact details are not shared directly with buyers.
        </AlertDescription>
      </Alert>

      {/* Trust Badges Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {profile.gstVerified && <TrustBadge type="gst" />}
            <TrustBadge type="verified" />
            <TrustBadge type="top-supplier" />
            <Badge variant="outline" className="gap-1">
              <Building className="h-3 w-3" />
              Est. {profile.yearEstablished}
            </Badge>
            <Badge variant="outline" className="gap-1">
              {profile.businessType}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={profile.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop'}
                    alt={profile.companyName}
                    className="w-24 h-24 rounded-lg object-cover border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop';
                    }}
                  />
                  {isEditing && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={profile.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={profile.businessType}
                    onValueChange={(value) => updateField('businessType', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="yearEstablished">Year Established</Label>
                  <Input
                    id="yearEstablished"
                    type="number"
                    value={profile.yearEstablished}
                    onChange={(e) => updateField('yearEstablished', parseInt(e.target.value))}
                    disabled={!isEditing}
                    min={1900}
                    max={new Date().getFullYear()}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="turnover">Annual Turnover</Label>
                  <Select
                    value={profile.annualTurnover}
                    onValueChange={(value) => updateField('annualTurnover', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {turnoverRanges.map((range) => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="employees">Number of Employees</Label>
                  <Select
                    value={profile.employeeCount}
                    onValueChange={(value) => updateField('employeeCount', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeRanges.map((range) => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Business Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  disabled={!isEditing}
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={profile.state}
                    onValueChange={(value) => updateField('state', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {indianStates.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={profile.pincode}
                    onChange={(e) => updateField('pincode', e.target.value)}
                    disabled={!isEditing}
                    maxLength={6}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    disabled={!isEditing}
                    className="pl-9"
                    placeholder="www.example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - GST & Verification */}
        <div className="space-y-6">
          {/* GST Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                GST & PAN Verification
              </CardTitle>
              <CardDescription>
                Verified documents build trust with buyers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="gst">GST Number</Label>
                    {user?.document_paths?.gst_certificate && (
                      <button 
                        type="button"
                        onClick={() => {
                          const url = user.document_paths!.gst_certificate!.startsWith('http') 
                            ? user.document_paths!.gst_certificate! 
                            : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.document_paths!.gst_certificate}`;
                          setPreviewImage(url);
                          setPreviewTitle('GST Certificate');
                        }}
                        className="text-primary hover:text-primary/80 transition-colors"
                        title="View GST Certificate"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {profile.gstVerified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-success/10 text-success border-success/20 gap-1 cursor-help">
                          <Shield className="h-3 w-3" />
                          Verified
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        GST is verified by JummaBaba Admin.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="relative mt-1">
                  <Input
                    id="gst"
                    value={profile.gstNumber}
                    readOnly
                    disabled
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="font-mono bg-muted/50"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>

              {!profile.gstVerified && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-xs">
                    Verification is pending admin review.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pan">PAN Number</Label>
                    {user?.document_paths?.pan_card && (
                      <button 
                        type="button"
                        onClick={() => {
                          const url = user.document_paths!.pan_card!.startsWith('http') 
                            ? user.document_paths!.pan_card! 
                            : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.document_paths!.pan_card}`;
                          setPreviewImage(url);
                          setPreviewTitle('PAN Card');
                        }}
                        className="text-primary hover:text-primary/80 transition-colors"
                        title="View PAN Card"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {profile.panNumber && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-success/10 text-success border-success/20 gap-1 cursor-help">
                          <Shield className="h-3 w-3" />
                          Verified
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        PAN number has been submitted.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="relative mt-1">
                  <Input
                    id="pan"
                    value={profile.panNumber}
                    readOnly
                    disabled
                    placeholder="AAAAA1234A"
                    maxLength={10}
                    className="font-mono bg-muted/50"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  PAN cannot be edited. Contact support for updates.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Strength</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Completion</span>
                  <span className="font-medium text-success">85%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: '85%' }} />
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    Company details added
                  </li>
                  <li className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    GST verified
                  </li>
                  <li className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    Contact info complete
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Add business certificates
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Account Stats — real data */}
          <Card>
            <CardHeader>
              <CardTitle>Account Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products Listed</span>
                  <span className="font-medium">
                    {stats === null ? <span className="inline-block w-8 h-4 bg-muted animate-pulse rounded" /> : stats.productCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">
                    {stats === null ? <span className="inline-block w-8 h-4 bg-muted animate-pulse rounded" /> : stats.orderCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Status</span>
                  <span className={`font-medium capitalize ${user?.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {user?.status || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">
                    {stats === null ? <span className="inline-block w-14 h-4 bg-muted animate-pulse rounded" /> : stats.memberSince}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/5 border-none">
          <DialogHeader className="p-4 bg-background border-b">
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="p-2 flex items-center justify-center min-h-[300px]">
            {previewImage && (
              <img 
                src={previewImage} 
                alt={previewTitle} 
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=600&fit=crop';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
