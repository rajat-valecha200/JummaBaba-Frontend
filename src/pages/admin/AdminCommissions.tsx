import { useState, useEffect } from 'react';
import { Save, Percent, Plus, Trash2, Coins, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

// This page used to be a fully separate, self-contained mockup (category-wise commission
// overrides, order-value-range tiers) whose "Save Settings" button never actually called the
// backend at all — it just showed a fake success toast. Admins reasonably found this page via
// the sidebar's "Commissions" link, edited the rate, saved, and nothing ever changed anywhere,
// because none of it was wired up and category-wise commission isn't a real backend concept.
//
// Per instruction: disable that mockup (kept below, commented out, in case the category-wise /
// value-tiered version gets built for real later) and put the ACTUAL working commission control
// — the same "Platform Commission & Payer Routing" card from Admin Settings → Safeguards & Fees
// — directly on this page, so the sidebar link goes straight to something that works.

const DEFAULT_COMMISSION_RULES = {
  type: 'percentage' as 'percentage' | 'tiered',
  rate: 5.0,
  min_cap: 100,
  payer_route: 'seller_deduct' as 'seller_deduct' | 'buyer_add' | 'split_both',
  tiers: [] as { maxQty: number | null; ratePercent: number }[],
};

export default function AdminCommissions() {
  const { toast } = useToast();
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  // Full global_config is fetched and kept intact so saving this card back never clobbers
  // unrelated settings (GST rate, cancellation window, wallet toggle, etc.) — same merge-safe
  // approach as Admin Settings.
  const [globalConfig, setGlobalConfig] = useState<any>({
    commission_rules: DEFAULT_COMMISSION_RULES,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configData = await api.admin.getGlobalConfig();
        if (configData && Object.keys(configData).length > 0) {
          setGlobalConfig((prev: any) => ({
            ...prev,
            ...configData,
            commission_rules: {
              ...DEFAULT_COMMISSION_RULES,
              ...(configData.commission_rules || {}),
            },
          }));
        }
      } catch (err) {
        console.error('Failed to fetch commission config', err);
        toast({ variant: 'destructive', title: 'Failed to load', description: 'Could not fetch the current commission settings.' });
      } finally {
        setFetching(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.admin.updateGlobalConfig(globalConfig);
      toast({ variant: 'success', title: 'Commission Settings Saved', description: 'The platform-wide commission configuration is now live.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTier = () => {
    const currentTiers = globalConfig.commission_rules.tiers || [];
    setGlobalConfig({
      ...globalConfig,
      commission_rules: { ...globalConfig.commission_rules, tiers: [...currentTiers, { maxQty: 500, ratePercent: 2.5 }] },
    });
  };

  const handleRemoveTier = (index: number) => {
    const updatedTiers = (globalConfig.commission_rules.tiers || []).filter((_: any, i: number) => i !== index);
    setGlobalConfig({ ...globalConfig, commission_rules: { ...globalConfig.commission_rules, tiers: updatedTiers } });
  };

  const handleTierChange = (index: number, field: 'maxQty' | 'ratePercent', value: string) => {
    const updatedTiers = (globalConfig.commission_rules.tiers || []).map((tier: any, i: number) =>
      i === index ? { ...tier, [field]: value === '' ? null : Number(value) } : tier
    );
    setGlobalConfig({ ...globalConfig, commission_rules: { ...globalConfig.commission_rules, tiers: updatedTiers } });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Commission Configuration</h1>
          <p className="text-muted-foreground">Platform-wide commission rate charged on every order</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-indigo-600" />
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-wider">Platform Commission & Payer Routing</CardTitle>
              <CardDescription>Dynamically allocate fees and volume tiers. Applies to every vendor unless they have a custom override set in their vendor profile.</CardDescription>
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
                    commission_rules: { ...globalConfig.commission_rules, payer_route: route.id }
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
                onClick={() => setGlobalConfig({ ...globalConfig, commission_rules: { ...globalConfig.commission_rules, type: 'percentage' } })}
              >
                Flat Percentage
              </Button>
              <Button
                type="button"
                variant={globalConfig.commission_rules.type === 'tiered' ? 'default' : 'outline'}
                className="font-bold text-xs uppercase tracking-wider"
                onClick={() => setGlobalConfig({ ...globalConfig, commission_rules: { ...globalConfig.commission_rules, type: 'tiered' } })}
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
                      commission_rules: { ...globalConfig.commission_rules, rate: parseFloat(e.target.value) || 0 }
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
                    commission_rules: { ...globalConfig.commission_rules, min_cap: parseFloat(e.target.value) || 0 }
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

      <p className="text-xs text-muted-foreground text-center">
        Need per-vendor rates instead? Set those from that vendor's card in <span className="font-semibold">Vendor Management</span>.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * DISABLED — old mockup, kept for reference in case category-wise commission
 * and order-value-range tiers get built for real later. This never actually
 * saved anything: "Save Settings" only showed a fake success toast, never
 * called the backend, and category-wise commission has no backend support
 * at all (no per-category resolution exists in billingService).
 *
import { useState, useEffect } from 'react';
import { Save, Percent, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface CategoryCommission {
  categoryId: string;
  categoryName: string;
  commissionRate: number;
  useGlobal: boolean;
}

function LegacyAdminCommissionsMockup() {
  const { toast } = useToast();

  const [globalCommission, setGlobalCommission] = useState(5);
  const [minCommission, setMinCommission] = useState(100);
  const [enableTieredCommission, setEnableTieredCommission] = useState(false);

  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [categoryCommissions, setCategoryCommissions] = useState<CategoryCommission[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/categories/public`);
        if (res.ok) {
          const cats = await res.json();
          setDbCategories(cats);
          setCategoryCommissions(cats.map((cat: any) => ({
            categoryId: cat.id,
            categoryName: cat.name,
            commissionRate: 5,
            useGlobal: true,
          })));
        }
      } catch (e) {
        console.error('Commissions cat fetch failed');
      }
    };
    fetchCats();
  }, []);

  const [tierRates, setTierRates] = useState([
    { minAmount: 0, maxAmount: 100000, rate: 5 },
    { minAmount: 100000, maxAmount: 500000, rate: 4.5 },
    { minAmount: 500000, maxAmount: 1000000, rate: 4 },
    { minAmount: 1000000, maxAmount: null, rate: 3.5 },
  ]);

  const handleCategoryRateChange = (categoryId: string, rate: number) => {
    setCategoryCommissions(prev =>
      prev.map(cat =>
        cat.categoryId === categoryId
          ? { ...cat, commissionRate: rate }
          : cat
      )
    );
  };

  const handleCategoryUseGlobalToggle = (categoryId: string) => {
    setCategoryCommissions(prev =>
      prev.map(cat =>
        cat.categoryId === categoryId
          ? { ...cat, useGlobal: !cat.useGlobal }
          : cat
      )
    );
  };

  const handleTierRateChange = (index: number, rate: number) => {
    setTierRates(prev =>
      prev.map((tier, i) =>
        i === index ? { ...tier, rate } : tier
      )
    );
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Commission configuration has been updated successfully.",
    });
  };

  const handleResetToDefaults = () => {
    setGlobalCommission(5);
    setMinCommission(100);
    setEnableTieredCommission(false);
    setCategoryCommissions(
      dbCategories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        commissionRate: 5,
        useGlobal: true,
      }))
    );
    toast({
      title: "Reset Complete",
      description: "Commission settings have been reset to defaults.",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '∞';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Commission Configuration</h1>
          <p className="text-muted-foreground">Manage platform commission rates for vendors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Global Commission Settings
          </CardTitle>
          <CardDescription>
            Default commission rates applied to all categories unless overridden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="global-rate">Default Commission Rate (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="global-rate"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={globalCommission}
                  onChange={(e) => setGlobalCommission(parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This rate is applied to all orders unless a category-specific rate is set</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-commission">Minimum Commission (₹)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">₹</span>
                <Input
                  id="min-commission"
                  type="number"
                  min="0"
                  step="10"
                  value={minCommission}
                  onChange={(e) => setMinCommission(parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Minimum commission charged per order regardless of percentage</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tiered Commission Rates</Label>
              <p className="text-sm text-muted-foreground">
                Enable volume-based commission tiers for high-value orders
              </p>
            </div>
            <Switch
              checked={enableTieredCommission}
              onCheckedChange={setEnableTieredCommission}
            />
          </div>

          {enableTieredCommission && (
            <div className="bg-muted/50 rounded-lg p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Value Range</TableHead>
                    <TableHead className="w-32">Commission Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tierRates.map((tier, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatCurrency(tier.minAmount)} - {formatCurrency(tier.maxAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={tier.rate}
                            onChange={(e) => handleTierRateChange(index, parseFloat(e.target.value) || 0)}
                            className="w-16 h-8"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category-wise Commission Rates</CardTitle>
          <CardDescription>
            Override global rates for specific categories. Toggle "Use Global" to apply the default rate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Use Global</TableHead>
                <TableHead className="w-40">Custom Rate</TableHead>
                <TableHead className="text-right">Effective Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryCommissions.map((cat) => (
                <TableRow key={cat.categoryId}>
                  <TableCell className="font-medium">{cat.categoryName}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={cat.useGlobal}
                      onCheckedChange={() => handleCategoryUseGlobalToggle(cat.categoryId)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={cat.commissionRate}
                        onChange={(e) => handleCategoryRateChange(cat.categoryId, parseFloat(e.target.value) || 0)}
                        disabled={cat.useGlobal}
                        className="w-16 h-8"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={cat.useGlobal ? "secondary" : "default"}>
                      {cat.useGlobal ? globalCommission : cat.commissionRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Commission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Global Rate</p>
              <p className="text-2xl font-bold text-primary">{globalCommission}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Categories with Custom Rates</p>
              <p className="text-2xl font-bold text-primary">
                {categoryCommissions.filter(c => !c.useGlobal).length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tiered Pricing</p>
              <p className="text-2xl font-bold text-primary">
                {enableTieredCommission ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
 * ──────────────────────────────────────────────────────────────────────── */
