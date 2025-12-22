import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (productId: string, productName?: string) => void;
  removeFromWishlist: (productId: string, productName?: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string, productName?: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('jummababa_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();

  const saveToStorage = (items: string[]) => {
    localStorage.setItem('jummababa_wishlist', JSON.stringify(items));
  };

  const addToWishlist = (productId: string, productName?: string) => {
    if (!wishlist.includes(productId)) {
      const newWishlist = [...wishlist, productId];
      setWishlist(newWishlist);
      saveToStorage(newWishlist);
      toast({
        title: "Added to Wishlist",
        description: productName ? `${productName} has been saved to your wishlist.` : "Product saved to wishlist.",
      });
    }
  };

  const removeFromWishlist = (productId: string, productName?: string) => {
    const newWishlist = wishlist.filter(id => id !== productId);
    setWishlist(newWishlist);
    saveToStorage(newWishlist);
    toast({
      title: "Removed from Wishlist",
      description: productName ? `${productName} has been removed from your wishlist.` : "Product removed from wishlist.",
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const toggleWishlist = (productId: string, productName?: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlist(productId, productName);
    } else {
      addToWishlist(productId, productName);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    saveToStorage([]);
    toast({
      title: "Wishlist Cleared",
      description: "All items have been removed from your wishlist.",
    });
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
