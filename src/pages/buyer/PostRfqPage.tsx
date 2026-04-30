import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Package, Info, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function PostRfqPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    productName: '',
    categoryId: '',
    quantity: '',
    unit: 'pieces',
    targetPrice: '',
    deliveryLocation: '',
    description: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.categories.list();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please login to post a requirement', variant: 'destructive' });
      navigate('/login');
      return;
    }

    if (!form.productName || !form.quantity || !form.deliveryLocation || !form.categoryId) {
      toast({ title: 'Missing Fields', description: 'Please fill in all required fields marked with *', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await api.rfqs.create({
        product_name: form.productName,
        category_id: form.categoryId,
        quantity: parseInt(form.quantity),
        unit: form.unit,
        target_price: form.targetPrice ? parseFloat(form.targetPrice) : null,
        delivery_location: form.deliveryLocation,
        description: form.description
      });

      toast({ 
        title: 'Requirement Posted!', 
        description: 'Our team will review your requirement and match it with verified suppliers.' 
      });
      navigate('/buyer/rfqs');
    } catch (err: any) {
      toast({ title: 'Failed to post', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post Your Requirement</h1>
          <p className="text-muted-foreground mt-2">
            Tell us what you need, and we'll help you find the best wholesale suppliers and prices.
          </p>
        </div>

        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Product Details
            </CardTitle>
            <CardDescription>Provide specific details for better quotations</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name / Service *</Label>
                <Input 
                  id="productName" 
                  placeholder="e.g., 100% Cotton Plain T-Shirts, Industrial Safety Boots"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={form.categoryId} 
                    onValueChange={(v) => setForm({ ...form, categoryId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measurement</Label>
                  <Select 
                    value={form.unit} 
                    onValueChange={(v) => setForm({ ...form, unit: v })}
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
                      <SelectItem value="tons">Tons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Required *</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1"
                    placeholder="Enter amount"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPrice">Target Price per Unit (Optional)</Label>
                  <Input 
                    id="targetPrice" 
                    type="number" 
                    placeholder="₹ Your expected price"
                    value={form.targetPrice}
                    onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Delivery Location (City/State) *</Label>
                <Input 
                  id="location" 
                  placeholder="e.g., Mumbai, Maharashtra"
                  value={form.deliveryLocation}
                  onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Requirement Details</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your requirement in detail (color, size, material, packaging, etc.)"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Requirement
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                  <Info className="h-3 w-3" />
                  Your requirement will be reviewed by our moderation team.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
