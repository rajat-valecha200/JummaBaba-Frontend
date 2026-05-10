import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Cpu,
  Shirt,
  Factory,
  Wheat,
  Building,
  Sofa,
  Cog,
  Heart,
  Settings,
  Sprout,
  Construction,
  Home,
  Stethoscope,
  Truck,
  Box,
  HardHat,
  Microchip,
  Lightbulb,
  Utensils,
  Coffee,
  Leaf,
  Apple,
  Pizza,
  Zap,
  Wrench,
  Layers,
  LucideIcon
} from 'lucide-react';

import { formatNumber, cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Electronics: Cpu,
  Electrical: Zap,
  Machinery: Factory,
  Industrial: Factory,
  Agriculture: Wheat,
  Apparel: Shirt,
  Textiles: Shirt,
  Construction: Construction,
  Building: Building,
  Furniture: Sofa,
  Logistics: Truck,
  Packaging: Box,
  Safety: HardHat,
  Medical: Stethoscope,
  Health: Heart,
  Tools: Settings,
  Automotive: Cog,
  Food: Utensils,
  Beverage: Coffee,
  'Raw Materials': Layers,
  Chemicals: Sprout,

  Cpu,
  Shirt,
  Factory,
  Wheat,
  Building,
  Sofa,
  Cog,
  Heart,
  Settings,
  Sprout,
  Construction,
  Home,
  Stethoscope,
  Truck,
  Box,
  HardHat,
  Microchip,
  Lightbulb,
  Utensils,
  Coffee,
  Leaf,
  Apple,
  Pizza,
  Zap,
  Wrench,
  Layers,

  'Construction Supplies': HardHat,
  'Electrical Components': Zap,
  'Industrial Machinery': Factory,
  'Logistics Services': Truck,
  'Maintenance & Repair': Wrench
};

interface Category {
  id: string | number;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
  product_count?: number;
}

interface CategoryCardProps {
  category: Category | { id: string; name: string; isViewMore?: boolean };
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  className
}) => {
  const getIcon = (name: string) => {
    const searchName = (name || '').toLowerCase();

    const exactMatch = Object.entries(iconMap).find(
      ([key]) => key.toLowerCase() === searchName
    );

    if (exactMatch) return exactMatch[1];

    const partialMatch = Object.entries(iconMap).find(([key]) =>
      searchName.includes(key.toLowerCase())
    );

    if (partialMatch) return partialMatch[1];

    return Cog;
  };

  // VIEW MORE CARD
  if ('isViewMore' in category && category.isViewMore) {
    return (
      <Link to="/categories" className="block group">
        <div
          className={cn(
            'w-[130px] h-[130px] bg-white border border-zinc-200 rounded-lg flex flex-col items-center justify-center transition-all duration-200 hover:border-orange-400 hover:shadow-md shrink-0',
            className
          )}
        >
          <Plus className="h-6 w-6 text-orange-500 mb-1.5" />

          <span className="text-[11px] font-medium text-zinc-700">
            View More
          </span>
        </div>
      </Link>
    );
  }

  // NORMAL CARD
  const cat = category as Category;
  const Icon = getIcon(cat.icon || cat.name);

  return (
    <Link to={`/category/${cat.slug}`} className="block group">
      <div
        className={cn(
          'w-[130px] h-[130px] bg-white border border-zinc-200 rounded-lg flex flex-col items-center justify-center px-2 text-center transition-all duration-200 hover:border-[#467ab5] hover:shadow-md shrink-0',
          className
        )}
      >
        {/* ICON */}
        <div className="mb-2">
          <Icon className="h-7 w-7 text-[#467ab5]" />
        </div>

        {/* TITLE */}
        <h3 className="text-[12px] font-medium text-zinc-800 leading-tight line-clamp-2 px-1">
          {cat.name}
        </h3>

        {/* PRODUCT COUNT */}
        <span className="mt-1.5 text-[9px] text-zinc-500">
          {formatNumber(cat.productCount || cat.product_count || 0)} Items
        </span>
      </div>
    </Link>
  );
};