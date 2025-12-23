import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone, ArrowRight, User, Building2, MapPin, Check, FileText, Upload, BadgeCheck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

const businessTypes = [
  'Manufacturer', 'Wholesaler', 'Distributor', 'Trading Company', 'Exporter', 'Importer', 'Retailer'
];

const productCategories = [
  'Electronics', 'Textiles & Apparel', 'Machinery', 'Chemicals', 'Agriculture',
  'Food & Beverages', 'Construction', 'Automotive', 'Home & Living', 'Health & Beauty',
  'Sports & Fitness', 'Packaging', 'Industrial Supplies', 'Office Supplies', 'Other'
];

export default function SellerRegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState('email');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    businessDescription: '',
    annualTurnover: '',
    employeeCount: '',
    yearsInBusiness: '',
    websiteUrl: '',
    bankAccountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSendOtp = () => {
    if (!formData.phone || formData.phone.length !== 10) {
      toast({ title: 'Invalid Phone', description: 'Please enter a valid 10-digit phone number', variant: 'destructive' });
      return;
    }
    setOtpSent(true);
    toast({ title: 'OTP Sent', description: 'A 6-digit OTP has been sent to your phone' });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (authMethod === 'email') {
        if (!formData.fullName || !formData.email || !formData.password) {
          toast({ title: 'Missing Fields', description: 'Please fill in all required fields', variant: 'destructive' });
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({ title: 'Password Mismatch', description: 'Passwords do not match', variant: 'destructive' });
          return;
        }
      } else {
        if (!formData.fullName || !formData.phone || !otp) {
          toast({ title: 'Missing Fields', description: 'Please fill in all required fields and verify OTP', variant: 'destructive' });
          return;
        }
      }
    }
    if (step === 2) {
      if (!formData.businessName || !formData.businessType || !formData.gstNumber) {
        toast({ title: 'Missing Fields', description: 'Business name, type, and GST number are required', variant: 'destructive' });
        return;
      }
    }
    if (step === 3) {
      if (selectedCategories.length === 0) {
        toast({ title: 'Select Categories', description: 'Please select at least one product category', variant: 'destructive' });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleRegister = () => {
    if (!agreedToTerms) {
      toast({ title: 'Terms Required', description: 'Please agree to the terms and conditions', variant: 'destructive' });
      return;
    }
    toast({ 
      title: 'Registration Submitted!', 
      description: 'Your seller account is under review. We\'ll notify you once approved.' 
    });
    navigate('/vendor/dashboard');
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Link to="/" className="text-2xl font-bold text-primary mx-auto">Jumma<span className="text-secondary">baba</span></Link>
          <CardTitle className="mt-4">Register as Seller</CardTitle>
          <CardDescription>Join India's leading B2B marketplace and grow your business</CardDescription>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <Check className="h-3 w-3" /> : s}
                </div>
                {s < totalSteps && <div className={`w-6 sm:w-10 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
            <span>Account</span>
            <span>Business</span>
            <span>Products</span>
            <span>Bank</span>
            <span>Confirm</span>
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    className="pl-10"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>
              </div>

              <Tabs value={authMethod} onValueChange={setAuthMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Email</TabsTrigger>
                  <TabsTrigger value="phone"><Phone className="h-4 w-4 mr-2" />Phone</TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="flex gap-2">
                      <Input value="+91" className="w-16" readOnly />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        className="flex-1"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    </div>
                  </div>
                  {!otpSent ? (
                    <Button type="button" variant="outline" className="w-full" onClick={handleSendOtp}>
                      Send OTP
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                      <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={handleSendOtp}>
                        Resend OTP
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button className="w-full mt-4" onClick={handleNextStep}>
                Next: Business Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="businessName"
                      placeholder="Company name"
                      className="pl-10"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number *</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gstNumber"
                      placeholder="22AAAAA0000A1Z5"
                      className="pl-10"
                      value={formData.gstNumber}
                      onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    placeholder="ABCDE1234F"
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  placeholder="Describe your business, products, and services..."
                  className="min-h-[80px]"
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Years in Business</Label>
                  <Select value={formData.yearsInBusiness} onValueChange={(value) => handleInputChange('yearsInBusiness', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 Year</SelectItem>
                      <SelectItem value="1-3">1-3 Years</SelectItem>
                      <SelectItem value="3-5">3-5 Years</SelectItem>
                      <SelectItem value="5-10">5-10 Years</SelectItem>
                      <SelectItem value="10+">10+ Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Employees</Label>
                  <Select value={formData.employeeCount} onValueChange={(value) => handleInputChange('employeeCount', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="500+">500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualTurnover">Annual Turnover</Label>
                  <Select value={formData.annualTurnover} onValueChange={(value) => handleInputChange('annualTurnover', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-10L">₹0-10 Lakh</SelectItem>
                      <SelectItem value="10L-50L">₹10-50 Lakh</SelectItem>
                      <SelectItem value="50L-1Cr">₹50L-1 Cr</SelectItem>
                      <SelectItem value="1Cr-10Cr">₹1-10 Cr</SelectItem>
                      <SelectItem value="10Cr+">₹10+ Cr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Street address"
                    className="pl-10"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {indianStates.map((state) => (
                        <SelectItem key={state} value={state.toLowerCase()}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="110001"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={handleNextStep}>
                  Next: Products <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Product Categories */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Package className="h-10 w-10 mx-auto text-primary mb-2" />
                <h3 className="font-medium text-foreground">Select Product Categories</h3>
                <p className="text-sm text-muted-foreground">Choose the categories you'll be selling in</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {productCategories.map((category) => (
                  <div
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center text-sm ${
                      selectedCategories.includes(category)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {category}
                    {selectedCategories.includes(category) && (
                      <Check className="h-4 w-4 mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  <BadgeCheck className="h-4 w-4 inline mr-1 text-primary" />
                  Selected: {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={handleNextStep}>
                  Next: Bank Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Bank Details */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <BadgeCheck className="h-10 w-10 mx-auto text-primary mb-2" />
                <h3 className="font-medium text-foreground">Bank Account Details</h3>
                <p className="text-sm text-muted-foreground">For receiving payments (optional, can be added later)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountName">Account Holder Name</Label>
                <Input
                  id="bankAccountName"
                  placeholder="Name as per bank account"
                  value={formData.bankAccountName}
                  onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="e.g., State Bank of India"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    placeholder="e.g., SBIN0001234"
                    value={formData.ifscCode}
                    onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Upload className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Upload Documents (Optional)</p>
                  <p className="text-xs text-muted-foreground">GST Certificate, PAN Card, Cancelled Cheque</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Upload className="h-3 w-3 mr-1" /> Upload Files
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                <Button className="flex-1" onClick={handleNextStep}>
                  Review & Submit <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {step === 5 && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" /> Account Details
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{formData.fullName}</span>
                  <span className="text-muted-foreground">{authMethod === 'email' ? 'Email:' : 'Phone:'}</span>
                  <span className="font-medium">{authMethod === 'email' ? formData.email : `+91 ${formData.phone}`}</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Business Details
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Business:</span>
                  <span className="font-medium">{formData.businessName}</span>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{formData.businessType}</span>
                  <span className="text-muted-foreground">GST:</span>
                  <span className="font-medium">{formData.gstNumber}</span>
                  {formData.panNumber && (
                    <>
                      <span className="text-muted-foreground">PAN:</span>
                      <span className="font-medium">{formData.panNumber}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> Product Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <span key={cat} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {(formData.address || formData.city) && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </h3>
                  <p className="text-sm">
                    {[formData.address, formData.city, formData.state, formData.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 mt-4">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  I agree to the <Link to="/terms" className="text-primary hover:underline">Seller Terms</Link>,{' '}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, and confirm that all information provided is accurate.
                </Label>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>Back</Button>
                <Button className="flex-1" onClick={handleRegister}>
                  Submit Application <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
            </p>
            <p className="text-muted-foreground mt-1">
              Want to buy?{' '}
              <Link to="/buyer/register" className="text-primary font-medium hover:underline">Register as Buyer</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
