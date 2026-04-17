import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  CreditCard, 
  Building2, 
  Wallet, 
  Truck,
  Shield,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

// Cart items are derived from the same source as BuyerCart (Hardened)

// Indian states for dropdown
const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

// Platform seller details
const platformDetails = {
  name: 'JummaBaba.com Marketplace Pvt Ltd',
  gstin: '27AABCJ1234A1Z5',
  pan: 'AABCJ1234A',
  address: '123, Trade Centre, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400069',
  email: 'billing@jummababa.com',
  phone: '+91 22 4000 5000'
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [shippingForm, setShippingForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  const [billingForm, setBillingForm] = useState({
    companyName: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [dbCartItems, setDbCartItems] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchCheckout = async () => {
      try {
        const prodRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/products/public`);
        if (prodRes.ok) setDbProducts(await prodRes.json());
        const saved = localStorage.getItem('jummababa_cart');
        if (saved) setDbCartItems(JSON.parse(saved));
      } catch (e) {
        console.error('Checkout sync failed');
      }
    };
    fetchCheckout();
  }, []);

  // Calculate order totals
  const cartWithProducts = dbCartItems.map(item => {
    const product = dbProducts.find(p => p.id === item.productId || p.slug === item.productId);
    if (!product) return null;
    
    const slabs = product.pricing_slabs || product.pricingSlabs || [];
    const slab = slabs.find((s: any) => 
      item.quantity >= s.minQty && (!s.maxQty || item.quantity <= s.maxQty)
    ) || slabs[0];
    
    return {
      ...item,
      product,
      pricePerUnit: slab?.pricePerUnit || 0,
      total: (slab?.pricePerUnit || 0) * item.quantity,
    };
  }).filter(item => item !== null);

  const subtotal = cartWithProducts.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.18;
  const shipping = subtotal > 50000 ? 0 : 2500;
  const total = subtotal + gst + shipping;

  const handlePlaceOrder = () => {
    // Basic validation
    if (!shippingForm.companyName || !shippingForm.contactName || !shippingForm.phone || 
        !shippingForm.address || !shippingForm.city || !shippingForm.state || !shippingForm.pincode) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required shipping details.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate order processing
    setTimeout(() => {
      setIsProcessing(false);
      navigate(`/buyer/order-confirmation?payment=${paymentMethod}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-card border-b">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/buyer/cart" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Checkout</span>
          </nav>
        </div>
      </div>

      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={shippingForm.companyName}
                      onChange={(e) => setShippingForm({...shippingForm, companyName: e.target.value})}
                      placeholder="Your company name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName">Contact Person *</Label>
                    <Input
                      id="contactName"
                      value={shippingForm.contactName}
                      onChange={(e) => setShippingForm({...shippingForm, contactName: e.target.value})}
                      placeholder="Full name"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({...shippingForm, phone: e.target.value})}
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm({...shippingForm, email: e.target.value})}
                      placeholder="company@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gstin">GSTIN (Optional - for GST credit)</Label>
                  <Input
                    id="gstin"
                    value={shippingForm.gstin}
                    onChange={(e) => setShippingForm({...shippingForm, gstin: e.target.value.toUpperCase()})}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Textarea
                    id="address"
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm({...shippingForm, address: e.target.value})}
                    placeholder="Building name, street, area"
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({...shippingForm, city: e.target.value})}
                      placeholder="Mumbai"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select
                      value={shippingForm.state}
                      onValueChange={(value) => setShippingForm({...shippingForm, state: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pincode">PIN Code *</Label>
                    <Input
                      id="pincode"
                      value={shippingForm.pincode}
                      onChange={(e) => setShippingForm({...shippingForm, pincode: e.target.value})}
                      placeholder="400001"
                      maxLength={6}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    id="landmark"
                    value={shippingForm.landmark}
                    onChange={(e) => setShippingForm({...shippingForm, landmark: e.target.value})}
                    placeholder="Near metro station, etc."
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="sameAsBilling"
                    checked={sameAsBilling}
                    onCheckedChange={(checked) => setSameAsBilling(checked as boolean)}
                  />
                  <Label htmlFor="sameAsBilling" className="text-sm cursor-pointer">
                    Billing address same as shipping address
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address (if different) */}
            {!sameAsBilling && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingCompany">Company Name *</Label>
                      <Input
                        id="billingCompany"
                        value={billingForm.companyName}
                        onChange={(e) => setBillingForm({...billingForm, companyName: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingGstin">GSTIN</Label>
                      <Input
                        id="billingGstin"
                        value={billingForm.gstin}
                        onChange={(e) => setBillingForm({...billingForm, gstin: e.target.value.toUpperCase()})}
                        maxLength={15}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="billingAddress">Address *</Label>
                    <Textarea
                      id="billingAddress"
                      value={billingForm.address}
                      onChange={(e) => setBillingForm({...billingForm, address: e.target.value})}
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="billingCity">City *</Label>
                      <Input
                        id="billingCity"
                        value={billingForm.city}
                        onChange={(e) => setBillingForm({...billingForm, city: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingState">State *</Label>
                      <Select
                        value={billingForm.state}
                        onValueChange={(value) => setBillingForm({...billingForm, state: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {indianStates.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="billingPincode">PIN Code *</Label>
                      <Input
                        id="billingPincode"
                        value={billingForm.pincode}
                        onChange={(e) => setBillingForm({...billingForm, pincode: e.target.value})}
                        maxLength={6}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Bank Transfer / NEFT / RTGS</p>
                          <p className="text-sm text-muted-foreground">Pay directly to our bank account</p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">UPI Payment</p>
                          <p className="text-sm text-muted-foreground">Pay via UPI apps like GPay, PhonePe, Paytm</p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="credit" id="credit" />
                    <Label htmlFor="credit" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Credit Terms (Net 30)</p>
                          <p className="text-sm text-muted-foreground">For verified buyers with credit limit</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'bank' && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-2">Bank Account Details</p>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>Account Name: <span className="text-foreground"><span className="font-extrabold">J</span>umma<span className="font-extrabold">B</span>aba<span className="text-b2b-orange">.com</span> Marketplace Pvt Ltd</span></p>
                      <p>Account Number: <span className="text-foreground">50200012345678</span></p>
                      <p>IFSC Code: <span className="text-foreground">HDFC0001234</span></p>
                      <p>Bank: <span className="text-foreground">HDFC Bank, Andheri East Branch</span></p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-2">UPI ID</p>
                    <p className="text-sm"><span className="font-semibold"><span className="font-extrabold">j</span>umma<span className="font-extrabold">b</span>aba</span>@hdfcbank</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartWithProducts.map(item => (
                  <div key={item.productId} className="flex gap-3">
                    <img
                      src={item.product!.images[0]}
                      alt={item.product!.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.product!.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatPrice(item.pricePerUnit)}
                      </p>
                      <p className="text-sm font-semibold">{formatPrice(item.total)}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm">
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
                    <span className={shipping === 0 ? 'text-success' : ''}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By placing this order, you agree to our Terms & Conditions
                </p>
              </CardContent>
            </Card>

            {/* Seller of Record */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  Seller of Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{platformDetails.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{platformDetails.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {platformDetails.city}, {platformDetails.state} - {platformDetails.pincode}
                  </p>
                </div>

                <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GSTIN</span>
                    <span className="font-medium">{platformDetails.gstin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PAN</span>
                    <span className="font-medium">{platformDetails.pan}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{platformDetails.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{platformDetails.phone}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <p>GST compliant invoice will be issued in the name of the platform. Input tax credit available for registered businesses.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-card rounded-lg border text-center">
                <Shield className="h-6 w-6 text-success mx-auto mb-1" />
                <p className="text-xs font-medium">Secure Payments</p>
              </div>
              <div className="p-3 bg-card rounded-lg border text-center">
                <Truck className="h-6 w-6 text-primary mx-auto mb-1" />
                <p className="text-xs font-medium">Pan India Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
