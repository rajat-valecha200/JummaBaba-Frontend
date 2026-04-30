import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  MessageSquare, 
  ShoppingCart,
  FileText,
  Share2,
  Heart,
  ZoomIn,
  Star,
  Building,
  Package,
  Send,
  Loader2,
  Construction
} from 'lucide-react';
import { UnderConstructionModal } from '@/components/ui/UnderConstructionModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrustBadges } from '@/components/b2b/TrustBadge';
import { PricingSlabsTable, CompactPricing } from '@/components/b2b/PricingSlabsTable';
import { ProductCard } from '@/components/b2b/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { api } from '@/lib/api';
import { formatPrice, formatNumber, cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [constructionOpen, setConstructionOpen] = useState(false);
  const [featureName, setFeatureName] = useState('');
  const [rfqOpen, setRfqOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingRfq, setSubmittingRfq] = useState(false);
  
  const [product, setProduct] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const [rfqForm, setRfqForm] = useState({
    quantity: '',
    unit: 'pieces',
    targetPrice: '',
    deliveryLocation: '',
    description: '',
  });

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        // Fetch all products to find the one with this slug
        // Better would be a direct get-by-slug endpoint, but this works for now
        const data = await api.products.list('approved');
        const found = data.find((p: any) => p.slug === slug);
        
        if (found) {
          const pricingSlabs = typeof found.pricing_slabs === 'string' ? JSON.parse(found.pricing_slabs) : found.pricing_slabs;
          setProduct({
            ...found,
            pricingSlabs: pricingSlabs,
            specifications: typeof found.specifications === 'string' ? JSON.parse(found.specifications) : found.specifications || {}
          });
          
          setQuantity(found.moq || 0);

          // Fetch supplier info
          // On the new backend, we can get vendor info from public stats or a specific profile call
          // For now, let's try to find it in the vendor list
          try {
            const profiles = await api.profiles.list();
            const foundSup = profiles.find((v: any) => v.id === found.supplier_id);
            if (foundSup) {
              setSupplier({
                ...foundSup,
                yearEstablished: foundSup.established_year || 2018,
                companyName: foundSup.business_name || foundSup.full_name
              });
            }
          } catch (e) {
            // Fallback if profiles list is restricted
            setSupplier({
              id: found.supplier_id,
              companyName: 'Verified Supplier',
              yearEstablished: 2018
            });
          }
          
          // Set related
          const related = data
            .filter((p: any) => String(p.categoryId) === String(found.categoryId) && p.id !== found.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [slug]);

  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-b2b-orange" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Product Not Found</h2>
        <p className="text-muted-foreground mt-2">The product you are looking for does not exist in our database.</p>
        <Button asChild className="mt-6">
          <Link to="/products">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }
  
  const openConstruction = (name: string) => {
    setFeatureName(name);
    setConstructionOpen(true);
  };

  const getActiveTier = (qty: number) => {
    if (!product.pricingSlabs) return null;
    return product.pricingSlabs.find(slab => 
      qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)
    ) || product.pricingSlabs[0];
  };

  const activeTier = getActiveTier(quantity || product.moq);
  const totalPrice = (quantity || product.moq) * (activeTier?.pricePerUnit || 0);

  const handleOpenRfq = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to request a quotation.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    setRfqForm({
      quantity: String(quantity) || String(product.moq),
      unit: product.unit,
      targetPrice: '',
      deliveryLocation: '',
      description: '',
    });
    setRfqOpen(true);
  };

  const handleSubmitRfq = async () => {
    if (!rfqForm.quantity || !rfqForm.deliveryLocation) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    setSubmittingRfq(true);
    try {
      await api.rfqs.create({
        product_id: product.id,
        buyer_id: user?.id,
        quantity: parseInt(rfqForm.quantity),
        unit: rfqForm.unit,
        target_price: rfqForm.targetPrice ? parseFloat(rfqForm.targetPrice) : null,
        delivery_location: rfqForm.deliveryLocation,
        description: rfqForm.description
      });
      toast({ 
        title: 'RFQ Submitted Successfully!', 
        description: 'Your request has been sent to our admin team for mediation.',
        action: (
          <Button variant="outline" size="sm" asChild className="font-bold border-primary text-primary">
            <Link to="/buyer/rfqs">View Requests</Link>
          </Button>
        )
      });
      setRfqOpen(false);
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setSubmittingRfq(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-card border-b">
        <div className="b2b-container py-3">
          <nav className="flex items-center gap-2 text-sm overflow-x-auto">
            <Link to="/" className="text-muted-foreground hover:text-primary whitespace-nowrap">Home</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Link to="/categories" className="text-muted-foreground hover:text-primary whitespace-nowrap">Categories</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="b2b-container py-6">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-card rounded-lg border overflow-hidden group">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-colors ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground mt-2">{product.shortDescription}</p>
              <TrustBadges 
                isVerified={product.isVerified}
                isTopSupplier={supplier?.isTopSupplier}
                className="mt-3"
                size="md"
              />
            </div>

            {/* Pricing */}
            <Card>
              <CardContent className="p-4">
                <CompactPricing slabs={product.pricingSlabs} unit={product.unit} />
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Minimum Order Quantity:</span>{' '}
                    <span className="text-primary font-bold">{product.moq} {product.unit}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Slabs Table */}
            <div>
              <h3 className="font-semibold mb-2">Quantity-Based Pricing</h3>
              <PricingSlabsTable slabs={product.pricingSlabs} unit={product.unit} />
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center justify-between">
                  <Label htmlFor="qty" className="font-bold text-lg">Select Quantity</Label>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Total Price</p>
                    <p className="text-2xl font-black text-primary">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      id="qty"
                      type="number"
                      placeholder={`Min ${product.moq}`}
                      value={quantity || ''}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      min={product.moq}
                      className="text-lg py-6 font-bold"
                    />
                  </div>
                  <Button className="px-8 py-6 text-lg font-bold uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Buy Now
                  </Button>
                </div>
                {activeTier && (
                  <p className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full inline-block mt-2">
                    ACTIVE TIER: {activeTier.minQty}{activeTier.maxQty ? ` - ${activeTier.maxQty}` : '+'} {product.unit} @ {formatPrice(activeTier.pricePerUnit)}/unit
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 font-bold uppercase tracking-wider text-xs" onClick={handleOpenRfq}>
                  <FileText className="h-4 w-4 mr-2" />
                  Request Bulk Quote
                </Button>
                <Button variant="secondary" className="flex-1 h-12 font-bold uppercase tracking-wider text-xs" onClick={() => openConstruction('Business Negotiation Chat')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Negotiate Price
                </Button>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className={isInWishlist(product.id) ? "text-destructive hover:text-destructive" : ""}
                  onClick={() => toggleWishlist(product.id, product.name)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                  {isInWishlist(product.id) ? "Saved" : "Save to Wishlist"}
                </Button>
                <Button variant="ghost">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* RFQ Dialog */}
            <Dialog open={rfqOpen} onOpenChange={setRfqOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Request for Quotation</DialogTitle>
                  <DialogDescription>
                    Get a custom quote from <span className="font-semibold"><span className="font-extrabold">J</span>umma<span className="font-extrabold">B</span>aba<span className="text-b2b-orange">.com</span></span> Platform
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MOQ: {product.moq} {product.unit} • Starting at {formatPrice(product.pricingSlabs[product.pricingSlabs.length - 1].pricePerUnit)}/{product.unit}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rfqQty">Quantity Required *</Label>
                      <Input
                        id="rfqQty"
                        type="number"
                        value={rfqForm.quantity}
                        onChange={(e) => setRfqForm({ ...rfqForm, quantity: e.target.value })}
                        min={product.moq}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rfqUnit">Unit</Label>
                      <Select
                        value={rfqForm.unit}
                        onValueChange={(value) => setRfqForm({ ...rfqForm, unit: value })}
                      >
                        <SelectTrigger className="mt-1">
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
                    <Label htmlFor="rfqTarget">Target Price (₹/{rfqForm.unit}) - Optional</Label>
                    <Input
                      id="rfqTarget"
                      type="number"
                      value={rfqForm.targetPrice}
                      onChange={(e) => setRfqForm({ ...rfqForm, targetPrice: e.target.value })}
                      placeholder="Your expected price"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rfqLocation">Delivery Location *</Label>
                    <Input
                      id="rfqLocation"
                      value={rfqForm.deliveryLocation}
                      onChange={(e) => setRfqForm({ ...rfqForm, deliveryLocation: e.target.value })}
                      placeholder="City, State"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rfqDesc">Additional Requirements</Label>
                    <Textarea
                      id="rfqDesc"
                      value={rfqForm.description}
                      onChange={(e) => setRfqForm({ ...rfqForm, description: e.target.value })}
                      placeholder="Specify color, size, packaging, or any other requirements..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRfqOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmitRfq}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit RFQ
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Platform Seller Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sold by Platform</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold"><span className="font-extrabold">J</span>umma<span className="font-extrabold">B</span>aba<span className="text-b2b-orange">.com</span> Marketplace Pvt Ltd</p>
                  <p className="text-sm text-muted-foreground">GSTIN: 27AABCJ1234A1Z5</p>
                  <p className="text-sm text-muted-foreground">Mumbai, Maharashtra</p>
                </div>

                {supplier && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Fulfilled via Verified Supplier</p>
                    <TrustBadges 
                      isTopSupplier={supplier.isTopSupplier}
                      isVerified={true}
                      size="sm"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">4.8</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Platform Rating</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">50K+</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => openConstruction('Platform Seller Profile')}>
                  <Building className="h-4 w-4 mr-2" />
                  View Platform Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <UnderConstructionModal 
          isOpen={constructionOpen} 
          onClose={() => setConstructionOpen(false)} 
          featureName={featureName} 
        />

        {/* Product Details Tabs */}
        <div className="mt-10">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger 
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger 
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Shipping
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">Shipping Time</h4>
                      <p className="text-muted-foreground">5-7 business days (Pan India)</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Shipping Cost</h4>
                      <p className="text-muted-foreground">Calculated at checkout based on quantity and location</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Returns</h4>
                      <p className="text-muted-foreground">7-day return policy for damaged or defective items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-10 pb-10">
            <h2 className="text-xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} supplier={p.vendor} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
