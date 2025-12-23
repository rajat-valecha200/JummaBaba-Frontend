import { Link, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  CreditCard,
  Building2,
  Copy,
  Download,
  Mail,
  Phone,
  Clock,
  MapPin,
  ArrowRight,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/data/mockData';

// Mock order data - in real app would come from API/state
const mockOrderData = {
  orderNumber: 'JMB-2024-00142',
  orderDate: new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }),
  estimatedDelivery: '5-7 business days',
  paymentMethod: 'bank',
  items: [
    { name: 'Samsung Galaxy A54 5G Bulk Pack', quantity: 100, price: 2780000 },
    { name: 'Premium Cotton Fabric Roll', quantity: 500, price: 39000 },
  ],
  subtotal: 2819000,
  gst: 507420,
  shipping: 0,
  total: 3326420,
  shippingAddress: {
    company: 'ABC Traders Pvt Ltd',
    contact: 'Rahul Sharma',
    address: '45, Industrial Area, Phase 2',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411018',
    phone: '+91 98765 43210'
  }
};

// Platform details
const platformDetails = {
  name: 'JummaBaba.com Marketplace Pvt Ltd',
  gstin: '27AABCJ1234A1Z5',
  pan: 'AABCJ1234A',
  address: '123, Trade Centre, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400069',
  email: 'billing@jummababa.com',
  phone: '+91 22 4000 5000',
  bankDetails: {
    accountName: 'JummaBaba.com Marketplace Pvt Ltd',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0001234',
    bank: 'HDFC Bank, Andheri East Branch',
    upiId: 'jummababa@hdfcbank'
  }
};

export default function OrderConfirmationPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const paymentMethod = searchParams.get('payment') || 'bank';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We've sent a confirmation email to your registered address.
          </p>
        </div>

        {/* Order Number Card */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-xl font-bold text-primary">{mockOrderData.orderNumber}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(mockOrderData.orderNumber, 'Order number')}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Timeline / Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5 text-primary" />
                Order Status & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline */}
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-success-foreground" />
                      </div>
                      <div className="w-0.5 h-full bg-success mt-2" />
                    </div>
                    <div className="pb-6">
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">{mockOrderData.orderDate}</p>
                      <p className="text-xs text-success mt-1">Completed</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-warning/20 border-2 border-warning flex items-center justify-center">
                        <Clock className="h-4 w-4 text-warning" />
                      </div>
                      <div className="w-0.5 h-full bg-muted mt-2" />
                    </div>
                    <div className="pb-6">
                      <p className="font-medium">Payment Pending</p>
                      <p className="text-sm text-muted-foreground">Awaiting payment confirmation</p>
                      <p className="text-xs text-warning mt-1">In Progress</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="w-0.5 h-full bg-muted mt-2" />
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-muted-foreground">Processing</p>
                      <p className="text-sm text-muted-foreground">Order will be processed after payment</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        Estimated: {mockOrderData.estimatedDelivery}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Shipping Address</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mockOrderData.shippingAddress.company}<br />
                    {mockOrderData.shippingAddress.contact}<br />
                    {mockOrderData.shippingAddress.address}<br />
                    {mockOrderData.shippingAddress.city}, {mockOrderData.shippingAddress.state} - {mockOrderData.shippingAddress.pincode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="font-medium text-warning-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Payment Due Within 24 Hours
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please complete the payment to confirm your order. Order will be auto-cancelled after 48 hours if payment is not received.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <p className="font-medium">Bank Transfer Details</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Name</span>
                    <span className="font-medium">{platformDetails.bankDetails.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platformDetails.bankDetails.accountNumber}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(platformDetails.bankDetails.accountNumber, 'Account number')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">IFSC Code</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platformDetails.bankDetails.ifsc}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(platformDetails.bankDetails.ifsc, 'IFSC code')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium text-right">{platformDetails.bankDetails.bank}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">UPI ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{platformDetails.bankDetails.upiId}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(platformDetails.bankDetails.upiId, 'UPI ID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="font-medium text-sm mb-2">Amount to Pay</p>
                <p className="text-2xl font-bold text-primary">{formatPrice(mockOrderData.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reference: {mockOrderData.orderNumber}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Please mention your order number ({mockOrderData.orderNumber}) in the payment remarks for faster processing.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOrderData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.price)}</p>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(mockOrderData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>{formatPrice(mockOrderData.gst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-success">FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(mockOrderData.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller of Record */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Seller of Record (for GST Invoice)</p>
                <p className="font-semibold">{platformDetails.name}</p>
                <p className="text-sm text-muted-foreground">GSTIN: {platformDetails.gstin}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <a href={`mailto:${platformDetails.email}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Mail className="h-4 w-4" />
                  {platformDetails.email}
                </a>
                <a href={`tel:${platformDetails.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  {platformDetails.phone}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/buyer/orders">
              View My Orders
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
