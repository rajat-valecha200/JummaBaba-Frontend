import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  ShoppingCart, 
  MessageSquare, 
  User,
  FileText,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { categories } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      {/* Top bar */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="b2b-container py-1.5 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1">
              <Phone className="h-3 w-3" />
              +91 1800-XXX-XXXX
            </span>
            <span>India's #1 B2B Marketplace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/vendor/register" className="hover:underline">
              Sell on Jummababa
            </Link>
            <Link to="/help" className="hidden sm:block hover:underline">
              Help
            </Link>
          </div>
        </div>
      </div>

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
                  {categories.map(cat => (
                    <Link 
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      className="block py-1.5 pl-2 hover:text-primary"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
                <div className="pt-4 border-t space-y-2">
                  <Link to="/login" className="block py-2">Login</Link>
                  <Link to="/register" className="block py-2">Register</Link>
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
            <div className="relative w-full flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-r-none border-r-0 px-3">
                    All Categories
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {categories.map(cat => (
                    <DropdownMenuItem key={cat.id} asChild>
                      <Link to={`/category/${cat.slug}`}>{cat.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder="Search products or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-none flex-1"
              />
              <Button className="rounded-l-none">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {/* Mobile search toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link to="/messages">
                <MessageSquare className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link to="/buyer/cart">
                <ShoppingCart className="h-5 w-5" />
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/login">Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/register">Register as Buyer</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/vendor/register">Register as Seller</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/buyer/dashboard">Buyer Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/vendor/dashboard">Vendor Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin">Admin Panel</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild className="hidden sm:flex">
              <Link to="/post-requirement">
                <FileText className="h-4 w-4 mr-2" />
                Post Requirement
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        {isSearchOpen && (
          <div className="mt-3 md:hidden">
            <div className="relative flex">
              <Input
                placeholder="Search products or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-r-none flex-1"
              />
              <Button className="rounded-l-none">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Category navigation - Desktop */}
      <nav className="hidden lg:block border-t bg-muted/30">
        <div className="b2b-container">
          <ul className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            {categories.map(cat => (
              <li key={cat.id}>
                <Link
                  to={`/category/${cat.slug}`}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors',
                    'hover:bg-primary/10 hover:text-primary',
                    isActive(`/category/${cat.slug}`) && 'bg-primary/10 text-primary'
                  )}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
