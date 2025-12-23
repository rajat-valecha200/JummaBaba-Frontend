import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Package, 
  Calendar, 
  Building, 
  Phone, 
  Mail, 
  Globe, 
  MessageSquare,
  CheckCircle,
  Award,
  TrendingUp,
  Users,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProductCard } from '@/components/b2b/ProductCard';
import { suppliers, products, formatPrice } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// Extended supplier data for the detail page
const supplierDetails = {
  'sup-1': {
    description: 'Rajesh Electronics Pvt Ltd is a leading manufacturer and distributor of consumer electronics and mobile devices. With over 19 years of experience, we specialize in bulk supply to retailers, distributors, and corporate clients across India.',
    email: 'sales@rajeshelectronics.com',
    phone: '+91 22 4567 8901',
    website: 'www.rajeshelectronics.com',
    employees: '250-500',
    certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'BIS Certified'],
    paymentTerms: 'Net 30, LC, Advance Payment',
    exportCountries: ['UAE', 'Saudi Arabia', 'Kenya', 'Nepal', 'Bangladesh'],
    responseTime: '< 4 hours',
    onTimeDelivery: 98,
    qualityRating: 4.9,
    reviewCount: 156,
  },
  'sup-2': {
    description: 'Sharma Textiles is one of Gujarat\'s premier textile manufacturers and exporters. We produce high-quality cotton and blended fabrics for garment manufacturers, home textile brands, and international buyers.',
    email: 'export@sharmatextiles.in',
    phone: '+91 261 234 5678',
    website: 'www.sharmatextiles.in',
    employees: '500-1000',
    certifications: ['OEKO-TEX Standard 100', 'GOTS Certified', 'ISO 9001:2015'],
    paymentTerms: 'Net 45, LC, TT',
    exportCountries: ['USA', 'UK', 'Germany', 'France', 'Australia'],
    responseTime: '< 2 hours',
    onTimeDelivery: 96,
    qualityRating: 4.7,
    reviewCount: 234,
  },
};

const defaultDetails = {
  description: 'A trusted supplier on JummaBaba.com marketplace, committed to delivering quality products and excellent service to businesses across India.',
  email: 'contact@supplier.com',
  phone: '+91 98765 43210',
  website: 'www.supplier.com',
  employees: '50-100',
  certifications: ['ISO 9001:2015'],
  paymentTerms: 'Net 30, Advance Payment',
  exportCountries: [],
  responseTime: '< 8 hours',
  onTimeDelivery: 92,
  qualityRating: 4.5,
  reviewCount: 45,
};

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const supplier = suppliers.find(s => s.id === id);
  const details = supplierDetails[id as keyof typeof supplierDetails] || defaultDetails;
  const supplierProducts = products.filter(p => p.supplierId === id);

  if (!supplier) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Supplier Not Found</h1>
        <p className="text-muted-foreground mb-6">The supplier you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const yearsInBusiness = new Date().getFullYear() - supplier.yearEstablished;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: `Your inquiry has been sent to ${supplier.companyName}. They will respond shortly.`,
    });
    setContactOpen(false);
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Logo and Basic Info */}
            <div className="flex gap-4 sm:gap-6">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={supplier.logo}
                  alt={supplier.companyName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{supplier.companyName}</h1>
                  {supplier.gstVerified && (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      GST Verified
                    </Badge>
                  )}
                  {supplier.isTopSupplier && (
                    <Badge className="bg-primary">
                      <Award className="h-3 w-3 mr-1" />
                      Top Supplier
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>{supplier.location}, {supplier.state}</span>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base">{details.description}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap lg:flex-col gap-4 lg:gap-2 lg:min-w-[200px] lg:border-l lg:pl-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" />
                <span className="font-semibold text-lg">{supplier.rating}</span>
                <span className="text-sm text-muted-foreground">({details.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.totalProducts} Products</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{yearsInBusiness} Years in Business</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.businessType}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.annualTurnover}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contact {supplier.companyName}</DialogTitle>
                  <DialogDescription>
                    Send an inquiry to this supplier. They typically respond within {details.responseTime}.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your requirements..."
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Send Inquiry</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="lg">
              <Phone className="h-4 w-4 mr-2" />
              {details.phone}
            </Button>
            <Button variant="outline" size="lg">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="products">Products ({supplierProducts.length})</TabsTrigger>
          <TabsTrigger value="about">About Company</TabsTrigger>
          <TabsTrigger value="ratings">Ratings & Reviews</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {supplierProducts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {supplierProducts.map(product => (
                <ProductCard key={product.id} product={product} supplier={supplier} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Products Listed</h3>
                <p className="text-muted-foreground">
                  This supplier hasn't listed any products yet. Contact them directly for product inquiries.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Year Established</p>
                    <p className="font-medium">{supplier.yearEstablished}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employees</p>
                    <p className="font-medium">{details.employees}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Business Type</p>
                    <p className="font-medium">{supplier.businessType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Turnover</p>
                    <p className="font-medium">{supplier.annualTurnover}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Terms</p>
                  <p className="font-medium">{details.paymentTerms}</p>
                </div>
                {details.exportCountries.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Export Markets</p>
                    <div className="flex flex-wrap gap-2">
                      {details.exportCountries.map((country) => (
                        <Badge key={country} variant="outline">{country}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications & Trust */}
            <Card>
              <CardHeader>
                <CardTitle>Certifications & Trust</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {details.certifications.map((cert) => (
                    <div key={cert} className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-success" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">On-Time Delivery Rate</span>
                    <span className="font-semibold text-success">{details.onTimeDelivery}%</span>
                  </div>
                  <Progress value={details.onTimeDelivery} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quality Rating</span>
                    <span className="font-semibold">{details.qualityRating}/5</span>
                  </div>
                  <Progress value={details.qualityRating * 20} className="h-2" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Response Time: <strong>{details.responseTime}</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{details.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{details.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <p className="font-medium">{details.website}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Overall Rating */}
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-5xl font-bold text-primary mb-2">{supplier.rating}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(supplier.rating) ? 'text-primary fill-primary' : 'text-muted'}`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground">Based on {details.reviewCount} reviews</p>
              </CardContent>
            </Card>

            {/* Rating Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Rating Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Product Quality', value: 4.8 },
                  { label: 'Communication', value: 4.6 },
                  { label: 'Shipping Speed', value: 4.5 },
                  { label: 'Value for Money', value: 4.7 },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <Progress value={item.value * 20} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sample Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: 'Amit Patel',
                  company: 'Tech Retail Solutions',
                  rating: 5,
                  date: '2 weeks ago',
                  comment: 'Excellent supplier! Quality products delivered on time. Very professional communication throughout the order process.',
                },
                {
                  name: 'Priya Sharma',
                  company: 'Fashion Hub India',
                  rating: 4,
                  date: '1 month ago',
                  comment: 'Good quality products. Slightly delayed shipping but overall satisfied with the purchase.',
                },
                {
                  name: 'Rajesh Kumar',
                  company: 'Industrial Supplies Co.',
                  rating: 5,
                  date: '2 months ago',
                  comment: 'Reliable supplier with competitive prices. Will definitely order again.',
                },
              ].map((review, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{review.name}</p>
                      <p className="text-sm text-muted-foreground">{review.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? 'text-primary fill-primary' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                    </div>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
