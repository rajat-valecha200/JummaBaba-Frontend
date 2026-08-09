import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, ChevronDown, ChevronRight, ChevronLeft, ShoppingCart, MessageSquare, User, FileText, Phone } from 'lucide-react';
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
  const location = useLocation();
  const navigate = useNavigate();

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

  const isActive = (path: string) => location.pathname === path;

  // Live search effect
  useEffect(() => {
    const isMarketplacePage = location.pathname === '/products' || location.pathname.startsWith('/category/');
    if (isMarketplacePage && debouncedSearchQuery.trim()) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('q', debouncedSearchQuery);
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }
  }, [debouncedSearchQuery, navigate, location.pathname]);

  return <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
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
                    <Link to={user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/vendor/dashboard' : '/buyer/dashboard'} className="block py-2">
                      My Dashboard
                    </Link>
                    <button onClick={signOut} className="block w-full text-left py-2 text-destructive">Logout</button>
                  </>
                )}
                <Link to="/post-requirement" className="block py-2 text-primary font-medium">
                  Post Your Requirement
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

        {/* Search bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
            }}
            className="relative w-full flex"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="rounded-r-none border-r-0 px-3">
                  All Categories
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {dbCategories.map(cat => <DropdownMenuItem key={cat.id} asChild>
                  <Link to={`/category/${cat.slug}`}>{cat.name}</Link>
                </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative flex-1">
              <Input
                placeholder="Search products or suppliers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="rounded-none pr-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <Button type="submit" className="rounded-l-none">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {/* Mobile search toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" asChild title="Messages">
            <Link to={user?.role === 'vendor' ? '/vendor/messages' : '/buyer/messages'}>
              <MessageSquare className="h-5 w-5" />
            </Link>
          </Button>

          {/* Cart hidden as requested */}
          {/* 
          <Button variant="ghost" size="icon" asChild title="Cart">
            <Link to="/buyer/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>
          */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={user ? "text-primary" : ""}>
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {!user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login">Login</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/register">Register as Buyer</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/vendor/register">Register as Seller</Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
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
                  <DropdownMenuItem asChild>
                    <Link to={user.role === 'vendor' ? '/vendor/profile' : '/buyer/profile'}>My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    Logout
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild className="hidden sm:flex uppercase font-bold tracking-widest shadow-lg">
            <Link to="/post-requirement">
              <FileText className="h-4 w-4 mr-2" />
              Post Requirement
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile search bar */}
      {isSearchOpen && <div className="mt-3 md:hidden">
        <div className="relative flex">
          <Input placeholder="Search products or suppliers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="rounded-r-none flex-1" />
          <Button className="rounded-l-none">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>}
    </div>

    {/* Category navigation - Show only on non-homepage routes */}
    {location.pathname !== '/' && (
      <nav className="border-t bg-white relative group">
        <div className="b2b-container relative flex items-center">
          {/* Left Fade & Scroll Arrow */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/60 to-transparent z-10 flex items-center justify-start pl-4 pointer-events-none group-hover:pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full bg-white shadow-md border border-zinc-200 hover:bg-zinc-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                const container = document.getElementById('category-scroll-container');
                if (container) container.scrollBy({ left: -250, behavior: 'smooth' });
              }}
            >
              <ChevronLeft className="h-4 w-4 text-zinc-600" />
            </Button>
          </div>

          <ul
            id="category-scroll-container"
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 scroll-smooth w-full px-8 sm:px-12"
          >
            {dbCategories.map(cat => (
              <li key={cat.id} className="flex-shrink-0">
                <Link
                  to={`/category/${cat.slug}`}
                  className={cn(
                    'px-4 py-1.5 text-xs font-semibold uppercase tracking-tight rounded-full whitespace-nowrap transition-all duration-200 flex items-center leading-none border border-transparent',
                    'hover:bg-zinc-100 hover:text-primary',
                    isActive(`/category/${cat.slug}`) ? 'bg-primary/5 text-primary border-primary/20' : 'text-zinc-600'
                  )}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Fade & Scroll Arrow */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/60 to-transparent z-10 flex items-center justify-end pr-4 pointer-events-none group-hover:pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full bg-white shadow-md border border-zinc-200 hover:bg-zinc-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                const container = document.getElementById('category-scroll-container');
                if (container) container.scrollBy({ left: 250, behavior: 'smooth' });
              }}
            >
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </Button>
          </div>
        </div>
      </nav>
    )}
  </header>;
}
