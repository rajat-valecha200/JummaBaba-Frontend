import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { products, getSupplierById, formatPrice } from '@/data/mockData';

// Mock cart items
const cartItems = [
  { productId: 'prod-1', quantity: 100 },
  { productId: 'prod-2', quantity: 500 },
];

export default function BuyerCart() {
  const cartWithProducts = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    const supplier = product ? getSupplierById(product.supplierId) : null;
    // Find applicable price slab
    const slab = product?.pricingSlabs.find(s => 
      item.quantity >= s.minQty && (!s.maxQty || item.quantity <= s.maxQty)
    ) || product?.pricingSlabs[0];
    
    return {
      ...item,
      product,
      supplier,
      pricePerUnit: slab?.pricePerUnit || 0,
      total: (slab?.pricePerUnit || 0) * item.quantity,
    };
  }).filter(item => item.product);

  const subtotal = cartWithProducts.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <p className="text-muted-foreground">{cartItems.length} items in your cart</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartWithProducts.map(item => (
            <Card key={item.productId}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={item.product!.images[0]}
                    alt={item.product!.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/product/${item.product!.slug}`}
                      className="font-semibold hover:text-primary transition-colors line-clamp-2"
                    >
                      {item.product!.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seller: {item.supplier?.companyName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.pricePerUnit)} / {item.product!.unit}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          className="w-20 h-8 text-center"
                          readOnly
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatPrice(item.total)}</p>
                        <Button variant="ghost" size="sm" className="text-destructive h-auto p-0">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {cartItems.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground mb-4">
                  Browse products and add items to your cart
                </p>
                <Button asChild>
                  <Link to="/products">Browse Products</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>{formatPrice(gst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-success">Calculated at checkout</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              <Button className="w-full" size="lg">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                GST invoice will be generated after order confirmation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
