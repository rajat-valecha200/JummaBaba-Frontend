import { useState } from 'react';
import { Save, Upload, CheckCircle, Clock, Building, MapPin, Phone, Mail, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TrustBadge } from '@/components/b2b/TrustBadge';
import { useToast } from '@/hooks/use-toast';

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
  companyName: 'Rajesh Electronics Pvt Ltd',
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
  description: 'Leading manufacturer and supplier of electronic components and consumer electronics. Serving businesses across India since 2005 with quality products and reliable service.',
  businessType: 'Manufacturer',
  yearEstablished: 2005,
  annualTurnover: '₹50-100 Cr',
  employeeCount: '51-200',
  gstNumber: '27AABCT1234D1ZA',
  gstVerified: true,
  panNumber: 'AABCT1234D',
  address: '123, Electronics Hub, MIDC Industrial Area',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400069',
  phone: '+91 22 1234 5678',
  email: 'sales@rajeshelectronics.com',
  website: 'www.rajeshelectronics.com',
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

export default function VendorProfile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [gstVerifying, setGstVerifying] = useState(false);

  const handleSave = () => {
    toast({ title: 'Profile updated successfully!' });
    setIsEditing(false);
  };

  const handleVerifyGst = () => {
    if (!profile.gstNumber || profile.gstNumber.length !== 15) {
      toast({ title: 'Please enter a valid 15-digit GST number', variant: 'destructive' });
      return;
    }
    setGstVerifying(true);
    // Simulate verification
    setTimeout(() => {
      setProfile({ ...profile, gstVerified: true });
      setGstVerifying(false);
      toast({ title: 'GST number verified successfully!' });
    }, 2000);
  };

  const updateField = (field: keyof ProfileData, value: string | number | boolean) => {
    setProfile({ ...profile, [field]: value });
  };

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
                    src={profile.logo}
                    alt={profile.companyName}
                    className="w-24 h-24 rounded-lg object-cover border"
                  />
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
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
                GST Verification
              </CardTitle>
              <CardDescription>
                Verify your GST to build trust with buyers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  value={profile.gstNumber}
                  onChange={(e) => {
                    updateField('gstNumber', e.target.value.toUpperCase());
                    updateField('gstVerified', false);
                  }}
                  disabled={!isEditing || profile.gstVerified}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  className="mt-1 font-mono"
                />
              </div>

              {profile.gstVerified ? (
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg text-success">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">GST Verified</p>
                    <p className="text-xs opacity-80">Your GST number has been verified</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg text-warning">
                    <Clock className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Not Verified</p>
                      <p className="text-xs opacity-80">Verify to get the GST badge</p>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleVerifyGst}
                    disabled={gstVerifying || !profile.gstNumber}
                  >
                    {gstVerifying ? 'Verifying...' : 'Verify GST Number'}
                  </Button>
                </div>
              )}

              <Separator />

              <div>
                <Label htmlFor="pan">PAN Number</Label>
                <Input
                  id="pan"
                  value={profile.panNumber}
                  onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())}
                  disabled={!isEditing}
                  placeholder="AAAAA1234A"
                  maxLength={10}
                  className="mt-1 font-mono"
                />
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

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products Listed</span>
                  <span className="font-medium">245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-medium">4.8 ★</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">Jan 2020</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
