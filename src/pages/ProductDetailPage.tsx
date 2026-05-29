import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  MessageSquare,
  ShoppingCart,
  FileText,
  Share2,
  Heart,
  Clock,
  Shield,
  Package,
  Building,
  CheckCircle,
  Star,
  Plus,
  Minus,
  Check,
  AlertCircle,
  ZoomIn,
  Send,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  // Removed UnderConstructionModal logic for F-006
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

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    address: '',
    city: '',
    state: '',
    phone: '',
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

  // Removed UnderConstructionModal logic for F-006

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

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to place an order.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (quantity < product.moq) {
      toast({
        title: 'Invalid Quantity',
        description: `Minimum order quantity is ${product.moq} ${product.unit}`,
        variant: 'destructive',
      });
      return;
    }

    setCheckoutForm({
      address: '',
      city: '',
      state: '',
      phone: user.phone || '',
    });
    setCheckoutOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!checkoutForm.address || !checkoutForm.city || !checkoutForm.state || !checkoutForm.phone) {
      toast({ title: 'Please fill all shipping details', variant: 'destructive' });
      return;
    }

    setSubmittingRfq(true);
    try {
      const fullAddress = `${checkoutForm.address}, ${checkoutForm.city}, ${checkoutForm.state}`;
      const newRfq = await api.rfqs.create({
        product_id: product.id,
        buyer_id: user?.id,
        quantity: quantity,
        unit: product.unit,
        target_price: activeTier?.pricePerUnit || product.minPrice,
        delivery_location: fullAddress,
        description: `FAST-TRACK ORDER: Direct purchase via Buy Now. Contact: ${checkoutForm.phone}`,
        is_direct_order: true,
        share_buyer_details: true,
        product_name: product.name,
        category_id: product.categoryId,
        supplier_id: product.supplier_id,
        buyer_phone: checkoutForm.phone
      });

      toast({
        title: 'Order Placed!',
        description: 'Your direct order has been received. Our team will contact you for payment/delivery.',
        action: (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="font-bold border-primary text-primary">
              <Link to="/buyer/orders">Track Order</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="font-bold border-primary text-primary">
              <Link to={`/messages?rfqId=${newRfq.id}`}>Open Chat</Link>
            </Button>
          </div>
        )
      });
      setCheckoutOpen(false);
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setSubmittingRfq(false);
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
        description: rfqForm.description,
        product_name: product.name,
        category_id: product.categoryId,
        supplier_id: product.supplier_id
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
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-colors ${selectedImage === index ? 'border-primary' : 'border-transparent'
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
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold uppercase text-[10px] tracking-widest px-3 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" /> Verified Product
                      </Badge>
                      {supplier?.isTopSupplier && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[10px] tracking-widest px-3 py-1">
                          <Star className="h-3 w-3 mr-1 fill-current" /> Top Rated
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleWishlist(product.id, product.name)}
                    className={cn(isInWishlist(product.id) ? "text-destructive" : "")}
                  >
                    <Heart className={cn("h-5 w-5", isInWishlist(product.id) && "fill-current")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: product.name,
                          text: product.shortDescription,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast({ title: 'Link copied to clipboard!' });
                      }
                    }}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground mt-2">{product.shortDescription}</p>
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

            {/* Checkout Dialog */}
            <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Complete Your Order</DialogTitle>
                  <DialogDescription>
                    Provide your shipping details to finalize the purchase.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-900">{product.name}</p>
                      <Badge variant="outline" className="bg-white">{quantity} {product.unit}</Badge>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                      <span className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Total Amount</span>
                      <span className="text-lg font-black text-primary">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="address">Full Shipping Address *</Label>
                      <Textarea 
                        id="address" 
                        placeholder="House No, Street, Landmark..." 
                        value={checkoutForm.address}
                        onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input 
                          id="city" 
                          placeholder="e.g. Mumbai" 
                          value={checkoutForm.city}
                          onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input 
                          id="state" 
                          placeholder="e.g. Maharashtra" 
                          value={checkoutForm.state}
                          onChange={(e) => setCheckoutForm({...checkoutForm, state: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Contact Number *</Label>
                      <Input 
                        id="phone" 
                        placeholder="10-digit mobile number" 
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleConfirmPurchase} className="flex-1 font-bold uppercase tracking-widest" disabled={submittingRfq}>
                    {submittingRfq ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Confirm Purchase
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                  <Button
                    onClick={handleBuyNow}
                    disabled={submittingRfq}
                    className="px-8 py-6 text-lg font-bold uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    {submittingRfq ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Ordering...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Buy Now
                      </>
                    )}
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
              </div>
            </div>

            {/* RFQ Dialog */}
            <Dialog open={rfqOpen} onOpenChange={setRfqOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Request for Quotation</DialogTitle>
                  <DialogDescription>
                    Get a custom quote from <span className="font-semibold"><span className="font-extrabold text-black">J</span>umma<span className="font-extrabold text-b2b-gst">B</span>aba<span className="text-b2b-orange">.com</span></span> Platform
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
          </div>
        </div>


        {/* Product Details & Seller Info Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mt-10">
          {/* Details Section (Left) */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader className="border-b pb-4 bg-muted/20">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y border-b">
                  {/* Description Section */}
                  <div className="p-6">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {product.description}
                    </p>
                  </div>

                  {/* Specifications Section */}
                  <div className="p-6">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-4">Specifications</h3>
                    <div className="flex flex-col space-y-0">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors px-2 -mx-2 rounded-lg">
                          <span className="text-muted-foreground text-sm font-medium">{key}</span>
                          <span className="font-bold text-sm text-foreground">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Section */}
                  <div className="p-6 bg-muted/10">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">Shipping & Returns</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs font-bold">Delivery Time</p>
                            <p className="text-[11px] text-muted-foreground">5-7 business days (Pan India)</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs font-bold">Returns</p>
                            <p className="text-[11px] text-muted-foreground">7-day easy return policy</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs font-bold">Safe & Secure</p>
                            <p className="text-[11px] text-muted-foreground">Platform Protected Transaction</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seller Information Section (Right) */}
          <div className="h-full">
            <Card className="h-full flex flex-col sticky top-24">
              <CardHeader className="border-b pb-4 bg-muted/20">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col flex-grow space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1.5">Fulfilled by Platform</p>
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="font-bold text-base">
                      <span className="font-extrabold text-black">J</span>umma<span className='text-b2b-gst'><span className="font-extrabold">B</span>aba</span><span className="text-b2b-orange">.com</span> Marketplace
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Official platform fulfillment & quality guarantee</p>
                  </div>
                </div>

                {supplier && (
                  <div className="pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2">Direct Seller Details</p>
                    <Link 
                      to={`/supplier/${supplier.id}`}
                      className="group"
                    >
                      <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        {supplier.companyName}
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      </h4>
                    </Link>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-muted/30 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Established</p>
                        <p className="text-sm font-bold">{supplier.yearEstablished}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Location</p>
                        <p className="text-sm font-bold">Mumbai, India</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1">
                        <Shield className="h-3 w-3 mr-1.5" /> Verified Business Entity
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Fake stats commented out for now as requested */}
                {/* 
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                  <div className="text-center p-4 bg-muted/20 rounded-2xl border border-border">
                    <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="font-black text-lg">4.8</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rating</p>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-2xl border border-border">
                    <div className="flex items-center justify-center gap-1.5 text-foreground mb-1">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span className="font-black text-lg">50K+</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Orders</p>
                  </div>
                </div>
                */}

                <div className="pt-6 mt-auto border-t">
                  <Button variant="outline" className="w-full h-12 font-bold uppercase tracking-widest border-2 hover:bg-primary hover:text-white hover:border-primary transition-all" asChild>
                    <Link to={`/supplier/${supplier?.id}`}>View Full Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
