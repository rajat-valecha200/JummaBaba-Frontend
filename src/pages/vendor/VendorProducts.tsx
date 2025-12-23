import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { products, categories, formatPrice } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface PricingSlab {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
}

interface ProductFormData {
  id?: string;
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  moq: number;
  unit: string;
  pricingSlabs: PricingSlab[];
  images: string[];
  selectedSlabCount: number;
}

// Fixed quantity categories
const FIXED_QUANTITY_SLABS = [
  { minQty: 1, maxQty: 500, label: '1 – 500' },
  { minQty: 501, maxQty: 1000, label: '501 – 1000' },
  { minQty: 1001, maxQty: 5000, label: '1001 – 5000' },
  { minQty: 5001, maxQty: 20000, label: '5001 – 20000' },
];

const emptyProduct: ProductFormData = {
  name: '',
  shortDescription: '',
  description: '',
  categoryId: '',
  moq: 1,
  unit: 'pieces',
  pricingSlabs: [
    { minQty: 1, maxQty: 500, pricePerUnit: 0 },
    { minQty: 501, maxQty: 1000, pricePerUnit: 0 },
  ],
  images: [],
  selectedSlabCount: 2,
};

const vendorProducts = products.slice(0, 6).map(p => ({
  ...p,
  status: ['active', 'active', 'pending', 'active', 'draft', 'active'][Math.floor(Math.random() * 6)] as 'active' | 'pending' | 'draft',
}));

export default function VendorProducts() {
  const { toast } = useToast();
  const [productList, setProductList] = useState(vendorProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);

  const filteredProducts = productList.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setFormOpen(true);
  };

  const handleOpenEdit = (product: typeof vendorProducts[0]) => {
    const slabCount = Math.min(4, Math.max(2, product.pricingSlabs.length));
    setEditingProduct({
      id: product.id,
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryId: product.categoryId,
      moq: product.moq,
      unit: product.unit,
      pricingSlabs: product.pricingSlabs,
      images: product.images,
      selectedSlabCount: slabCount,
    });
    setFormData({
      id: product.id,
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryId: product.categoryId,
      moq: product.moq,
      unit: product.unit,
      pricingSlabs: product.pricingSlabs,
      images: product.images,
      selectedSlabCount: slabCount,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.categoryId) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    if (editingProduct?.id) {
      setProductList(productList.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...formData, pricingSlabs: formData.pricingSlabs }
          : p
      ));
      toast({ title: 'Product updated successfully' });
    } else {
      const newProduct = {
        id: `prod-new-${Date.now()}`,
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        shortDescription: formData.shortDescription,
        description: formData.description,
        categoryId: formData.categoryId,
        subcategoryId: '',
        supplierId: 'sup-1',
        moq: formData.moq,
        unit: formData.unit,
        pricingSlabs: formData.pricingSlabs,
        images: formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
        specifications: {},
        isVerified: false,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
      };
      setProductList([newProduct, ...productList]);
      toast({ title: 'Product added successfully' });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setProductList(productList.filter(p => p.id !== deleteId));
      toast({ title: 'Product deleted' });
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const handleSlabCountChange = (count: number) => {
    const newSlabs = FIXED_QUANTITY_SLABS.slice(0, count).map((slab, index) => ({
      minQty: slab.minQty,
      maxQty: slab.maxQty,
      pricePerUnit: formData.pricingSlabs[index]?.pricePerUnit || 0,
    }));
    setFormData({
      ...formData,
      selectedSlabCount: count,
      pricingSlabs: newSlabs,
    });
  };

  const updateSlabPrice = (index: number, price: number) => {
    const updated = [...formData.pricingSlabs];
    updated[index] = { ...updated[index], pricePerUnit: price };
    setFormData({ ...formData, pricingSlabs: updated });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{productList.length}</div>
            <p className="text-sm text-muted-foreground">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{productList.filter(p => p.status === 'active').length}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{productList.filter(p => p.status === 'pending').length}</div>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Your Products</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.categoryId);
                const minPrice = Math.min(...product.pricingSlabs.map(s => s.pricePerUnit));
                const maxPrice = Math.max(...product.pricingSlabs.map(s => s.pricePerUnit));
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{product.shortDescription}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{category?.name || 'Uncategorized'}</Badge>
                    </TableCell>
                    <TableCell>{product.moq} {product.unit}</TableCell>
                    <TableCell>
                      {minPrice === maxPrice 
                        ? formatPrice(minPrice)
                        : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setDeleteId(product.id); setDeleteOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenAdd}>
                Add Your First Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update your product details' : 'Fill in the details to list a new product'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Cotton Fabric Roll"
                />
              </div>

              <div>
                <Label htmlFor="shortDesc">Short Description</Label>
                <Input
                  id="shortDesc"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Brief product highlight"
                />
              </div>

              <div>
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="sets">Sets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>

            {/* Pricing Slabs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Pricing Slabs (2-4)</Label>
                <Select
                  value={formData.selectedSlabCount.toString()}
                  onValueChange={(value) => handleSlabCountChange(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Slabs</SelectItem>
                    <SelectItem value="3">3 Slabs</SelectItem>
                    <SelectItem value="4">4 Slabs</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how many quantity-based price tiers to offer
                </p>
              </div>
              
              <div className="space-y-3">
                <Label>Set Prices for Each Quantity Range</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Quantity Range</TableHead>
                        <TableHead className="font-semibold">Price per {formData.unit} (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.pricingSlabs.map((slab, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {FIXED_QUANTITY_SLABS[index]?.label || `${slab.minQty} - ${slab.maxQty}`}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={slab.pricePerUnit || ''}
                              onChange={(e) => updateSlabPrice(index, parseFloat(e.target.value) || 0)}
                              placeholder="Enter price"
                              min={0}
                              className="w-32"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Offer better prices for higher quantities to encourage bulk orders
                </p>
              </div>
            </div>

            {/* Image Upload Placeholder */}
            <div className="space-y-3">
              <Label>Product Images</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop images here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 5MB (Max 5 images)
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Choose Files
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {formData.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed from your listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
