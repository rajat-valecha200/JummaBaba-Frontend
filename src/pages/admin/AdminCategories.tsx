import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  LayoutGrid,
  AlertCircle,
  Loader2,
  ListTodo,
  // Added common icons for suggestions
  Cpu,
  Shirt,
  Factory,
  Wheat,
  Building,
  Sofa,
  Cog,
  Heart,
  Settings,
  Sprout,
  Construction,
  Home,
  Stethoscope,
  Truck,
  Box,
  HardHat,
  Microchip,
  Lightbulb,
  // Food Icons
  Utensils,
  Coffee,
  Leaf,
  Apple,
  Pizza,
  Zap,
  Wrench,
  Layers
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatNumber, cn } from '@/lib/utils';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: 'Package'
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await api.categories.list();
      setCategories(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.categories.create(formData);
      toast({ title: 'Success', description: 'Category created successfully' });
      setIsAddOpen(false);
      setFormData({ name: '', slug: '', icon: 'Package' });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.categories.update(editingCategory.id, formData);
      toast({ title: 'Success', description: 'Category updated successfully' });
      setIsEditOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, productCount: number) => {
    if (productCount > 0) {
      toast({
        title: 'Action Forbidden',
        description: `Cannot delete category with ${productCount} active products.`,
        variant: 'destructive'
      });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await api.categories.remove(id);
      toast({ title: 'Deleted', description: 'Category removed successfully' });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive'
      });
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const suggestedIcons = [
    { name: 'Construction', icon: Construction },
    { name: 'Electronics', icon: Cpu },
    { name: 'Industrial', icon: Factory },
    { name: 'Textiles', icon: Shirt },
    { name: 'Logistics', icon: Truck },
    { name: 'Packaging', icon: Box },
    { name: 'Machinery', icon: Cog },
    { name: 'Agriculture', icon: Wheat },
    { name: 'Safety', icon: HardHat },
    { name: 'Technology', icon: Microchip },
    { name: 'Innovation', icon: Lightbulb },
    { name: 'Medical', icon: Stethoscope },
    { name: 'Corporate', icon: Building },
    { name: 'Warehouse', icon: Home },
    { name: 'Tools', icon: Settings },
    { name: 'Chemical', icon: Sprout }, // Using sprout as placeholder for chemical/bio
    { name: 'Furniture', icon: Sofa },
    { name: 'Automotive', icon: Cog },
    { name: 'Pharma', icon: Stethoscope },
    { name: 'Food', icon: Utensils },
    { name: 'Beverage', icon: Coffee },
    { name: 'Organic', icon: Leaf },
    { name: 'Fruit', icon: Apple },
    { name: 'Bakery', icon: Pizza },
    { name: 'Electrical', icon: Zap },
    { name: 'Maintenance', icon: Wrench },
    { name: 'Materials', icon: Layers },
    { name: 'Construction', icon: HardHat },
    { name: 'Logistics', icon: Truck },
    { name: 'Machinery', icon: Factory },
  ];

  const IconDisplay = ({ iconName, className }: { iconName: string, className?: string }) => {
    // Try to find the icon component
    const iconItem = suggestedIcons.find(i => i.name.toLowerCase() === (iconName || '').toLowerCase());
    const IconComp = iconItem ? iconItem.icon : LayoutGrid;
    return <IconComp className={className} />;
  };

  const IconPicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
    <div className="grid gap-2">
      <Label className="font-bold mb-1">Select Icon</Label>
      <div className="grid grid-cols-5 gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
        {suggestedIcons.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onChange(item.name)}
              className={cn(
                "p-2 rounded-lg flex flex-col items-center gap-1 transition-all",
                value === item.name
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                  : "bg-white text-zinc-400 hover:text-primary hover:bg-primary/5"
              )}
            >
              <IconComp className="h-5 w-5" />
              <span className="text-[8px] font-bold uppercase truncate w-full text-center">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-zinc-50/50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
            <ListTodo className="h-8 w-8 text-[#467ab5]" />
            CATEGORY MANAGEMENT
          </h1>
          <p className="text-zinc-500 font-medium">Create and organize marketplace product categories</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCategories}
            disabled={isLoading}
            className="rounded-xl border-zinc-200 hover:bg-white hover:text-[#467ab5] transition-all shadow-sm"
          >
            <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
                <Plus className="h-5 w-5 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-black uppercase tracking-tighter">Add New Category</DialogTitle>
                  <DialogDescription>Enter the details for the new product category.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="font-bold">Category Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Construction Supplies"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug" className="font-bold">Slug (URL Name)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g. construction-supplies"
                    />
                  </div>
                  <IconPicker
                    value={formData.icon}
                    onChange={(val) => setFormData({ ...formData, icon: val })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="font-black uppercase tracking-widest w-full">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Category
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-zinc-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-zinc-100 py-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search categories..."
                className="pl-10 bg-zinc-50 border-zinc-200 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
              Total: {categories.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
              <p className="font-black uppercase tracking-widest text-xs">Loading Categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-20 text-center">
              <LayoutGrid className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest">No categories found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead className="w-[100px] font-black uppercase tracking-widest text-[10px]">Icon</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Category Name</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px]">Slug</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-center">Products</TableHead>
                  <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <TableCell>
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                        <IconDisplay iconName={category.icon} className="h-5 w-5" />
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-zinc-900">{category.name}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">{category.slug}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-black text-[10px] uppercase px-2">
                        {formatNumber(category.productCount)} SKUs
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingCategory(category);
                              setFormData({ name: category.name, slug: category.slug, icon: category.icon });
                              setIsEditOpen(true);
                            }}
                            className="font-bold text-xs uppercase cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(category.id, category.productCount)}
                            className={cn(
                              "font-bold text-xs uppercase cursor-pointer",
                              category.productCount > 0 ? "text-zinc-300" : "text-destructive"
                            )}
                            disabled={category.productCount > 0}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tighter">Edit Category</DialogTitle>
              <DialogDescription>Update the details for this category.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className="font-bold">Category Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug" className="font-bold">Slug (URL Name)</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <IconPicker
                value={formData.icon}
                onChange={(val) => setFormData({ ...formData, icon: val })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="font-black uppercase tracking-widest w-full">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
