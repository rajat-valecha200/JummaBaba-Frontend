import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Building, MapPin, Phone, Mail, Globe, Eye, Clock, CreditCard, Tag, Briefcase, Printer, X, Sliders, Save, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TrustBadge } from '@/components/b2b/TrustBadge';

interface VendorDetailsDialogProps {
  vendor: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason?: string) => void;
  onUpdate?: () => void;
}

export function VendorDetailsDialog({ vendor, open, onOpenChange, onApprove, onReject, onUpdate }: VendorDetailsDialogProps) {
  const { toast } = useToast();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewTitle, setImagePreviewTitle] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const [overrideCancellationDays, setOverrideCancellationDays] = useState<string>('');
  const [overrideEscrowRate, setOverrideEscrowRate] = useState<string>('');
  
  const [commissionType, setCommissionType] = useState<'percentage' | 'tiered'>('percentage');
  const [commissionRate, setCommissionRate] = useState<string>('');
  const [commissionMinCap, setCommissionMinCap] = useState<string>('');
  const [commissionPayerRoute, setCommissionPayerRoute] = useState<'seller_deduct' | 'buyer_add' | 'split_both'>('seller_deduct');
  
  const [isSavingOverrides, setIsSavingOverrides] = useState(false);

  useEffect(() => {
    if (vendor) {
      setOverrideCancellationDays(vendor.cancellation_window_days !== undefined && vendor.cancellation_window_days !== null ? String(vendor.cancellation_window_days) : '');
      setOverrideEscrowRate(vendor.escrow_confirmation_rate !== undefined && vendor.escrow_confirmation_rate !== null ? String(vendor.escrow_confirmation_rate) : '');
      
      const rules = vendor.commission_rules || {};
      setCommissionType(rules.type || 'percentage');
      setCommissionRate(rules.rate !== undefined && rules.rate !== null ? String(rules.rate) : '5');
      setCommissionMinCap(rules.min_cap !== undefined && rules.min_cap !== null ? String(rules.min_cap) : '100');
      setCommissionPayerRoute(rules.payer_route || 'seller_deduct');
    }
  }, [vendor]);

  const handleSaveOverrides = async () => {
    if (!vendor) return;
    setIsSavingOverrides(true);
    try {
      const updatedRules = {
        type: commissionType,
        rate: commissionRate === '' ? null : parseFloat(commissionRate),
        min_cap: commissionMinCap === '' ? null : parseFloat(commissionMinCap),
        payer_route: commissionPayerRoute,
        tiers: vendor.commission_rules?.tiers || []
      };

      const updatePayload = {
        cancellation_window_days: overrideCancellationDays === '' ? null : parseInt(overrideCancellationDays, 10),
        escrow_confirmation_rate: overrideEscrowRate === '' ? null : parseFloat(overrideEscrowRate),
        commission_rules: updatedRules
      };

      await api.profiles.update(vendor.id, updatePayload);
      
      toast({
        title: "Vendor Overrides Saved",
        description: `Marketplace configurations for ${vendor.companyName} have been updated.`,
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      toast({
        title: "Failed to Save Overrides",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingOverrides(false);
    }
  };

  if (!vendor) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full border-l shadow-2xl">
          <SheetHeader className="p-6 border-b bg-background sticky top-0 z-10 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <SheetTitle>Vendor Details</SheetTitle>
              <SheetDescription>Review complete business profile for {vendor.companyName || vendor.business_name}</SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.print()}
                title="Print / Save as PDF"
                className="hidden sm:flex"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            {/* Header Info */}
            <div className="flex items-start gap-4">
              <div className="relative group">
                <img
                  src={vendor.logo}
                  alt={vendor.companyName}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/10 bg-muted shadow-sm group-hover:border-primary/30 transition-colors"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop'; }}
                />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-2xl tracking-tight">{vendor.companyName || vendor.business_name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  {vendor.location || 'Location not specified'}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {vendor.status === 'approved' ? (
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 px-3">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    ) : vendor.status === 'rejected' ? (
                      <Badge variant="destructive" className="px-3">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Review
                      </Badge>
                    )}
                    {vendor.status === 'approved' && <TrustBadge type="verified" />}
                  </div>
                </div>
              </div>
            </div>
            {vendor.status === 'rejected' && (
              <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl">
                <p className="text-[10px] font-black text-destructive uppercase tracking-widest mb-2 flex items-center gap-2">
                  <XCircle className="h-3 w-3" />
                  Rejection Reason
                </p>
                <p className="text-sm font-medium leading-relaxed">
                  {vendor.rejection_reason || "No specific reason provided."}
                </p>
              </div>
            )}
            {/* Key Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">GST Number</p>
                <p className="font-mono text-sm font-semibold">{vendor.gstNumber || vendor.gst_number || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">PAN Number</p>
                <p className="font-mono text-sm font-semibold">{vendor.panNumber || vendor.pan_number || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Business Type</p>
                <p className="text-sm font-semibold uppercase">{vendor.businessType || vendor.business_type || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Est. Year</p>
                <p className="text-sm font-semibold">{vendor.establishedYear || vendor.established_year || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Company Size</p>
                <p className="text-sm font-semibold">{vendor.business_details?.employeeCount || vendor.business_details?.employee_count || 'N/A'} Employees</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Turnover</p>
                <p className="text-sm font-semibold">{vendor.business_details?.annualTurnover || vendor.business_details?.annual_turnover || 'N/A'}</p>
              </div>
            </div>

            {/* Business Description */}
            {(vendor.description || vendor.business_details?.description) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                  <div className="h-px w-8 bg-muted-foreground/20" />
                  About Company
                </h4>
                <p className="text-sm leading-relaxed text-foreground/80 bg-muted/20 p-4 rounded-xl border border-dashed italic">
                  "{vendor.description || vendor.business_details?.description}"
                </p>
              </div>
            )}

            {/* Product Categories */}
            {vendor.business_details?.categories && vendor.business_details.categories.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                  <div className="h-px w-8 bg-muted-foreground/20" />
                  Product Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {vendor.business_details.categories.map((cat: string) => (
                    <Badge key={cat} variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1.5 px-3 py-1">
                      <Tag className="h-3 w-3" />
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Operational Location */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <div className="h-px w-8 bg-muted-foreground/20" />
                Operational Address
              </h4>
              <div className="p-4 bg-muted/20 rounded-xl border border-dashed space-y-1">
                <p className="text-sm font-medium">{vendor.business_details?.address || vendor.address || 'Address not specified'}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{vendor.business_details?.city || vendor.city}</span>
                  <span>•</span>
                  <span>{vendor.business_details?.state || vendor.state}</span>
                  <span>•</span>
                  <span className="font-mono">{vendor.business_details?.pincode || vendor.pincode}</span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <div className="h-px w-8 bg-muted-foreground/20" />
                Contact Info
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-card border shadow-sm">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{vendor.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-card border shadow-sm">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-blue-600">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{vendor.phone || 'N/A'}</span>
                </div>
                {vendor.business_details?.website && (
                  <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-card border shadow-sm">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    <a href={vendor.business_details.website.startsWith('http') ? vendor.business_details.website : `https://${vendor.business_details.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium truncate">
                      {vendor.business_details.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <div className="h-px w-8 bg-muted-foreground/20" />
                Bank Information
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Account Name</p>
                      <p className="font-bold text-sm">{vendor.bank_details?.bankAccountName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-500/10">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Bank Name</p>
                      <p className="text-sm font-semibold">{vendor.bank_details?.bankName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">IFSC Code</p>
                      <p className="text-sm font-mono font-bold">{vendor.bank_details?.ifscCode || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Account Number</p>
                      <p className="text-lg font-mono font-bold tracking-wider">{vendor.bank_details?.accountNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <div className="h-px w-8 bg-muted-foreground/20" />
                Verification Docs
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'gst_certificate', label: 'GST Cert' },
                  { key: 'pan_card', label: 'PAN Card' },
                  { key: 'cancelled_cheque', label: 'Cheque' },
                ].map(({ key, label }) => {
                  const url = vendor.document_paths?.[key] || vendor.documents?.[key];

                  return (
                    <div key={key} className="space-y-2">
                      {url ? (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreviewUrl(url);
                            setImagePreviewTitle(label);
                          }}
                          className="block w-full aspect-[3/4] bg-muted rounded-xl overflow-hidden hover:ring-2 hover:ring-primary transition-all group relative border shadow-sm"
                        >
                          {url.endsWith('.pdf') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-primary bg-primary/5">
                              <FileText className="h-10 w-10" />
                              <span className="text-[10px] font-bold">VIEW PDF</span>
                            </div>
                          ) : (
                            <div className="relative w-full h-full">
                              <img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                                <Eye className="h-8 w-8 text-white mb-1" />
                                <span className="text-[10px] font-bold text-white">PREVIEW</span>
                              </div>
                            </div>
                          )}
                        </button>
                      ) : (
                        <div className="aspect-[3/4] bg-muted/50 rounded-xl flex items-center justify-center text-[10px] text-muted-foreground italic border border-dashed">
                          Missing
                        </div>
                      )}
                      <p className="text-[10px] uppercase font-bold text-center text-muted-foreground">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Marketplace Overrides Section */}
            {vendor.status === 'approved' && (
              <div className="space-y-6 pt-6 border-t animate-in fade-in duration-300">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  B2B Overrides & Custom Fees
                </h4>
                
                <div className="space-y-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cancellation Window (Days)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 7 (Global)"
                        className="font-bold bg-background h-9 text-xs" 
                        value={overrideCancellationDays}
                        onChange={(e) => setOverrideCancellationDays(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Escrow Confirmation Rate (%)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 30 (Global)"
                        className="font-bold bg-background h-9 text-xs" 
                        value={overrideEscrowRate}
                        onChange={(e) => setOverrideEscrowRate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Vendor Payer Fee Route</Label>
                    <div className="flex gap-2">
                      {[
                        { id: 'seller_deduct', label: 'Seller Deducts' },
                        { id: 'buyer_add', label: 'Buyer Adds' },
                        { id: 'split_both', label: 'Split both' }
                      ].map((route) => (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => setCommissionPayerRoute(route.id as any)}
                          className={`flex-1 py-1.5 rounded-lg border text-center text-[10px] font-bold uppercase tracking-wider transition-all ${
                            commissionPayerRoute === route.id
                              ? 'border-indigo-600 bg-indigo-600/10 text-indigo-700 font-extrabold'
                              : 'bg-background hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {route.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Commission Structure</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCommissionType('percentage')}
                        className={`flex-1 py-1.5 rounded-lg border text-center text-[10px] font-bold uppercase tracking-wider transition-all ${
                          commissionType === 'percentage'
                            ? 'border-indigo-600 bg-indigo-600/10 text-indigo-700 font-extrabold'
                            : 'bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommissionType('tiered')}
                        className={`flex-1 py-1.5 rounded-lg border text-center text-[10px] font-bold uppercase tracking-wider transition-all ${
                          commissionType === 'tiered'
                            ? 'border-indigo-600 bg-indigo-600/10 text-indigo-700 font-extrabold'
                            : 'bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        Tiered
                      </button>
                    </div>
                  </div>

                  {commissionType === 'percentage' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Percentage Rate (%)</Label>
                        <div className="relative">
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input 
                            type="number" 
                            step="0.1" 
                            className="pr-8 font-bold bg-background h-9 text-xs" 
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Minimum Cap (₹)</Label>
                        <Input 
                          type="number" 
                          className="font-bold bg-background h-9 text-xs" 
                          value={commissionMinCap}
                          onChange={(e) => setCommissionMinCap(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {commissionType === 'tiered' && (
                    <div className="p-3 bg-background border border-dashed rounded-xl mt-2 animate-in fade-in duration-200">
                      <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center">
                        This vendor will follow the custom tiered quantity milestones configured in their vendor profile rules or falls back to system global tiers.
                      </p>
                    </div>
                  )}

                  <Button 
                    type="button" 
                    onClick={handleSaveOverrides}
                    disabled={isSavingOverrides}
                    className="w-full mt-4 h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2"
                  >
                    {isSavingOverrides ? 'Applying Overrides...' : (
                      <>
                        <Save className="h-4 w-4" />
                        Apply Override Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="p-6 border-t bg-background sticky bottom-0 z-10 sm:flex-row gap-3">
            <Button
              variant="ghost"
              className="flex-1 h-12 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            {vendor.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive border-destructive hover:bg-destructive/10 h-12 rounded-xl"
                  onClick={() => setIsRejecting(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 h-12 rounded-xl"
                  onClick={() => onApprove?.(vendor.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}

            {vendor.status === 'rejected' && (
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl border-amber-500 text-amber-600 hover:bg-amber-50"
                onClick={() => onReject?.(vendor.id, 'reset')} // We'll handle 'reset' as moving back to pending
              >
                <Clock className="h-4 w-4 mr-2" />
                Reset to Pending
              </Button>
            )}

            {vendor.status === 'approved' && (
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl border-destructive text-destructive hover:bg-destructive/5"
                onClick={() => setIsRejecting(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Revoke Approval
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Document Image Preview Modal */}
      <Dialog open={!!imagePreviewUrl} onOpenChange={(open) => !open && setImagePreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/5 border-none">
          <DialogHeader className="p-4 bg-background border-b">
            <DialogTitle>{imagePreviewTitle}</DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center min-h-[400px]">
            {imagePreviewUrl && (
              imagePreviewUrl.endsWith('.pdf') ? (
                <iframe src={imagePreviewUrl} className="w-full h-[75vh] border-0 rounded" title="PDF Preview" />
              ) : (
                <img
                  src={imagePreviewUrl}
                  alt={imagePreviewTitle}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl bg-white"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Rejection Reason Modal */}
      <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Please provide a reason for rejecting this vendor application. This will be visible to the vendor.</label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                placeholder="e.g. Invalid GST Certificate, documents are not clear, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setIsRejecting(false)}>Cancel</Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!rejectionReason.trim() || isSubmittingReject}
              onClick={async () => {
                setIsSubmittingReject(true);
                await onReject?.(vendor.id, rejectionReason);
                setIsSubmittingReject(false);
                setIsRejecting(false);
                setRejectionReason('');
              }}
            >
              {isSubmittingReject ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
