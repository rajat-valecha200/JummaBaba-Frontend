import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Shield, Truck, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';

// Global Cart Logic (Hardened)

export default function BuyerCart() {
  const [dbCartItems, setDbCartItems] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const prodRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/products/public`);
        if (prodRes.ok) setDbProducts(await prodRes.json());
        // For now, load from localStorage to keep it sync
        const saved = localStorage.getItem('jummababa_cart');
        if (saved) setDbCartItems(JSON.parse(saved));
      } catch (e) {
        console.error('Cart sync failed');
      }
    };
    fetchCart();
  }, []);

  const cartWithProducts = dbCartItems.map(item => {
    const product = dbProducts.find(p => p.id === item.productId || p.slug === item.productId);
    if (!product) return null;
    
    // Use first slab if no slabs found
    const slabs = product.pricing_slabs || product.pricingSlabs || [];
    const slab = slabs.find((s: any) => 
      item.quantity >= s.minQty && (!s.maxQty || item.quantity <= s.maxQty)
    ) || slabs[0];
    
    return {
      ...item,
      product,
      supplier: product.vendor || { companyName: 'Verified Supplier' },
      pricePerUnit: slab?.pricePerUnit || 0,
      total: (slab?.pricePerUnit || 0) * item.quantity,
    };
  }).filter(item => item !== null);

  const subtotal = cartWithProducts.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.18;
  const shipping = subtotal > 50000 ? 0 : 2500;
  const total = subtotal + gst + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Looks like you haven't added any products yet. Browse our marketplace to find great deals.
        </p>
        <Button asChild size="lg">
          <Link to="/products">
            Browse Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">{cartItems.length} items in your cart</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/products">
            Continue Shopping
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartWithProducts.map(item => (
            <Card key={item.productId} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Product Image */}
                  <div className="sm:w-40 h-40 sm:h-auto bg-muted flex-shrink-0">
                    <img
                      src={item.product!.images[0]}
                      alt={item.product!.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex flex-col h-full">
                      {/* Product Name & Badge */}
                      <div className="mb-2">
                        <Link 
                          to={`/product/${item.product!.slug}`}
                          className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product!.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-xs font-normal">
                            <Shield className="h-3 w-3 mr-1" />
                            Fulfilled by Platform
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Price per unit */}
                      <p className="text-sm text-muted-foreground mb-4">
                        {formatPrice(item.pricePerUnit)} per {item.product!.unit}
                      </p>
                      
                      {/* Quantity & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground mr-2">Qty:</span>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-r-none border-r-0">
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            className="w-20 h-9 text-center rounded-none border-x-0 focus-visible:ring-0"
                            readOnly
                          />
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-l-none border-l-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Price & Remove */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                          <p className="font-bold text-xl">{formatPrice(item.total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-medium">{formatPrice(gst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? 'text-success font-medium' : 'font-medium'}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Free shipping on orders above ₹50,000
                  </p>
                )}
              </div>
              
              <Separator />
              
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-2xl text-primary">{formatPrice(total)}</span>
              </div>

              {/* Checkout Button */}
              <Button className="w-full" size="lg" asChild>
                <Link to="/buyer/checkout">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Separator />

              {/* Seller Info */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4 text-success" />
                  Seller of Record
                </div>
                <div className="text-sm">
                  <p className="font-medium"><span className="font-extrabold">J</span>umma<span className="font-extrabold">B</span>aba<span className="text-b2b-orange">.com</span> Marketplace Pvt Ltd</p>
                  <p className="text-muted-foreground">GSTIN: 27AABCJ1234A1Z5</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                GST compliant invoice will be generated after order confirmation
              </p>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-card rounded-lg border">
              <Shield className="h-5 w-5 text-success" />
              <span className="text-xs font-medium">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-card rounded-lg border">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Pan India Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
