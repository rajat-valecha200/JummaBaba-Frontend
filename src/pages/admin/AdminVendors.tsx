import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { suppliers } from '@/data/mockData';
import { TrustBadge } from '@/components/b2b/TrustBadge';

type VendorStatus = 'pending' | 'approved' | 'rejected';

interface VendorWithStatus {
  id: string;
  companyName: string;
  logo: string;
  location: string;
  gstNumber: string;
  establishedYear: number;
  totalProducts: number;
  status: VendorStatus;
  submittedAt: string;
}

const mockVendors: VendorWithStatus[] = [
  ...suppliers.map((s, i) => ({
    id: s.id,
    companyName: s.companyName,
    logo: s.logo,
    location: s.location,
    gstNumber: `27AABCT${1234 + i}D1ZA`,
    establishedYear: s.yearEstablished,
    totalProducts: s.totalProducts,
    status: 'pending' as VendorStatus,
    submittedAt: new Date(Date.now() - i * 86400000).toISOString(),
  })),
  {
    id: 'v-approved-1',
    companyName: 'Verified Electronics Ltd',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    location: 'Bengaluru, Karnataka',
    gstNumber: '29AABCT5678D1ZB',
    establishedYear: 2015,
    totalProducts: 150,
    status: 'approved' as VendorStatus,
    submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'v-rejected-1',
    companyName: 'Quick Traders',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
    location: 'Hyderabad, Telangana',
    gstNumber: 'INVALID123',
    establishedYear: 2022,
    totalProducts: 0,
    status: 'rejected' as VendorStatus,
    submittedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export default function AdminVendors() {
  const [vendors, setVendors] = useState<VendorWithStatus[]>(mockVendors);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorWithStatus | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredVendors = vendors.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesSearch = v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = (vendorId: string) => {
    setVendors(vendors.map(v => v.id === vendorId ? { ...v, status: 'approved' as VendorStatus } : v));
    setDetailsOpen(false);
  };

  const handleReject = (vendorId: string) => {
    setVendors(vendors.map(v => v.id === vendorId ? { ...v, status: 'rejected' as VendorStatus } : v));
    setDetailsOpen(false);
  };

  const getStatusBadge = (status: VendorStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const pendingCount = vendors.filter(v => v.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendor Management</h1>
        <p className="text-muted-foreground">Review and approve vendor applications</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{vendors.filter(v => v.status === 'approved').length}</div>
            <p className="text-sm text-muted-foreground">Approved Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{vendors.filter(v => v.status === 'rejected').length}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              All Vendors
              {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pending</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Est. Year</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={vendor.logo} alt={vendor.companyName} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium">{vendor.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.location}</TableCell>
                  <TableCell className="font-mono text-sm">{vendor.gstNumber}</TableCell>
                  <TableCell>{vendor.establishedYear}</TableCell>
                  <TableCell>{vendor.totalProducts}</TableCell>
                  <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                  <TableCell>{new Date(vendor.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {vendor.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleReject(vendor.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-success hover:text-success" onClick={() => handleApprove(vendor.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredVendors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No vendors found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>Review vendor information before approval</DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={selectedVendor.logo} alt={selectedVendor.companyName} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h3 className="font-semibold text-lg">{selectedVendor.companyName}</h3>
                  <p className="text-muted-foreground">{selectedVendor.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">GST Number</p>
                  <p className="font-mono">{selectedVendor.gstNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Established</p>
                  <p>{selectedVendor.establishedYear}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Products Listed</p>
                  <p>{selectedVendor.totalProducts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedVendor.status)}
                </div>
              </div>

              <div className="flex gap-2">
                <TrustBadge type="gst" />
                <TrustBadge type="verified" />
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedVendor?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => handleReject(selectedVendor.id)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedVendor.id)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
