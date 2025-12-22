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
import { products, suppliers, formatPrice, getSupplierById } from '@/data/mockData';

type ProductStatus = 'pending' | 'approved' | 'rejected';

interface ProductWithStatus {
  id: string;
  name: string;
  image: string;
  category: string;
  supplierId: string;
  supplierName: string;
  minPrice: number;
  moq: number;
  status: ProductStatus;
  submittedAt: string;
}

const mockProducts: ProductWithStatus[] = products.map((p, i) => {
  const supplier = getSupplierById(p.supplierId);
  const statuses: ProductStatus[] = ['pending', 'pending', 'pending', 'approved', 'rejected'];
  return {
    id: p.id,
    name: p.name,
    image: p.images[0],
    category: p.categoryId,
    supplierId: p.supplierId,
    supplierName: supplier?.companyName || 'Unknown',
    minPrice: p.pricingSlabs[0].pricePerUnit,
    moq: p.moq,
    status: statuses[i % statuses.length],
    submittedAt: new Date(Date.now() - i * 43200000).toISOString(),
  };
});

export default function AdminProducts() {
  const [productList, setProductList] = useState<ProductWithStatus[]>(mockProducts);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStatus | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredProducts = productList.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = (productId: string) => {
    setProductList(productList.map(p => p.id === productId ? { ...p, status: 'approved' as ProductStatus } : p));
    setDetailsOpen(false);
  };

  const handleReject = (productId: string) => {
    setProductList(productList.map(p => p.id === productId ? { ...p, status: 'rejected' as ProductStatus } : p));
    setDetailsOpen(false);
  };

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const pendingCount = productList.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Product Moderation</h1>
        <p className="text-muted-foreground">Review and approve product listings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{productList.filter(p => p.status === 'approved').length}</div>
            <p className="text-sm text-muted-foreground">Approved Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{productList.filter(p => p.status === 'rejected').length}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              All Products
              {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pending</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
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
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{product.supplierName}</TableCell>
                  <TableCell>{formatPrice(product.minPrice)}</TableCell>
                  <TableCell>{product.moq} units</TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>{new Date(product.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedProduct(product);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {product.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleReject(product.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-success hover:text-success" onClick={() => handleApprove(product.id)}>
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

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Review product information before approval</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-24 h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                  <Badge variant="outline" className="mt-1">{selectedProduct.category}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{selectedProduct.supplierName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base Price</p>
                  <p className="font-medium">{formatPrice(selectedProduct.minPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MOQ</p>
                  <p>{selectedProduct.moq} units</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedProduct.status)}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Submitted</p>
                <p>{new Date(selectedProduct.submittedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedProduct?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => handleReject(selectedProduct.id)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedProduct.id)}>
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
