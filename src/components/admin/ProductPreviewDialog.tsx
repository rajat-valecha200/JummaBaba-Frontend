import React, { useState } from 'react';
import { Eye, LayoutGrid, FileText, MessageSquare, Info, CheckCircle, XCircle, ChevronLeft, ChevronRight, Package, Truck, ShieldCheck, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/b2b/ProductCard';
import { PricingSlabsTable } from '@/components/b2b/PricingSlabsTable';
import { formatPrice, cn } from '@/lib/utils';

interface ProductPreviewDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: any[];
  supplier?: any;
  mode?: 'admin' | 'vendor';
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function ProductPreviewDialog({ 
  product, 
  open, 
  onOpenChange, 
  categories = [], 
  supplier,
  mode = 'vendor',
  onApprove,
  onReject
}: ProductPreviewDialogProps) {
  const [previewMode, setPreviewMode] = useState<'card' | 'page'>('card');
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || 'https://images.unsplash.com/photo-1582234057117-9c9ae625b035?w=600'];
  const categoriesList = Array.isArray(categories) ? categories : [];
  const categoryName = categoriesList.find(c => String(c.id) === String(product.categoryId || product.category_id))?.name || 'Uncategorized';
  
  // Calculate pricing for detail view
  const slabs = Array.isArray(product.pricingSlabs) ? product.pricingSlabs : [];
  const minTierPrice = slabs.length > 0 
    ? Math.min(...slabs.map((s: any) => s.pricePerUnit || s.price || 0)) 
    : product.minPrice || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] sm:h-[90vh] overflow-hidden p-0 rounded-3xl sm:rounded-[2.5rem] border-none shadow-2xl [&>button]:hidden flex flex-col">
        {/* Accessibility hidden titles */}
        <div className="sr-only">
          <DialogTitle>Product Preview: {product.name}</DialogTitle>
          <DialogDescription>Previewing how the product listing appears on the marketplace.</DialogDescription>
        </div>
        
        <div className="flex flex-col h-full bg-white">
          {/* Header with View Toggles */}
          <div className="p-4 sm:p-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/5 flex items-center justify-center">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none mb-1">Live Preview</h3>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Viewpoint</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                <button 
                  onClick={() => setPreviewMode('card')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all",
                    previewMode === 'card' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Search Card
                </button>
                <button 
                  onClick={() => setPreviewMode('page')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all",
                    previewMode === 'page' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Full Page
                </button>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="rounded-full h-10 w-10 hover:bg-slate-100 transition-colors ml-2"
              >
                <XCircle className="h-6 w-6 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* Scrollable Preview Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto flex justify-center">
              {previewMode === 'card' ? (
                <div className="w-full max-w-[300px] sm:max-w-[320px] animate-in zoom-in-95 duration-300 py-12">
                  <ProductCard 
                    product={product} 
                    supplier={supplier || {
                      isTopSupplier: false,
                      companyName: product.supplierName || 'Verified Supplier'
                    }} 
                  />
                </div>
              ) : (
                <div className="w-full animate-in slide-in-from-bottom-8 duration-500">
                  <div className="grid md:grid-cols-12 gap-0">
                    {/* Left Side: Images */}
                    <div className="md:col-span-5 p-6 sm:p-8 bg-slate-50/50 border-r border-slate-100">
                      <div className="aspect-square rounded-3xl overflow-hidden bg-white shadow-inner mb-4 border border-slate-100 relative group">
                        <img 
                          src={images[selectedImage]} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          alt="Main Preview" 
                        />
                        {images.length > 1 && (
                          <>
                            <button 
                              onClick={() => setSelectedImage(prev => (prev - 1 + images.length) % images.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronLeft className="h-4 w-4 text-slate-700" />
                            </button>
                            <button 
                              onClick={() => setSelectedImage(prev => (prev + 1) % images.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronRight className="h-4 w-4 text-slate-700" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {images.map((img: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={cn(
                              "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                              selectedImage === idx ? "border-primary shadow-md scale-95" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                          </button>
                        ))}
                      </div>

                        {/* Sample Option */}
                        {(product.hasSample || product.has_sample) && (
                          <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sample Available</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs font-bold text-slate-600">Sample Price:</span>
                              <span className="font-black text-slate-900">{formatPrice(product.samplePrice || product.sample_price || 0)}</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">MOQ for samples: {product.sampleMOQ || product.sample_moq || 1} unit</p>
                          </div>
                        )}
                    </div>

                    {/* Right Side: Primary Info */}
                    <div className="md:col-span-7 p-8 sm:p-10 space-y-8">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                            {categoryName}
                          </Badge>
                          {product.status === 'active' && (
                            <div className="flex items-center gap-1 text-success">
                              <ShieldCheck className="h-4 w-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Verified Listing</span>
                            </div>
                          )}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 leading-tight mb-3">{product.name}</h2>
                        <p className="text-slate-500 font-bold text-sm leading-relaxed">{product.shortDescription || product.short_description}</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wholesale Pricing Slabs</h4>
                            <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md">Best Rate Available</span>
                          </div>
                          <PricingSlabsTable slabs={slabs} unit={product.unit || 'unit'} className="border-slate-100 shadow-sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-100">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Starting from</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-primary">{formatPrice(minTierPrice)}</span>
                              <span className="text-xs font-bold text-slate-400">/ {product.unit || 'unit'}</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Minimum Order</p>
                            <p className="text-xl font-black text-slate-800">{product.moq || 1} {product.unit || 'units'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Inquiry
                        </Button>
                        <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-200 hover:bg-slate-50">
                          <Star className="h-5 w-5 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Information Tabs */}
                  <div className="px-8 sm:px-10 pb-10">
                    <Tabs defaultValue="specs" className="w-full">
                      <TabsList className="bg-slate-50 w-full justify-start h-auto p-0 border-b border-slate-100 rounded-none mb-8">
                        <TabsTrigger 
                          value="specs" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-8 py-4 font-black text-[10px] uppercase tracking-widest"
                        >
                          Specifications
                        </TabsTrigger>
                        <TabsTrigger 
                          value="desc" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-8 py-4 font-black text-[10px] uppercase tracking-widest"
                        >
                          Detailed Description
                        </TabsTrigger>
                        <TabsTrigger 
                          value="shipping" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-8 py-4 font-black text-[10px] uppercase tracking-widest"
                        >
                          Shipping & Logistics
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="specs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                          {product.specifications ? (
                            Object.entries(product.specifications).map(([key, value]) => (
                              <div key={key} className="flex justify-between py-3 border-b border-slate-50">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                                <span className="text-sm font-bold text-slate-700">{String(value)}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 italic">No specifications provided</p>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="desc">
                        <div 
                          className="prose prose-slate max-w-none prose-sm text-slate-600 leading-relaxed font-medium preview-content"
                          dangerouslySetInnerHTML={{ __html: product.description || product.shortDescription || product.short_description || 'No detailed description provided.' }}
                        />
                        <style dangerouslySetInnerHTML={{ __html: `
                          .preview-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-top: 1rem !important; margin-bottom: 1rem !important; }
                          .preview-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-top: 1rem !important; margin-bottom: 1rem !important; }
                          .preview-content li { margin-bottom: 0.5rem !important; display: list-item !important; }
                          .preview-content h3 { font-size: 1.1rem !important; font-weight: 800 !important; margin-top: 1.5rem !important; margin-bottom: 0.75rem !important; color: #0f172a !important; text-transform: uppercase; letter-spacing: 0.05em; }
                        `}} />
                      </TabsContent>
                      <TabsContent value="shipping">
                        <div className="space-y-6">
                          {product.logistics ? (
                            <div className="flex gap-4 items-start">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <Truck className="h-5 w-5 text-slate-500" />
                              </div>
                              <div>
                                <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Operational Terms</h5>
                                <p className="text-sm text-slate-500 font-bold whitespace-pre-wrap">{product.logistics}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                  <Truck className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                  <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Global Shipping Time</h5>
                                  <p className="text-sm text-slate-500 font-bold">Standard 7-14 business days. Express options available upon negotiation.</p>
                                </div>
                              </div>
                              <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                  <ShieldCheck className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                  <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Logistics Insurance</h5>
                                  <p className="text-sm text-slate-500 font-bold">Comprehensive coverage provided for all bulk shipments via Platform Logistics.</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="p-4 sm:p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary/40 order-2 sm:order-1">
              <Info className="h-4 w-4" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">This is how your product appears to buyers</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
              {mode === 'admin' && product.status === 'pending' && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => onReject?.(product.id)}
                    className="flex-1 sm:flex-none rounded-xl px-6 h-12 font-black text-xs uppercase tracking-widest text-destructive border-destructive/20 hover:bg-destructive/5"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    onClick={() => onApprove?.(product.id)}
                    className="flex-1 sm:flex-none rounded-xl px-6 h-12 font-black text-xs uppercase tracking-widest bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none rounded-xl px-8 h-12 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
