import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Package, 
  Eye, 
  AlertCircle, 
  Info, 
  Loader2, 
  Image as ImageIcon,
  Tag,
  CreditCard,
  X,
  ExternalLink,
  LayoutGrid,
  FileText,
  MessageSquare,
  ArrowRight,
  MoreVertical,
  Truck
} from 'lucide-react';
import { ProductPreviewDialog } from '@/components/admin/ProductPreviewDialog';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProductCard } from '@/components/b2b/ProductCard';
import { formatPrice, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api, normalizeProduct } from '@/lib/api';

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
  hasSample: boolean;
  samplePrice: number;
  sampleMOQ: number;
  specifications: Record<string, string>;
  logistics: string;
}

// Default slab templates
const DEFAULT_SLAB_TEMPLATES = [
  { minQty: 1, maxQty: 100 },
  { minQty: 101, maxQty: 500 },
  { minQty: 501, maxQty: 1000 },
  { minQty: 1001, maxQty: null },
];

const emptyProduct: ProductFormData = {
  name: '',
  shortDescription: '',
  description: '',
  categoryId: '',
  moq: 1,
  unit: 'pieces',
  pricingSlabs: [
    { minQty: 1, maxQty: 100, pricePerUnit: 0 },
    { minQty: 101, maxQty: 500, pricePerUnit: 0 },
    { minQty: 501, maxQty: 1000, pricePerUnit: 0 },
    { minQty: 1001, maxQty: null, pricePerUnit: 0 },
  ],
  images: [],
  selectedSlabCount: 4,
  hasSample: false,
  samplePrice: 0,
  sampleMOQ: 1,
  specifications: {
    'Material': '',
    'Weight': '',
    'Dimensions': '',
    'Origin': ''
  },
  logistics: '',
};

// Extended product status to include 'rejected'
type ProductStatus = 'active' | 'pending' | 'draft' | 'rejected' | 'approved';

export default function VendorProducts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const [productList, setProductList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewProduct, setPreviewProduct] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        setCategories(await api.categories.list());
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchDependencies();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add' && user?.status === 'approved') {
      handleOpenAdd();
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, user?.status]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await api.products.list(undefined, user.id);
        setProductList(data.map(normalizeProduct));
      } catch (error) {
        console.error('Failed to fetch vendor products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user]);

  const filteredProducts = productList.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setImageFiles([]);
    setCurrentStep(1);
    setFormOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    const slabCount = Math.min(4, Math.max(2, product.pricingSlabs.length));
    const data = {
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
      hasSample: product.hasSample || product.has_sample || false,
      samplePrice: product.samplePrice || product.sample_price || 0,
      sampleMOQ: product.sampleMOQ || product.sample_moq || 1,
      specifications: product.specifications || {},
      logistics: product.logistics || '',
    };
    setEditingProduct(data);
    setFormData(data);
    setImageFiles([]);
    setCurrentStep(1);
    setFormOpen(true);
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(newFiles);
    
    const previewUrls = newFiles.map(file => URL.createObjectURL(file));
    setFormData({
      ...formData,
      images: [...(editingProduct?.images || []), ...previewUrls].slice(0, 5)
    });
  };

  const removeImage = (index: number) => {
    const imageUrl = formData.images[index];
    
    if (imageUrl.startsWith('blob:')) {
      const existingCount = editingProduct?.images?.length || 0;
      if (index >= existingCount) {
        const fileIndex = index - existingCount;
        const newFiles = [...imageFiles];
        newFiles.splice(fileIndex, 1);
        setImageFiles(newFiles);
      }
    }
    
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSlabCountChange = (count: number) => {
    const newSlabs = DEFAULT_SLAB_TEMPLATES.slice(0, count).map((slab, index) => ({
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

  const updateSlabField = (index: number, field: keyof PricingSlab, value: any) => {
    const updated = [...formData.pricingSlabs];
    updated[index] = { ...updated[index], [field]: value };
    
    // Logic: If updating maxQty, suggest next tier's minQty as maxQty + 1
    if (field === 'maxQty' && value !== null && index < updated.length - 1) {
      if (typeof value === 'number' && !isNaN(value)) {
        updated[index + 1] = { ...updated[index + 1], minQty: value + 1 };
      }
    }

    if (index === 0 && field === 'minQty') {
       setFormData({ ...formData, pricingSlabs: updated, moq: typeof value === 'number' ? value : 0 });
    } else {
       setFormData({ ...formData, pricingSlabs: updated });
    }
  };

  const setAsCover = (index: number) => {
    const newImages = [...formData.images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    
    const newFiles = [...imageFiles];
    if (newFiles.length > 0) {
      const [selectedFile] = newFiles.splice(index, 1);
      newFiles.unshift(selectedFile);
      setImageFiles(newFiles);
    }

    setFormData({ ...formData, images: newImages });
  };

  const handleNumberInput = (value: string, allowFloat: boolean = false) => {
    let cleaned = value.replace(/[^0-9.]/g, '');
    if (allowFloat) {
      const parts = cleaned.split('.');
      if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
      if (parts[1] && parts[1].length > 2) {
        cleaned = parts[0] + '.' + parts[1].substring(0, 2);
      }
    } else {
      cleaned = cleaned.replace(/\./g, '');
    }
    return cleaned;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.categoryId) {
      toast({ title: 'Please fill required fields', description: 'Product Name and Category are required', variant: 'destructive' });
      return;
    }

    if (formData.moq < 1) {
      toast({ title: 'Invalid MOQ', description: 'Minimum Order Quantity must be at least 1', variant: 'destructive' });
      return;
    }

    const invalidSlab = formData.pricingSlabs.find((s, index) => {
      const basicInvalid = s.pricePerUnit <= 0 || s.minQty < 1;
      const quantityInvalid = s.maxQty !== null && s.maxQty <= s.minQty;
      const sequenceInvalid = index > 0 && s.minQty <= (formData.pricingSlabs[index-1].maxQty || 0);
      const priceInvalid = index > 0 && s.pricePerUnit >= formData.pricingSlabs[index-1].pricePerUnit;
      
      return basicInvalid || quantityInvalid || sequenceInvalid || priceInvalid;
    });

    if (invalidSlab) {
      toast({ 
        title: 'Pricing Strategy Error', 
        description: 'Please fix the highlighted errors in your pricing tiers. Quantities must be sequential and prices must decrease for higher volumes.', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      const productPayload: any = {
        name: formData.name,
        slug: `${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${editingProduct?.id?.slice(0, 8) || Date.now()}`,
        short_description: formData.shortDescription,
        description: formData.description,
        category_id: formData.categoryId,
        moq: formData.moq,
        unit: formData.unit,
        pricing_slabs: formData.pricingSlabs,
        has_sample: formData.hasSample,
        sample_price: formData.samplePrice,
        sample_moq: formData.sampleMOQ,
        specifications: formData.specifications,
        logistics: formData.logistics,
      };

      if (editingProduct?.id) {
        const existingImages = formData.images
          .filter(img => img.includes('/storage/'))
          .map(img => img.substring(img.indexOf('/storage/')));
        productPayload.existing_images = existingImages;
      }

      const multipart = new FormData();
      Object.entries(productPayload).forEach(([key, value]) => {
        multipart.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
      imageFiles.forEach((file) => multipart.append('images', file));

      let result;
      if (editingProduct?.id) {
        result = await api.products.updateForm(editingProduct.id, multipart);
        toast({ title: 'Product updated successfully' });
      } else {
        result = await api.products.createForm(multipart);
        toast({ title: 'Product created and submitted for review' });
      }

      const updatedProduct = normalizeProduct(result);

      if (editingProduct?.id) {
        setProductList(productList.map(p => p.id === editingProduct.id ? updatedProduct : p));
      } else {
        setProductList([updatedProduct, ...productList]);
      }
      setImageFiles([]);
      setFormOpen(false);
    } catch (error: any) {
      toast({ 
        title: editingProduct?.id ? 'Update Failed' : 'Creation Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      api.products.remove(deleteId)
        .then(() => {
          setProductList(productList.filter(p => p.id !== deleteId));
          toast({ title: 'Product deleted' });
          setDeleteOpen(false);
          setDeleteId(null);
        })
        .catch((error: any) => {
          toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        });
    }
  };

  const getStatusBadge = (status: ProductStatus, rejectionReason?: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return (
          <div className="flex flex-col gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="cursor-help w-fit">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Rejection Reason:</p>
                <p className="text-sm">{rejectionReason || 'No reason provided'}</p>
              </TooltipContent>
            </Tooltip>
            {rejectionReason && (
              <p className="text-[10px] font-bold text-destructive/70 italic max-w-[150px] leading-tight pl-1 border-l-2 border-destructive/20">
                {rejectionReason}
              </p>
            )}
          </div>
        );
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Product Studio</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Manage your global inventory</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {user?.status !== 'approved' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full md:w-auto">
                  <Button disabled className="w-full md:w-auto h-12 px-8 rounded-xl opacity-50 font-black uppercase text-[10px] tracking-widest bg-slate-200 text-slate-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Locked
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl border-slate-200">
                <p className="text-[10px] font-bold">Account verification in progress</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button 
              onClick={handleOpenAdd}
              className="w-full md:w-auto h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          )}
        </div>
      </div>

      {user?.status !== 'approved' && (
        <Alert className={cn(
          "border-2",
          user?.status === 'rejected' ? "bg-destructive/5 border-destructive/20" : "bg-amber-50 border-amber-200"
        )}>
          {user?.status === 'rejected' ? <ShieldAlert className="h-5 w-5 text-destructive" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
          <div className="flex flex-col gap-1 ml-2">
            <CardTitle className={cn(
              "text-base font-black uppercase tracking-tight",
              user?.status === 'rejected' ? "text-destructive" : "text-amber-800"
            )}>
              {user?.status === 'rejected' ? "Account Registration Rejected" : "Account Approval Required"}
            </CardTitle>
            <AlertDescription className={cn(
              "text-sm font-medium",
              user?.status === 'rejected' ? "text-destructive/80" : "text-amber-700"
            )}>
              {user?.status === 'rejected' ? (
                <>
                  Your vendor profile was not approved for the following reason:
                  <div className="mt-3 p-4 bg-white/80 border border-destructive/10 rounded-2xl text-sm font-bold italic">
                    "{user?.rejectionReason || 'Incomplete documentation or invalid details.'}"
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest opacity-70">
                    Please update your business profile to re-submit for moderation.
                  </p>
                </>
              ) : (
                "Your vendor profile is currently under moderation. You will be able to upload products once your account has been verified and approved by the JummaBaba team."
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Products', value: productList.length, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Active', value: productList.filter(p => p.status === 'active').length, color: 'text-success', bg: 'bg-success/5' },
          { label: 'Pending', value: productList.filter(p => p.status === 'pending').length, color: 'text-warning', bg: 'bg-warning/5' },
          { label: 'Rejected', value: productList.filter(p => p.status === 'rejected').length, color: 'text-destructive', bg: 'bg-destructive/5' }
        ].map((stat, i) => (
          <Card key={i} className={cn("border-slate-200/60 shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md", stat.bg)}>
            <CardContent className="p-4 sm:p-6 space-y-1">
              <div className={cn("text-xl sm:text-2xl font-black", stat.color)}>{stat.value}</div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500/80">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-xl shadow-slate-200/20 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-6 sm:p-8 border-b border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-primary rounded-full" />
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Inventory Catalog</CardTitle>
            </div>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 text-sm font-bold placeholder:text-slate-400 w-full shadow-inner focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block w-full overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="w-[320px] font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 pl-10">Product Details</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6">Category</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6">Bulk MOQ</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6">Pricing Slab</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-6">Status</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-500 py-6 pr-10">Control</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const category = categories.find(c => c.id === product.categoryId);
                    const minPrice = Math.min(...product.pricingSlabs.map(s => s.pricePerUnit));
                    const maxPrice = Math.max(...product.pricingSlabs.map(s => s.pricePerUnit));
                    return (
                      <TableRow key={product.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className="pl-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="relative w-14 h-14 shrink-0">
                              <img src={product.images[0]} alt={product.name} className="w-full h-full rounded-2xl object-cover shadow-md border-2 border-white" />
                              {product.images.length > 1 && (
                                <div className="absolute -bottom-1 -right-1 bg-primary text-white shadow-lg rounded-lg px-1.5 py-0.5 border-2 border-white text-[9px] font-black">+{product.images.length - 1}</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-black text-slate-900 truncate text-base leading-none mb-1.5">{product.name}</p>
                              <p className="text-[11px] font-bold text-slate-400 truncate tracking-tight">{product.shortDescription}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg font-black text-[10px] uppercase tracking-wider border-slate-200 text-slate-600 bg-slate-50/80 px-3 py-1">
                            {category?.name || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-slate-700 text-sm">
                          <span className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">{product.moq} {product.unit}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-base">{formatPrice(minPrice)}</span>
                            {minPrice !== maxPrice && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">up to {formatPrice(maxPrice)}</span>}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(product.status, product.rejectionReason)}</TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => setPreviewProduct(product)} 
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {product.status === 'rejected' ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" disabled className="h-10 w-10 opacity-30">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Admin Review Required</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(product)} className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
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
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.categoryId);
              const minPrice = Math.min(...product.pricingSlabs.map(s => s.pricePerUnit));
              return (
                <div key={product.id} className="p-5 space-y-4 active:bg-slate-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="relative w-16 h-16 shrink-0">
                      <img src={product.images[0]} alt={product.name} className="w-full h-full rounded-xl object-cover shadow-sm" />
                      {product.images.length > 1 && (
                        <div className="absolute -top-1 -right-1 bg-primary text-white rounded-md px-1 py-0.5 text-[8px] font-black">+{product.images.length - 1}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-black text-slate-900 truncate text-sm leading-tight">{product.name}</p>
                        {getStatusBadge(product.status, product.rejectionReason)}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-wider mb-2">
                        {category?.name || 'Uncategorized'} • {product.moq} {product.unit}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-primary text-base">{formatPrice(minPrice)}</span>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setPreviewProduct(product)} className="h-8 w-8 rounded-lg">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(product)} disabled={product.status === 'rejected'} className="h-8 w-8 rounded-lg">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => { setDeleteId(product.id); setDeleteOpen(true); }} className="h-8 w-8 rounded-lg text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {product.status === 'rejected' && product.rejectionReason && (
                    <div className="bg-destructive/5 p-3 rounded-xl border border-destructive/10 flex gap-2 items-start">
                      <AlertCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                      <p className="text-[10px] font-bold text-destructive leading-normal">
                        Feedback: {product.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
              {user?.status === 'approved' ? (
                <Button variant="outline" className="mt-4" onClick={handleOpenAdd}>
                  Add Your First Product
                </Button>
              ) : (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  Verification pending. Listing will be enabled after approval.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(open) => {
        if (!open) setCurrentStep(1);
        setFormOpen(open);
      }}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] sm:h-[95vh] max-sm:h-[98vh] max-sm:w-full max-sm:max-w-none max-sm:bottom-0 max-sm:top-auto max-sm:translate-y-0 max-sm:rounded-t-[2.5rem] max-sm:rounded-b-none overflow-hidden p-0 gap-0 flex flex-col rounded-3xl border-none shadow-2xl transition-all duration-500">
          <DialogHeader className="p-4 sm:p-6 border-b sticky top-0 bg-background z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
                    {editingProduct ? 'Edit' : 'New'}
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0 h-4 sm:h-5 bg-muted/50 border-primary/20 text-primary">Step {currentStep}/4</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[10px] sm:text-sm font-bold text-slate-500 mt-0.5 sm:mt-1 line-clamp-1">
                    {currentStep === 1 && "Start with product basics."}
                    {currentStep === 2 && "Technical specs & details."}
                    {currentStep === 3 && "Add visuals and samples."}
                    {currentStep === 4 && "Wholesale pricing strategy."}
                  </DialogDescription>
                </div>
              </div>

              {/* Stepper Component - Hidden on very small screens, compact on mobile */}
              <div className="hidden lg:flex items-center gap-10">
                {[
                  { step: 1, label: 'Identity', icon: Tag },
                  { step: 2, label: 'Technical Details', icon: FileText },
                  { step: 3, label: 'Media & Samples', icon: ImageIcon },
                  { step: 4, label: 'Wholesale Strategy', icon: CreditCard }
                ].map((s, idx) => (
                  <div key={s.step} className="flex items-center gap-3 group">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                      currentStep >= s.step 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {currentStep > s.step ? "✓" : s.step}
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
                      currentStep >= s.step ? "text-primary" : "text-slate-400"
                    )}>
                      {s.label}
                    </span>
                    {idx < 3 && (
                      <div className={cn(
                        "w-12 h-[2px] ml-4 rounded-full transition-colors",
                        currentStep > s.step ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                ))}
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setFormOpen(false)}
                className="rounded-full hover:bg-muted transition-colors ml-2 sm:ml-4 shrink-0"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-[#fafafa]/50 pb-20 sm:pb-0">
            <div className="p-5 sm:p-8 lg:p-16 space-y-8 sm:space-y-12 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 animate-in zoom-in-95 duration-300">
                  <div className="lg:col-span-3 space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-[3px] bg-primary rounded-full" />
                        Core Identity
                      </h3>
                      <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_15px_40px_rgb(0,0,0,0.04)] space-y-8">
                        <div className="grid gap-3">
                          <Label className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Product Title *</Label>
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g. Premium Cotton Men's T-Shirt"
                              className="h-14 px-6 rounded-2xl bg-white border border-slate-300 text-slate-900 text-base font-bold focus-visible:ring-primary/20 shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                            />
                        </div>

                        <div className="grid gap-3">
                          <Label className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Headline Description *</Label>
                            <Input
                              value={formData.shortDescription}
                              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                              placeholder="A catchphrase for your product (max 100 characters)"
                              className="h-14 px-6 rounded-2xl bg-white border border-slate-300 text-slate-900 text-base font-bold focus-visible:ring-primary/20 shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                            />
                        </div>

                        <div className="grid gap-3">
                          <Label className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Detailed Specifications</Label>
                          <RichTextEditor 
                            value={formData.description}
                            onChange={(val) => setFormData({ ...formData, description: val })}
                            placeholder="Describe features, quality standards, and technical details in depth..."
                            className="min-h-[300px]"
                          />
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="lg:col-span-2 space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-[3px] bg-primary rounded-full" />
                        Classification
                      </h3>
                      <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_15px_40px_rgb(0,0,0,0.04)] space-y-8">
                        <div className="grid gap-3">
                          <Label className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Market Category *</Label>
                          <Select
                            value={formData.categoryId}
                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                          >
                            <SelectTrigger className="h-14 px-6 rounded-2xl bg-white border border-slate-300 text-slate-900 text-base font-bold shadow-sm">
                              <SelectValue placeholder="Browse categories" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} className="rounded-lg font-bold py-3">{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-3">
                          <Label className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Trading Unit</Label>
                          <Select
                            value={formData.unit}
                            onValueChange={(value) => setFormData({ ...formData, unit: value })}
                          >
                            <SelectTrigger className="h-14 px-6 rounded-2xl bg-white border border-slate-300 text-slate-900 text-base font-bold shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                              <SelectItem value="pieces" className="rounded-lg font-bold py-3">Pieces</SelectItem>
                              <SelectItem value="kg" className="rounded-lg font-bold py-3">Kilograms</SelectItem>
                              <SelectItem value="meters" className="rounded-lg font-bold py-3">Meters</SelectItem>
                              <SelectItem value="liters" className="rounded-lg font-bold py-3">Liters</SelectItem>
                              <SelectItem value="boxes" className="rounded-lg font-bold py-3">Boxes</SelectItem>
                              <SelectItem value="sets" className="rounded-lg font-bold py-3">Sets</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 animate-in zoom-in-95 duration-300">
                  <div className="lg:col-span-3 space-y-10">
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                          <div className="w-8 h-[3px] bg-primary rounded-full" />
                          Technical Specifications
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            const currentSpecs = formData.specifications || {};
                            const newSpecs = { ...currentSpecs, '': '' };
                            setFormData({ ...formData, specifications: newSpecs });
                          }}
                          className="h-8 rounded-lg text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Add Row
                        </Button>
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_15px_40px_rgb(0,0,0,0.04)] space-y-4">
                        {Object.entries(formData.specifications || {}).map(([key, value], idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-4 items-center animate-in slide-in-from-left-4 duration-300">
                            <div className="col-span-5">
                              <Input 
                                placeholder="e.g. Material" 
                                value={key}
                                onChange={(e) => {
                                  const newSpecs = { ...(formData.specifications || {}) };
                                  const oldVal = newSpecs[key];
                                  delete newSpecs[key];
                                  newSpecs[e.target.value] = oldVal;
                                  setFormData({ ...formData, specifications: newSpecs });
                                }}
                                className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs"
                              />
                            </div>
                            <div className="col-span-6">
                              <Input 
                                placeholder="e.g. 100% Cotton" 
                                value={value}
                                onChange={(e) => {
                                  const newSpecs = { ...(formData.specifications || {}) };
                                  newSpecs[key] = e.target.value;
                                  setFormData({ ...formData, specifications: newSpecs });
                                }}
                                className="h-12 rounded-xl bg-white border-slate-200 font-bold text-xs"
                              />
                            </div>
                            <div className="col-span-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  const newSpecs = { ...(formData.specifications || {}) };
                                  delete newSpecs[key];
                                  setFormData({ ...formData, specifications: newSpecs });
                                }}
                                className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/5"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {Object.keys(formData.specifications || {}).length === 0 && (
                          <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                            <p className="text-xs font-bold text-slate-400">No specifications added yet.</p>
                          </div>
                        )}
                      </div>
                    </section>


                  </div>

                  <div className="lg:col-span-2 space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-[3px] bg-primary rounded-full" />
                        Logistics & Shipping
                      </h3>
                      <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_15px_40px_rgb(0,0,0,0.04)] space-y-6">
                        <div className="grid gap-3">
                          <Label className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Global Logistics Info</Label>
                          <textarea 
                            value={formData.logistics}
                            onChange={(e) => setFormData({ ...formData, logistics: e.target.value })}
                            placeholder="e.g. FOB Shanghai, Lead time 15 days, Standard seaworthy packaging..."
                            className="w-full min-h-[150px] p-6 rounded-3xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm font-medium leading-relaxed resize-none placeholder:text-slate-400"
                          />
                        </div>
                        <div className="p-4 rounded-2xl bg-success/5 border border-success/10 flex items-start gap-3">
                          <Truck className="h-4 w-4 text-success mt-0.5" />
                          <p className="text-[10px] text-success font-bold leading-tight">Accurate logistics info helps buyers calculate their landed cost quickly.</p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 animate-in zoom-in-95 duration-300">
                  <div className="lg:col-span-3 space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-[3px] bg-primary rounded-full" />
                        Visual Showcase
                      </h3>
                      <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_15px_40px_rgb(0,0,0,0.04)] space-y-8">
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                          {formData.images.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-primary/5 shadow-sm">
                              <img src={img} alt="Product" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                                {idx !== 0 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setAsCover(idx)}
                                    className="h-8 rounded-lg bg-white/20 hover:bg-white/40 text-white text-[9px] font-black uppercase tracking-widest"
                                  >
                                    Set as Cover
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeImage(idx)}
                                  className="h-8 w-8 rounded-full bg-destructive/20 hover:bg-destructive/40 text-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {idx === 0 && (
                                <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-lg z-10">Cover Photo</div>
                              )}
                            </div>
                          ))}
                          {formData.images.length < 5 && (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square rounded-2xl border-3 border-dashed border-primary/10 bg-primary/5 flex flex-col items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all group"
                            >
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Plus className="h-5 w-5 text-primary" />
                              </div>
                              <span className="text-[10px] font-black text-primary/40 uppercase mt-3 tracking-widest">Add Media</span>
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                multiple 
                                accept="image/*" 
                                onChange={handleImageSelection} 
                              />
                            </button>
                          )}
                        </div>
                        <div className="bg-primary/5 p-4 rounded-2xl flex items-start gap-3 border border-primary/10">
                          <Info className="h-4 w-4 text-primary mt-0.5" />
                          <p className="text-xs text-primary/80 font-medium">Upload up to 5 high-resolution images. The first image will be featured as the primary display in search results.</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="lg:col-span-2 space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-[3px] bg-primary rounded-full" />
                        Sample Protocol
                      </h3>
                      <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_15px_40px_rgb(0,0,0,0.04)] space-y-8">
                        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                          <div className="space-y-1">
                            <Label className="text-base font-black text-slate-900">Enable Sample Orders</Label>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Help buyers test quality before bulk orders</p>
                          </div>
                          <Button 
                            variant={formData.hasSample ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormData({ ...formData, hasSample: !formData.hasSample })}
                            className={cn(
                              "rounded-xl px-6 h-10 font-black text-[10px] uppercase transition-all shadow-sm",
                              formData.hasSample ? "bg-primary shadow-primary/20" : "border-slate-300 text-slate-700"
                            )}
                          >
                            {formData.hasSample ? 'Enabled ✓' : 'Disabled'}
                          </Button>
                        </div>

                        {formData.hasSample && (
                          <div className="grid grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="grid gap-3">
                              <Label className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Sample Price</Label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-black">₹</span>
                                <Input
                                  type="text"
                                  value={formData.samplePrice === 0 ? '' : formData.samplePrice.toString()}
                                  onChange={(e) => {
                                    const val = handleNumberInput(e.target.value, true);
                                    setFormData({ ...formData, samplePrice: val ? parseFloat(val) : 0 });
                                  }}
                                  className="h-14 pl-8 rounded-2xl bg-white border border-slate-300 text-base font-black text-primary shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div className="grid gap-3">
                              <Label className="text-[11px] font-black uppercase text-slate-700 tracking-widest">Sample MOQ</Label>
                              <Input
                                type="text"
                                value={formData.sampleMOQ === 0 ? '' : formData.sampleMOQ.toString()}
                                onChange={(e) => {
                                  const val = handleNumberInput(e.target.value);
                                  setFormData({ ...formData, sampleMOQ: val ? parseInt(val) : 0 });
                                }}
                                className="h-14 px-6 rounded-2xl bg-white border border-slate-300 text-base font-black text-slate-900 shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                                placeholder="1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-12 animate-in zoom-in-95 duration-300">
                  <section className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                          <div className="w-8 h-[3px] bg-primary rounded-full" />
                          Wholesale Strategy
                        </h3>
                        <p className="text-3xl font-black tracking-tight text-slate-900">Define your quantity-based price tiers</p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-[1.25rem] shadow-sm">
                        <span className="text-[10px] font-black uppercase px-3 text-slate-500 tracking-widest">Strategy Levels:</span>
                        {[2, 3, 4].map(num => (
                          <button
                            key={num}
                            onClick={() => handleSlabCountChange(num)}
                            className={cn(
                              "w-12 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                              formData.selectedSlabCount === num 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" 
                                : "hover:bg-slate-100 text-slate-500"
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {formData.pricingSlabs.map((slab, index) => {
                        const isDisplayValue = index === (formData.pricingSlabs.length - 1);
                        
                        return (
                          <div key={index} className={cn(
                            "p-8 rounded-[2.5rem] bg-white border transition-all relative overflow-hidden group",
                            isDisplayValue ? "border-primary ring-2 ring-primary/10 shadow-2xl shadow-primary/10" : "border-slate-200 shadow-[0_15px_40px_rgb(0,0,0,0.04)]"
                          )}>
                            {isDisplayValue && (
                              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-black px-4 py-1.5 rounded-bl-2xl shadow-sm z-10 uppercase tracking-widest">
                                Best Value
                              </div>
                            )}
                            
                            <div className={cn(
                              "absolute top-0 left-0 w-1.5 h-full transition-colors",
                              isDisplayValue ? "bg-primary" : "bg-muted group-hover:bg-primary/40"
                            )} />
                            
                            <div className="flex justify-between items-start mb-8">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Tier</span>
                                <span className="text-2xl font-black text-slate-900 leading-none">{index + 1}</span>
                              </div>
                              <Badge variant="secondary" className="text-[10px] h-6 px-3 uppercase bg-slate-100 border-none font-black tracking-widest text-slate-700">{slab.minQty}-{slab.maxQty || '∞'}</Badge>
                            </div>
                            
                            <div className="space-y-8">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Min Qty</Label>
                                  <Input
                                    type="text"
                                    value={slab.minQty === 0 ? '' : slab.minQty.toString()}
                                    onChange={(e) => {
                                      const val = handleNumberInput(e.target.value);
                                      updateSlabField(index, 'minQty', val ? parseInt(val) : 0);
                                    }}
                                    className={cn(
                                      "h-12 rounded-xl bg-white border font-black text-sm shadow-sm transition-all placeholder:text-slate-400 placeholder:font-medium",
                                      (index > 0 && slab.minQty <= (formData.pricingSlabs[index-1].maxQty || 0)) 
                                        ? "border-destructive ring-1 ring-destructive/20 text-destructive" 
                                        : "border-slate-300 text-slate-900"
                                    )}
                                    placeholder="0"
                                  />
                                  {index > 0 && slab.minQty <= (formData.pricingSlabs[index-1].maxQty || 0) && (
                                    <p className="text-[8px] text-destructive font-bold uppercase">Must be &gt; {formData.pricingSlabs[index-1].maxQty}</p>
                                  )}
                                </div>
                                <div className="grid gap-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Max Qty</Label>
                                  <Input
                                    type="text"
                                    value={slab.maxQty === null ? '' : slab.maxQty.toString()}
                                    onChange={(e) => {
                                      const val = handleNumberInput(e.target.value);
                                      updateSlabField(index, 'maxQty', val ? parseInt(val) : null);
                                    }}
                                    placeholder="∞"
                                    className={cn(
                                      "h-12 rounded-xl bg-white border font-black text-sm shadow-sm transition-all placeholder:text-slate-400 placeholder:font-medium",
                                      (slab.maxQty !== null && slab.maxQty <= slab.minQty)
                                        ? "border-destructive ring-1 ring-destructive/20 text-destructive"
                                        : "border-slate-300 text-slate-900"
                                    )}
                                  />
                                  {slab.maxQty !== null && slab.maxQty <= slab.minQty && (
                                    <p className="text-[8px] text-destructive font-bold uppercase">Must be &gt; {slab.minQty}</p>
                                  )}
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Price / {formData.unit}</Label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black">₹</span>
                                  <Input
                                    type="text"
                                    value={slab.pricePerUnit === 0 ? '' : slab.pricePerUnit.toString()}
                                    onChange={(e) => {
                                      const val = handleNumberInput(e.target.value, true);
                                      updateSlabField(index, 'pricePerUnit', val ? parseFloat(val) : 0);
                                    }}
                                    className={cn(
                                      "h-14 pl-8 rounded-2xl bg-white border font-black text-lg text-primary shadow-sm transition-all placeholder:text-slate-400 placeholder:font-medium",
                                      index > 0 && formData.pricingSlabs[index-1].pricePerUnit > 0 && slab.pricePerUnit >= formData.pricingSlabs[index-1].pricePerUnit
                                        ? "border-destructive ring-1 ring-destructive/20"
                                        : "border-slate-300"
                                    )}
                                    placeholder="0.00"
                                  />
                                </div>
                                {index > 0 && formData.pricingSlabs[index-1].pricePerUnit > 0 && slab.pricePerUnit >= formData.pricingSlabs[index-1].pricePerUnit && (
                                  <p className="text-[9px] text-destructive font-bold uppercase tracking-widest animate-pulse">Must be lower than Tier {index} price</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="bg-primary/5 p-6 rounded-[2.5rem] flex items-center justify-between border border-primary/10 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                          <Info className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-black text-primary uppercase tracking-wider">Dynamic MOQ Control</p>
                          <p className="text-xs text-primary/60 font-medium">The Minimum Order Quantity (MOQ) will automatically synchronize with your Tier 1 configuration.</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em] mb-1">Effective MOQ</p>
                        <p className="text-3xl font-black text-primary">{formData.pricingSlabs[0]?.minQty || 1} <span className="text-sm uppercase tracking-widest opacity-50">{formData.unit}</span></p>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-5 sm:p-8 border-t bg-white sticky bottom-0 z-50 flex-row sm:justify-between items-center shadow-[0_-10px_50px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="h-10 sm:h-14 px-4 sm:px-10 rounded-xl sm:rounded-2xl border-2 font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-muted transition-all"
                >
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto justify-end">
              <Button 
                variant="ghost" 
                onClick={() => setPreviewProduct(formData)} 
                className="h-10 sm:h-14 px-4 sm:px-8 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="ghost" onClick={() => setFormOpen(false)} className="hidden sm:flex h-14 rounded-2xl px-10 font-black text-xs uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                Draft
              </Button>
              
              {currentStep < 4 ? (
                <Button 
                  onClick={() => {
                    if (currentStep === 1 && (!formData.name || !formData.categoryId)) {
                      toast({ title: 'Validation Failed', description: 'Please enter a name and category to continue.', variant: 'destructive' });
                      return;
                    }
                    setCurrentStep(currentStep + 1);
                  }}
                  className="flex-1 sm:flex-none h-10 sm:h-14 rounded-xl sm:rounded-2xl px-6 sm:px-14 bg-primary hover:bg-primary/90 text-white font-black text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex-1 sm:flex-none h-10 sm:h-14 rounded-xl sm:rounded-2xl px-8 sm:px-16 bg-primary hover:bg-primary/90 text-white font-black text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" /> : null}
                  {editingProduct ? 'Update' : 'Publish'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Preview Dialog */}
      <ProductPreviewDialog
        product={previewProduct}
        open={!!previewProduct}
        onOpenChange={(open) => !open && setPreviewProduct(null)}
        categories={categories}
        supplier={{
          isTopSupplier: user?.isTopSupplier,
          companyName: user?.business_name || user?.full_name
        }}
      />
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
