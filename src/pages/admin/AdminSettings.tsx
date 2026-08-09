import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  ShieldCheck, 
  Globe, 
  Bell, 
  Save, 
  AlertTriangle,
  MapPin,
  Percent,
  Loader2,
  Sliders,
  Wallet,
  Clock,
  Coins,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'system' | 'safeguards'>('system');
  
  // Organization settings (settings table: admin_org_details)
  const [settings, setSettings] = useState({
    commission: '5.0',
    gstNumber: '07AAAAA0000A1Z5',
    location: 'Gurugram, Haryana, India',
    supportEmail: 'support@jummababa.com',
    supportPhone: '+91 99999 00000',
    whatsappNumber: '+91 99999 00000',
    metaDescription: "JummaBaba.com - India's Premium Industrial B2B Marketplace connecting verified suppliers with global buyers.",
    maintenance_mode: false
  });

  // Advanced configurations (settings table: global_config)
  const [globalConfig, setGlobalConfig] = useState({
    cancellation_window_days: 7,
    commission_rules: {
      type: 'percentage', // 'percentage' | 'tiered'
      rate: 5.0,
      min_cap: 100,
      payer_route: 'seller_deduct', // 'seller_deduct' | 'buyer_add' | 'split_both'
      tiers: [
        { maxQty: 50, ratePercent: 8.0 },
        { maxQty: 200, ratePercent: 5.0 },
        { maxQty: null, ratePercent: 3.0 }
      ]
    },
    escrow_confirmation_rate: 30.00,
    wallet_enabled: true,
    trial_mode_enabled: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsData, configData] = await Promise.all([
          api.admin.getSettings(),
          api.admin.getGlobalConfig()
        ]);
        
        if (settingsData && Object.keys(settingsData).length > 0) {
          setSettings(prev => ({ ...prev, ...settingsData }));
        }
        
        if (configData && Object.keys(configData).length > 0) {
          setGlobalConfig(prev => ({
            ...prev,
            ...configData,
            commission_rules: {
              ...prev.commission_rules,
              ...(configData.commission_rules || {})
            }
          }));
        }
      } catch (err) {
        console.error('Failed to fetch settings / configurations', err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        api.admin.updateSettings(settings),
        api.admin.updateGlobalConfig(globalConfig)
      ]);
      toast({
        title: "Configuration Synchronized",
        description: "Core marketplace settings and safeguards have been committed successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = () => {
    const currentTiers = globalConfig.commission_rules.tiers || [];
    const updatedTiers = [
      ...currentTiers,
      { maxQty: 500, ratePercent: 2.5 }
    ];
    setGlobalConfig({
      ...globalConfig,
      commission_rules: {
        ...globalConfig.commission_rules,
        tiers: updatedTiers
      }
    });
  };

  const handleRemoveTier = (index: number) => {
    const updatedTiers = (globalConfig.commission_rules.tiers || []).filter((_, i) => i !== index);
    setGlobalConfig({
      ...globalConfig,
      commission_rules: {
        ...globalConfig.commission_rules,
        tiers: updatedTiers
      }
    });
  };

  const handleTierChange = (index: number, field: 'maxQty' | 'ratePercent', value: string) => {
    const updatedTiers = (globalConfig.commission_rules.tiers || []).map((tier, i) => {
      if (i === index) {
        return {
          ...tier,
          [field]: value === '' ? null : Number(value)
        };
      }
      return tier;
    });
    setGlobalConfig({
      ...globalConfig,
      commission_rules: {
        ...globalConfig.commission_rules,
        tiers: updatedTiers
      }
    });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">System Configuration</h1>
          <p className="text-muted-foreground">Manage platform-wide variables, commissions, and transaction safeguards</p>
        </div>

        {/* Tab Toggle */}
        <div className="bg-muted p-1 rounded-xl flex gap-1 self-start md:self-auto">
          <Button
            variant={activeTab === 'system' ? 'default' : 'ghost'}
            className="rounded-lg font-bold text-xs uppercase tracking-wider"
            onClick={() => setActiveTab('system')}
          >
            <Settings className="h-4 w-4 mr-2" />
            System & Identity
          </Button>
          <Button
            variant={activeTab === 'safeguards' ? 'default' : 'ghost'}
            className="rounded-lg font-bold text-xs uppercase tracking-wider"
            onClick={() => setActiveTab('safeguards')}
          >
            <Sliders className="h-4 w-4 mr-2" />
            Safeguards & Fees
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TAB 1: SYSTEM & IDENTITY */}
          {activeTab === 'system' && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
              <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl">
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-wider">Marketplace Parameters</CardTitle>
                      <CardDescription>Configure core legacy metrics and identifiers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Platform Commission (Legacy, %)</Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-10 font-bold" 
                          value={settings.commission} 
                          onChange={(e) => setSettings({...settings, commission: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">GST Number (India)</Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-10 font-bold uppercase" 
                          value={settings.gstNumber} 
                          onChange={(e) => setSettings({...settings, gstNumber: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Primary Business Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-10 font-bold" 
                        value={settings.location} 
                        onChange={(e) => setSettings({...settings, location: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trial Mode Switch */}
              <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-emerald-600" />
                      <div>
                        <CardTitle className="text-lg font-black uppercase tracking-wider">Seller Registration Trial Mode</CardTitle>
                        <CardDescription>Make seller registration steps optional dynamically</CardDescription>
                      </div>
                    </div>
                    <Switch 
                      checked={globalConfig.trial_mode_enabled} 
                      onCheckedChange={(checked) => setGlobalConfig({...globalConfig, trial_mode_enabled: checked})}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    When enabled, a "Trial Mode" badge is displayed on the seller registration wizard and validations for business/bank details (GST, PAN, bank account, etc.) are bypassed to allow rapid onboarding.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl">
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-wider">Identity & Branding</CardTitle>
                      <CardDescription>Control how the world sees JummaBaba</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Support Email</Label>
                    <Input 
                      className="font-bold" 
                      value={settings.supportEmail} 
                      onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Support Phone</Label>
                      <Input 
                        className="font-bold" 
                        value={settings.supportPhone} 
                        onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">WhatsApp Business</Label>
                      <Input 
                        className="font-bold" 
                        value={settings.whatsappNumber} 
                        onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Platform Meta Description</Label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 rounded-lg border bg-background font-medium text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={settings.metaDescription}
                      onChange={(e) => setSettings({...settings, metaDescription: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: SAFEGUARDS & FEES */}
          {activeTab === 'safeguards' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              
              {/* Wallet System Switch */}
              <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg font-black uppercase tracking-wider">Double-Entry Wallet System</CardTitle>
                        <CardDescription>Global toggle to enable or disable buyer/seller wallets</CardDescription>
                      </div>
                    </div>
                    <Switch 
                      checked={globalConfig.wallet_enabled} 
                      onCheckedChange={(checked) => setGlobalConfig({...globalConfig, wallet_enabled: checked})}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    When enabled, buyers can maintain a digital wallet to checkout instantly, and sellers receive escrow releases directly to their account balances.
                  </p>
                  {!globalConfig.wallet_enabled && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-700">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold">Caution:</span> Outstanding active balances must be fully settled before disabling. The backend will block disabling if active funds exist.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Escrow and Cancellation Timelines */}
              <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-orange-500" />
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-wider">Escrow & Cancellation Deadlines</CardTitle>
                      <CardDescription>Lock-in periods and material funding percentages</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Default Cancellation Window (Days)</Label>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number" 
                          min="0"
                          max="90"
                          className="font-bold" 
                          value={globalConfig.cancellation_window_days} 
                          onChange={(e) => setGlobalConfig({...globalConfig, cancellation_window_days: parseInt(e.target.value, 10) || 0})}
                        />
                        <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-500/20">Days</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Period after quote acceptance within which a buyer can cancel for a refund. After this, cancellation refunds are blocked.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Upfront Escrow Payout (Stage-1 %)</Label>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number" 
                          min="0"
                          max="100"
                          className="font-bold" 
                          value={globalConfig.escrow_confirmation_rate} 
                          onChange={(e) => setGlobalConfig({...globalConfig, escrow_confirmation_rate: parseFloat(e.target.value) || 0})}
                        />
                        <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20">%</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        The initial confirmation amount released to the seller upon order conversion to fund bulk raw materials (invisible to buyer).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Flexible Commission Engine */}
              <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-indigo-600" />
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-wider">Platform Commission & Payer Routing</CardTitle>
                      <CardDescription>Dynamically allocate fees and volume tiers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  
                  {/* Payer Route */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Fee Distribution / Payer Route</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {[
                        { id: 'seller_deduct', label: 'Seller Pays (Deduction)', desc: 'Fee is withheld from final vendor payout' },
                        { id: 'buyer_add', label: 'Buyer Pays (Addition)', desc: 'Appended as platform fee on buyer invoice' },
                        { id: 'split_both', label: 'Split equally (50-50)', desc: 'Split evenly between buyer and seller' }
                      ].map((route) => (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => setGlobalConfig({
                            ...globalConfig,
                            commission_rules: {
                              ...globalConfig.commission_rules,
                              payer_route: route.id
                            }
                          })}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            globalConfig.commission_rules.payer_route === route.id
                              ? 'border-indigo-600 bg-indigo-500/5 ring-1 ring-indigo-500'
                              : 'hover:border-muted-foreground/30 bg-background/50'
                          }`}
                        >
                          <span className="text-xs font-black uppercase tracking-wider">{route.label}</span>
                          <span className="text-[10px] text-muted-foreground font-medium mt-1 leading-tight">{route.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assessment Type */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Commission Calculation Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={globalConfig.commission_rules.type === 'percentage' ? 'default' : 'outline'}
                        className="font-bold text-xs uppercase tracking-wider"
                        onClick={() => setGlobalConfig({
                          ...globalConfig,
                          commission_rules: {
                            ...globalConfig.commission_rules,
                            type: 'percentage'
                          }
                        })}
                      >
                        Flat Percentage
                      </Button>
                      <Button
                        type="button"
                        variant={globalConfig.commission_rules.type === 'tiered' ? 'default' : 'outline'}
                        className="font-bold text-xs uppercase tracking-wider"
                        onClick={() => setGlobalConfig({
                          ...globalConfig,
                          commission_rules: {
                            ...globalConfig.commission_rules,
                            type: 'tiered'
                          }
                        })}
                      >
                        Tiered Volume Pricing
                      </Button>
                    </div>
                  </div>

                  {/* FLAT RATE DETAILS */}
                  {globalConfig.commission_rules.type === 'percentage' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-xl border animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Flat Commission Rate (%)</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            step="0.1" 
                            className="pl-10 font-bold" 
                            value={globalConfig.commission_rules.rate} 
                            onChange={(e) => setGlobalConfig({
                              ...globalConfig,
                              commission_rules: {
                                ...globalConfig.commission_rules,
                                rate: parseFloat(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Minimum Cap Charge per Deal (₹)</Label>
                        <Input 
                          type="number" 
                          className="font-bold" 
                          value={globalConfig.commission_rules.min_cap} 
                          onChange={(e) => setGlobalConfig({
                            ...globalConfig,
                            commission_rules: {
                              ...globalConfig.commission_rules,
                              min_cap: parseFloat(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {/* TIERED RATE DETAILS */}
                  {globalConfig.commission_rules.type === 'tiered' && (
                    <div className="space-y-4 p-4 bg-muted/20 rounded-xl border animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Quantity-Based Tiers</Label>
                        <Button 
                          size="sm" 
                          onClick={handleAddTier}
                          className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider animate-in fade-in duration-200"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Tier
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {(globalConfig.commission_rules.tiers || []).map((tier: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 bg-background/50 p-2.5 rounded-lg border border-dashed animate-in slide-in-from-top-2 duration-200">
                            <span className="text-xs font-bold text-muted-foreground shrink-0 w-16">Tier #{index + 1}</span>
                            
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-[10px] font-black text-muted-foreground uppercase shrink-0">Up to Qty:</span>
                              <Input 
                                type="number" 
                                placeholder="Unlimited"
                                className="h-8 text-xs font-bold" 
                                value={tier.maxQty || ''} 
                                onChange={(e) => handleTierChange(index, 'maxQty', e.target.value)}
                              />
                            </div>

                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-[10px] font-black text-muted-foreground uppercase shrink-0">Rate %:</span>
                              <Input 
                                type="number" 
                                step="0.1" 
                                className="h-8 text-xs font-bold" 
                                value={tier.ratePercent} 
                                onChange={(e) => handleTierChange(index, 'ratePercent', e.target.value)}
                              />
                            </div>

                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-destructive h-8 w-8 hover:bg-destructive/10"
                              onClick={() => handleRemoveTier(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {(globalConfig.commission_rules.tiers || []).length === 0 && (
                          <div className="text-center py-4 text-xs italic text-muted-foreground">
                            No tiers added. Click 'Add Tier' to create quantity milestones.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>

            </div>
          )}

        </div>

        {/* Sidebar Panel */}
        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Bell className="h-5 w-5" />
                <CardTitle className="text-lg font-black uppercase tracking-wider">Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Email Alerts</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Admin Activity Logs</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">New Vendor SMS</Label>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl relative overflow-hidden">
            <CardHeader className="bg-destructive/5 border-b pb-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-sm font-black uppercase tracking-wider">Disaster Recovery</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black">Maintenance Mode</Label>
                  <p className="text-[10px] text-muted-foreground">Block all buyer & seller operations</p>
                </div>
                <Switch 
                  checked={settings.maintenance_mode} 
                  onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="shadow-2xl shadow-primary/40 px-8 h-14 rounded-full font-black uppercase tracking-[0.2em] animate-in slide-in-from-bottom-4 duration-500"
        >
          {loading ? "Synchronizing..." : (
            <>
              <Save className="h-5 w-5 mr-3" />
              Commit Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
