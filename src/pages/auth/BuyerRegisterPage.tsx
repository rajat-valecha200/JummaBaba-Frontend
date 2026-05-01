import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone, ArrowRight, User, Building2, MapPin, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { api } from '@/lib/api';
import {
  buyerStep1EmailSchema,
  buyerStep1PhoneSchema,
  buyerStep2Schema,
  validateField,
  gstNumberSchema,
  pincodeSchema,
  indianPhoneSchema,
  emailSchema,
  passwordSchema,
  fullNameSchema,
  otpSchema,
} from '@/lib/validations';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

const businessTypes = [
  'Retailer', 'Wholesaler', 'Distributor', 'Manufacturer', 'Exporter', 'Importer', 'Other'
];

interface FieldErrorProps {
  error: string | null;
}

function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;
  return (
    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  );
}

export default function BuyerRegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState('email');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
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
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateSingleField(field);
  };

  const validateSingleField = (field: string) => {
    let error: string | null = null;
    const value = field === 'otp' ? otp : formData[field as keyof typeof formData];

    switch (field) {
      case 'fullName':
        error = validateField(fullNameSchema, value);
        break;
      case 'email':
        error = validateField(emailSchema, value);
        break;
      case 'password':
        error = validateField(passwordSchema, value);
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          error = "Passwords don't match";
        }
        break;
      case 'phone':
        error = validateField(indianPhoneSchema, value);
        break;
      case 'otp':
        error = validateField(otpSchema, otp);
        break;
      case 'gstNumber':
        if (value) {
          error = validateField(gstNumberSchema, value);
        }
        break;
      case 'pincode':
        if (value) {
          error = validateField(pincodeSchema, value);
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const handleSendOtp = () => {
    const phoneError = validateField(indianPhoneSchema, formData.phone);
    if (phoneError) {
      setErrors(prev => ({ ...prev, phone: phoneError }));
      setTouched(prev => ({ ...prev, phone: true }));
      return;
    }
    setOtpSent(true);
    toast({ title: 'OTP Sent', description: 'A 6-digit OTP has been sent to your phone' });
  };

  const validateStep1 = (): boolean => {
    if (authMethod === 'email') {
      const result = buyerStep1EmailSchema.safeParse({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (!result.success) {
        const newErrors: Record<string, string | null> = {};
        result.error.errors.forEach((err) => {
          const path = err.path[0] as string;
          if (!newErrors[path]) {
            newErrors[path] = err.message;
          }
        });
        setErrors(prev => ({ ...prev, ...newErrors }));
        setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
        return false;
      }
    } else {
      const result = buyerStep1PhoneSchema.safeParse({
        fullName: formData.fullName,
        phone: formData.phone,
        otp: otp,
      });

      if (!result.success) {
        const newErrors: Record<string, string | null> = {};
        result.error.errors.forEach((err) => {
          const path = err.path[0] as string;
          if (!newErrors[path]) {
            newErrors[path] = err.message;
          }
        });
        setErrors(prev => ({ ...prev, ...newErrors }));
        setTouched({ fullName: true, phone: true, otp: true });
        return false;
      }
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const result = buyerStep2Schema.safeParse({
      businessName: formData.businessName,
      businessType: formData.businessType,
      gstNumber: formData.gstNumber,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    });

    if (!result.success) {
      const newErrors: Record<string, string | null> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        if (!newErrors[path]) {
          newErrors[path] = err.message;
        }
      });
      setErrors(prev => ({ ...prev, ...newErrors }));
      return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!validateStep1()) {
        toast({ title: 'Validation Error', description: 'Please fix the errors before continuing', variant: 'destructive' });
        return;
      }

      // Check availability before proceeding to step 2
      setLoading(true);
      try {
        const check = await api.auth.checkAvailability(
          authMethod === 'email' ? formData.email : undefined,
          authMethod === 'phone' ? formData.phone : undefined
        );

        if (!check.available) {
          const typeLabel = check.type === 'email' ? 'Email address' : 'Phone number';
          setErrors(prev => ({ ...prev, [check.type]: `${typeLabel} is already registered` }));
          setTouched(prev => ({ ...prev, [check.type]: true }));
          toast({ 
            title: 'Account Exists', 
            description: `This ${typeLabel.toLowerCase()} is already associated with an account. Please use a different one or login.`, 
            variant: 'destructive' 
          });
          return;
        }
      } catch (error) {
        toast({ title: 'Check Failed', description: 'Could not verify account availability. Please try again.', variant: 'destructive' });
        return;
      } finally {
        setLoading(false);
      }
    }
    
    if (step === 2 && !validateStep2()) {
      toast({ title: 'Validation Error', description: 'Please fix the errors before continuing', variant: 'destructive' });
      return;
    }
    setStep(step + 1);
  };

  const { register, login } = useAuth();

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!agreedToTerms) {
      toast({ title: 'Terms Required', description: 'Please agree to the terms and conditions', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Pre-check: verify backend is reachable
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/public/stats`, { method: 'GET', signal: AbortSignal.timeout(4000) });
      } catch {
        throw new Error('Cannot reach the server. Please make sure the backend is running on port 3000 and try again.');
      }
      await register({
        full_name: formData.fullName,
        email: formData.email || `${formData.phone}@phone.jummababa.local`,
        phone: formData.phone,
        password: formData.password || otp,
        role: 'buyer',
        business_name: formData.businessName,
        business_type: formData.businessType,
        gst_number: formData.gstNumber,
        location: [formData.city, formData.state].filter(Boolean).join(', '),
        business_details: {
          businessType: formData.businessType,
          gstNumber: formData.gstNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        }
      });

      toast({ title: 'Registration Successful!', description: 'Welcome to JummaBaba.com! You can now start buying.' });
      navigate('/buyer/dashboard');
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto"><Logo size="lg" /></Link>
          <CardTitle className="mt-4">Register as Buyer</CardTitle>
          <CardDescription>Create your buyer account to start purchasing wholesale</CardDescription>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
            <span>Account</span>
            <span>Business</span>
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
                    className={`pl-10 ${touched.fullName && errors.fullName ? 'border-destructive' : ''}`}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                  />
                </div>
                <FieldError error={touched.fullName ? errors.fullName : null} />
              </div>

              <Tabs value={authMethod} onValueChange={(v) => { setAuthMethod(v); setErrors({}); setTouched({}); }}>
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
                      className={touched.email && errors.email ? 'border-destructive' : ''}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                    />
                    <FieldError error={touched.email ? errors.email : null} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars with letter & number"
                        className={touched.password && errors.password ? 'border-destructive' : ''}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
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
                    <FieldError error={touched.password ? errors.password : null} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className={touched.confirmPassword && errors.confirmPassword ? 'border-destructive' : ''}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                    />
                    <FieldError error={touched.confirmPassword ? errors.confirmPassword : null} />
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
                        className={`flex-1 ${touched.phone && errors.phone ? 'border-destructive' : ''}`}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onBlur={() => handleBlur('phone')}
                      />
                    </div>
                    <FieldError error={touched.phone ? errors.phone : null} />
                    <p className="text-xs text-muted-foreground">Must start with 6, 7, 8, or 9</p>
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
                        className={touched.otp && errors.otp ? 'border-destructive' : ''}
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors(prev => ({ ...prev, otp: null })); }}
                        onBlur={() => { setTouched(prev => ({ ...prev, otp: true })); validateSingleField('otp'); }}
                      />
                      <FieldError error={touched.otp ? errors.otp : null} />
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
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name (Optional)</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    placeholder="Your company name"
                    className="pl-10"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                <Input
                  id="gstNumber"
                  placeholder="22AAAAA0000A1Z5"
                  className={touched.gstNumber && errors.gstNumber ? 'border-destructive' : ''}
                  value={formData.gstNumber}
                  onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('gstNumber')}
                />
                <FieldError error={touched.gstNumber ? errors.gstNumber : null} />
                <p className="text-xs text-muted-foreground">Format: 22AAAAA0000A1Z5 (15 characters)</p>
              </div>

              <LocationPicker
                value={{
                  address: formData.address,
                  state: formData.state,
                  city: formData.city,
                  pincode: formData.pincode,
                }}
                onChange={(updated) => {
                  Object.entries(updated).forEach(([k, v]) =>
                    setFormData(prev => ({ ...prev, [k]: v as string }))
                  );
                }}
                errors={errors}
                touched={touched}
                onBlur={handleBlur}
              />

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={handleNextStep}>
                  Next: Review <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm text-foreground">Account Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{formData.fullName}</span>
                  <span className="text-muted-foreground">{authMethod === 'email' ? 'Email:' : 'Phone:'}</span>
                  <span className="font-medium">{authMethod === 'email' ? formData.email : `+91 ${formData.phone}`}</span>
                </div>
              </div>

              {(formData.businessName || formData.businessType || formData.gstNumber) && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-sm text-foreground">Business Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {formData.businessName && (
                      <>
                        <span className="text-muted-foreground">Business:</span>
                        <span className="font-medium">{formData.businessName}</span>
                      </>
                    )}
                    {formData.businessType && (
                      <>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">{formData.businessType}</span>
                      </>
                    )}
                    {formData.gstNumber && (
                      <>
                        <span className="text-muted-foreground">GST:</span>
                        <span className="font-medium">{formData.gstNumber}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {(formData.address || formData.city || formData.state) && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-sm text-foreground">Address</h3>
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
                  I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={loading}>Back</Button>
                <Button className="flex-1" onClick={handleRegister} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating Account...</>
                  ) : (
                    <>Create Account <Check className="ml-2 h-4 w-4" /></>
                  )}
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
              Want to sell?{' '}
              <Link to="/seller/register" className="text-primary font-medium hover:underline">Register as Seller</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
