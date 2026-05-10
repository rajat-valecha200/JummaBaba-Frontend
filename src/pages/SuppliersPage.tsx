import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  MapPin,
  Loader2,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SupplierCard } from '@/components/b2b/SupplierCard';
import { apiFetch, normalizeProfile } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function SuppliersPage() {
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/public/suppliers');
      if (Array.isArray(data)) {
        setDbSuppliers(data.map((s: any) => {
          const normalized = normalizeProfile(s);
          return {
            ...normalized,
            location: s.location || 'Maharashtra',
            state: s.state || 'India',
            yearEstablished: s.established_year || 2012,
            rating: 4.8,
            totalProducts: Number(s.total_products) || 0,
            gstVerified: !!s.gst_number,
            businessType: s.business_type || 'Manufacturer'
          };
        }));
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    return dbSuppliers.filter(s => {
      const matchesSearch = !searchTerm || 
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.businessType?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = !selectedState || s.location === selectedState;
      return matchesSearch && matchesState;
    });
  }, [dbSuppliers, searchTerm, selectedState]);

  const allStates = Array.from(new Set(dbSuppliers.map(s => s.location).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-card border-b py-4">
        <div className="b2b-container">
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-bold">Verified Suppliers</span>
          </nav>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-white border-b py-10">
        <div className="b2b-container">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
              <Users className="h-3.5 w-3.5" />
              Supplier Directory
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tighter">
              Verified Industrial <span className="text-primary italic">Manufacturers.</span>
            </h1>
            <p className="text-lg text-zinc-600 font-medium mb-8">
              Connect directly with reliable suppliers, factories, and wholesalers across India.
            </p>

            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input 
                placeholder="Search by company name or business type..."
                className="pl-12 h-14 text-base border-zinc-200 focus:border-primary shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="b2b-container py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border p-6 sticky top-24 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="h-4 w-4 text-primary" />
                <h2 className="font-bold uppercase text-xs tracking-widest">Filter By Region</h2>
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedState(null)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    !selectedState ? "bg-primary text-white shadow-md shadow-primary/20" : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  All Regions
                </button>
                {allStates.map(state => (
                  <button
                    key={state}
                    onClick={() => setSelectedState(state)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      selectedState === state ? "bg-primary text-white shadow-md shadow-primary/20" : "text-zinc-600 hover:bg-zinc-100"
                    )}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Suppliers Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                Showing <span className="text-black">{filteredSuppliers.length}</span> verified suppliers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSuppliers.map(supplier => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>

            {filteredSuppliers.length === 0 && (
              <div className="bg-white rounded-3xl border p-12 text-center shadow-sm">
                <Users className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Suppliers Found</h3>
                <p className="text-zinc-500 mb-6">Try adjusting your search or filters to find more results.</p>
                <Button onClick={() => { setSearchTerm(''); setSelectedState(null); }} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
