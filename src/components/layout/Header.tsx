import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, ChevronDown, ChevronRight, ChevronLeft, ShoppingCart, MessageSquare, User, FileText, Phone, Globe, LayoutGrid, Package, ShieldCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/use-debounce';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const isSearching = searchQuery !== debouncedSearchQuery;
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const fetchCats = async () => {
      try {
        setDbCategories(await api.categories.list());
      } catch (e) {
        console.error('Failed Header cat fetch');
      }
    };
    fetchCats();
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 180);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showHeaderSearch = location.pathname !== '/' || isScrolled;

  // Live search effect
  useEffect(() => {
    const isMarketplacePage = location.pathname === '/products' || location.pathname.startsWith('/category/');
    if (isMarketplacePage && debouncedSearchQuery.trim()) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('q', debouncedSearchQuery);
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }
  }, [debouncedSearchQuery, navigate, location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs relative">
      {/* Brand accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-slate-900 via-b2b-gst to-primary" />
    {/* Top bar */}
    {/* <div className="bg-secondary text-secondary-foreground">
      <div className="b2b-container py-1.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1">
            <Phone className="h-3 w-3" />
            +91 1800-XXX-XXXX
          </span>
          <span>India's #1 B2B Marketplace</span>
        </div>
        <div className="flex items-center gap-4">
          {(!user || user.role === 'buyer') && (
            <Link to="/vendor/register" className="hover:underline">
              Sell on <span className="font-semibold"><span className="font-extrabold text-black">J</span>umma<span className='text-b2b-gst'><span className="font-extrabold">B</span>aba</span><span className="text-b2b-orange">.com</span></span>
            </Link>
          )}
          <Link to="/help" className="hidden sm:block hover:underline">
            Help
          </Link>
        </div>
      </div>
    </div> */}

    {/* Main header */}
    <div className="b2b-container py-3">
      <div className="flex items-center gap-4">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 space-y-4">
              <Link to="/" className="block py-2 font-medium">Home</Link>
              <div className="space-y-2">
                <p className="font-semibold text-muted-foreground text-sm">Categories</p>
                {dbCategories.map(cat => <Link key={cat.id} to={`/category/${cat.slug}`} className="block py-1.5 pl-2 hover:text-primary">
                  {cat.name}
                </Link>)}
              </div>
              <div className="pt-4 border-t space-y-2">
                {!user ? (
                  <>
                    <Link to="/login" className="block py-2">Login</Link>
                    <Link to="/register" className="block py-2">Register</Link>
                  </>
                ) : (
                  <>
                    <div className="py-2 font-medium text-sm text-muted-foreground border-b mb-2">Welcome, {user.full_name || user.email.split('@')[0]}</div>
                    <Link to="/" className="block py-2 text-primary font-bold">
                      Browse Marketplace
                    </Link>
                    <Link to={user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/vendor/dashboard' : user.role === 'employee' ? '/employee/dashboard' : '/buyer/dashboard'} className="block py-2">
                      My Dashboard
                    </Link>
                    <button onClick={signOut} className="block w-full text-left py-2 text-destructive">Logout</button>
                  </>
                )}
                <Link to="/suppliers" className="block py-2 text-primary font-medium">
                  Verified Manufacturers
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <h1>
            <Logo size="md" />
          </h1>
        </Link>

        {/* Center Group: Scrolled Search Bar with All Categories Dropdown, or Top Trust & Category Navigation */}
        {showHeaderSearch ? (
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto transition-all duration-300 animate-in fade-in zoom-in-95">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
              className="relative w-full flex items-center bg-white rounded-full border-2 border-primary/90 shadow-sm hover:shadow-md transition-shadow p-1 pl-2"
            >
              {/* All Categories dropdown inside the search bar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-primary px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors border-r border-slate-200 shrink-0"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate max-w-[120px]">{selectedCategoryName || 'All Categories'}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCategoryName('');
                      navigate('/products');
                    }}
                    className="cursor-pointer font-bold text-xs"
                  >
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {dbCategories.map(cat => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryName(cat.name);
                        navigate(`/category/${cat.slug}`);
                      }}
                      className="cursor-pointer text-xs"
                    >
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Input
                placeholder="Search products or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 border-0 bg-transparent text-xs sm:text-sm focus-visible:ring-0 px-3 placeholder:text-slate-400"
              />
              {isSearching && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              )}
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white shrink-0 shadow-sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex items-center justify-center flex-1 mx-4 transition-all duration-300">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-slate-50/80 border border-slate-200/80 shadow-2xs">
              {/* Category dropdown at initial state */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 hover:text-primary hover:bg-white transition-all group"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                    <span>All Categories</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                  <DropdownMenuItem onClick={() => navigate('/products')} className="cursor-pointer font-bold text-xs">
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {dbCategories.map(cat => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => navigate(`/category/${cat.slug}`)}
                      className="cursor-pointer text-xs"
                    >
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="h-3.5 w-[1px] bg-slate-200" />

              <Link
                to="/suppliers"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white transition-all group"
                title="Audited GST Registered Suppliers"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                <span className="font-bold text-slate-900">100% GST-Audited</span>
              </Link>

              <span className="h-3.5 w-[1px] bg-slate-200" />

              <Link
                to="/terms"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-white transition-all group"
                title="Protected Escrow Payments"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-900">Escrow Protected</span>
              </Link>

              <span className="h-3.5 w-[1px] bg-slate-200" />

              <Link
                to="/terms"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 hover:text-primary hover:bg-white transition-all group"
                title="Trade Assurance Wholesale Protection"
              >
                <Shield className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                <span>Trade Assurance</span>
              </Link>
            </div>
          </div>
        )}

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {/* Mobile search toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {user && (
            <Button variant="ghost" size="icon" asChild title="Messages">
              <Link to={user.role === 'vendor' ? '/vendor/messages' : '/buyer/messages'}>
                <MessageSquare className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {!user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="font-semibold text-xs text-slate-700 hover:text-primary">
                <Link to="/login">Sign in</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="rounded-full font-bold text-xs px-4 h-8 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/95 hover:to-orange-600/95 text-white shadow-sm shadow-orange-500/20 flex items-center gap-1.5 transition-all">
                    <span>Create account</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5">
                  <DropdownMenuItem asChild className="cursor-pointer py-2 px-3">
                    <Link to="/register" className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">Register as Buyer</p>
                        <p className="text-[11px] text-muted-foreground">Source wholesale products</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem asChild className="cursor-pointer py-2 px-3">
                    <Link to="/vendor/register" className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">Register as Seller</p>
                        <p className="text-[11px] text-muted-foreground">List products & get orders</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                    {user.email} ({user.role})
                  </div>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'vendor' && (
                    <DropdownMenuItem asChild>
                      <Link to="/vendor/dashboard">Vendor Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'buyer' && (
                    <DropdownMenuItem asChild>
                      <Link to="/buyer/dashboard">Buyer Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'employee' && (
                    <DropdownMenuItem asChild>
                      <Link to="/employee/dashboard">Employee Portal</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role !== 'employee' && (
                    <DropdownMenuItem asChild>
                      <Link to={user.role === 'vendor' ? '/vendor/profile' : '/buyer/profile'}>My Profile</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" asChild className="hidden sm:flex rounded-full font-bold text-xs px-4 h-8 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                <Link to={user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/vendor/dashboard' : '/buyer/dashboard'}>
                  Dashboard
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {isSearchOpen && (
        <div className="mt-3 md:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
            }}
            className="relative flex items-center bg-white rounded-full border-2 border-primary shadow-sm p-1 pl-4"
          >
            <Input
              placeholder="Search products or suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-0 bg-transparent text-xs focus-visible:ring-0 px-0"
            />
            <Button type="submit" size="icon" className="h-8 w-8 rounded-full bg-primary text-white shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  </header>
  );
}
