import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft,
  MapPin, 
  MessageSquare, 
  ShoppingCart,
  FileText,
  Share2,
  Heart,
  ZoomIn,
  Star,
  Building,
  Calendar,
  Package,
  Send
} from 'lucide-react';
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
import { 
  products, 
  getSupplierById, 
  getProductsByCategory,
  formatPrice,
  formatNumber
} from '@/data/mockData';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqForm, setRfqForm] = useState({
    quantity: '',
    unit: 'pieces',
    targetPrice: '',
    deliveryLocation: '',
    description: '',
  });

  const product = products.find(p => p.slug === slug) || products[0];
  const supplier = getSupplierById(product.supplierId);
  const relatedProducts = getProductsByCategory(product.categoryId)
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  const yearsInBusiness = supplier 
    ? new Date().getFullYear() - supplier.yearEstablished 
    : 0;

  const handleOpenRfq = () => {
    setRfqForm({
      quantity: quantity || String(product.moq),
      unit: product.unit,
      targetPrice: '',
      deliveryLocation: '',
      description: '',
    });
    setRfqOpen(true);
  };

  const handleSubmitRfq = () => {
    if (!rfqForm.quantity || !rfqForm.deliveryLocation) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    toast({ 
      title: 'RFQ Submitted Successfully!', 
      description: 'The supplier will respond to your inquiry soon.' 
    });
    setRfqOpen(false);
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
                gstVerified={supplier?.gstVerified}
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
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-32">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min={product.moq}
                  />
                </div>
                <Button className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleOpenRfq}>
                  <FileText className="h-4 w-4 mr-2" />
                  Request Quote
                </Button>
                <Button variant="secondary" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Supplier
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
                    Get a custom quote from {supplier?.companyName}
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

            {/* Supplier Card */}
            {supplier && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Supplier Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={supplier.logo}
                      alt={supplier.companyName}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <Link 
                        to={`/supplier/${supplier.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {supplier.companyName}
                      </Link>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {supplier.location}, {supplier.state}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-primary">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-semibold">{supplier.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{yearsInBusiness}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Years</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{formatNumber(supplier.totalProducts)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Products</p>
                    </div>
                  </div>

                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/supplier/${supplier.id}`}>
                      <Building className="h-4 w-4 mr-2" />
                      View Full Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

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
          <section className="mt-10">
            <h2 className="text-xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map(p => {
                const s = getSupplierById(p.supplierId);
                if (!s) return null;
                return <ProductCard key={p.id} product={p} supplier={s} />;
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
