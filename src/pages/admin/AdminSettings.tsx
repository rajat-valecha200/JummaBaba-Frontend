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
  Database, 
  Save, 
  AlertTriangle,
  MapPin,
  Percent,
  Power,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.admin.getSettings();
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.admin.updateSettings(settings);
      toast({
        title: "Settings Updated",
        description: "Global system configuration has been synchronized.",
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">System Configuration</h1>
        <p className="text-muted-foreground">Manage platform-wide variables and security protocols</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-2xl bg-white/50 backdrop-blur-xl">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-wider">Marketplace Parameters</CardTitle>
                  <CardDescription>Configure core business logic and fees</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Platform Commission (%)</Label>
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

        {/* Sidebar Settings */}
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
