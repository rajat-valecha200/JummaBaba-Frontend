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

export default function AdminCommissions() {
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

      {/* Global Settings */}
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

      {/* Category-wise Settings */}
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

      {/* Commission Summary */}
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
