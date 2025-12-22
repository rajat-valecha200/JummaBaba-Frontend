import { useState } from 'react';
import { Save, Plus, Pencil, Trash2, MapPin, Building, Phone, Mail, CheckCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

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
  gstNumber: string;
  panNumber: string;
}

const initialProfile: ProfileData = {
  name: 'Amit Patel',
  email: 'amit@techretail.com',
  phone: '+91 98765 43210',
  companyName: 'Tech Retail Solutions Pvt Ltd',
  gstNumber: '27AABCT5678D1ZB',
  panNumber: 'AABCT5678D',
};

const initialAddresses: Address[] = [
  {
    id: 'addr-1',
    label: 'Head Office',
    name: 'Amit Patel',
    phone: '+91 98765 43210',
    address: '123 Tech Park, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400069',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Warehouse',
    name: 'Warehouse Manager',
    phone: '+91 87654 32109',
    address: '456 Industrial Area, Bhiwandi',
    city: 'Thane',
    state: 'Maharashtra',
    pincode: '421302',
    isDefault: false,
  },
];

const emptyAddress: Omit<Address, 'id'> = {
  label: '',
  name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
};

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
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>(emptyAddress);

  const handleSaveProfile = () => {
    toast({ title: 'Profile updated successfully!' });
    setIsEditingProfile(false);
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setAddressDialogOpen(true);
  };

  const handleOpenEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = () => {
    if (!addressForm.label || !addressForm.name || !addressForm.address || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (editingAddress) {
      setAddresses(addresses.map(a => {
        if (a.id === editingAddress.id) {
          return { ...a, ...addressForm };
        }
        if (addressForm.isDefault && a.id !== editingAddress.id) {
          return { ...a, isDefault: false };
        }
        return a;
      }));
      toast({ title: 'Address updated successfully!' });
    } else {
      const newAddress: Address = {
        id: `addr-${Date.now()}`,
        ...addressForm,
      };
      if (addressForm.isDefault) {
        setAddresses([newAddress, ...addresses.map(a => ({ ...a, isDefault: false }))]);
      } else {
        setAddresses([...addresses, newAddress]);
      }
      toast({ title: 'Address added successfully!' });
    }
    setAddressDialogOpen(false);
  };

  const handleDeleteAddress = () => {
    if (deleteAddressId) {
      setAddresses(addresses.filter(a => a.id !== deleteAddressId));
      toast({ title: 'Address deleted' });
      setDeleteDialogOpen(false);
      setDeleteAddressId(null);
    }
  };

  const handleSetDefault = (addressId: string) => {
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    })));
    toast({ title: 'Default address updated' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and delivery addresses</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your personal and company details</CardDescription>
              </div>
              {isEditingProfile ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditingProfile}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    disabled={!isEditingProfile}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled={!isEditingProfile}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditingProfile}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gst">GST Number (for invoices)</Label>
                  <Input
                    id="gst"
                    value={profile.gstNumber}
                    onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value.toUpperCase() })}
                    disabled={!isEditingProfile}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    value={profile.panNumber}
                    onChange={(e) => setProfile({ ...profile, panNumber: e.target.value.toUpperCase() })}
                    disabled={!isEditingProfile}
                    placeholder="AAAAA1234A"
                    maxLength={10}
                    className="mt-1 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saved Addresses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Saved Addresses
                </CardTitle>
                <CardDescription>Manage your delivery addresses</CardDescription>
              </div>
              <Button size="sm" onClick={handleOpenAddAddress}>
                <Plus className="h-4 w-4 mr-1" />
                Add Address
              </Button>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No addresses saved yet</p>
                  <Button variant="outline" className="mt-4" onClick={handleOpenAddAddress}>
                    Add Your First Address
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`relative p-4 rounded-lg border ${address.isDefault ? 'border-primary bg-primary/5' : 'bg-muted/50'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{address.label}</span>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenEditAddress(address)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeleteAddressId(address.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="font-medium">{address.name}</p>
                        <p className="text-muted-foreground">{address.address}</p>
                        <p className="text-muted-foreground">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-muted-foreground">{address.phone}</p>
                      </div>
                      {!address.isDefault && (
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2 h-auto p-0 text-primary"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          Set as default
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RFQs Sent</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saved Addresses</span>
                  <span className="font-medium">{addresses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">Mar 2023</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Completion</span>
                  <span className="font-medium text-success">90%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: '90%' }} />
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    Personal info complete
                  </li>
                  <li className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    GST details added
                  </li>
                  <li className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    Delivery address added
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    Email verified
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingAddress ? 'Update address details' : 'Add a new delivery address'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="addrLabel">Address Label *</Label>
              <Input
                id="addrLabel"
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                placeholder="e.g., Head Office, Warehouse"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addrName">Contact Name *</Label>
                <Input
                  id="addrName"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="addrPhone">Phone *</Label>
                <Input
                  id="addrPhone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="addrAddress">Street Address *</Label>
              <Textarea
                id="addrAddress"
                value={addressForm.address}
                onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addrCity">City *</Label>
                <Input
                  id="addrCity"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="addrState">State *</Label>
                <Select
                  value={addressForm.state}
                  onValueChange={(value) => setAddressForm({ ...addressForm, state: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="addrPincode">Pincode *</Label>
              <Input
                id="addrPincode"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                maxLength={6}
                className="mt-1 w-32"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={addressForm.isDefault}
                onCheckedChange={(checked) => setAddressForm({ ...addressForm, isDefault: checked as boolean })}
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                Set as default delivery address
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress}>
              {editingAddress ? 'Save Changes' : 'Add Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The address will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
