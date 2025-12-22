import { Link } from 'react-router-dom';
import { 
  Cpu, 
  Shirt, 
  Factory, 
  Wheat, 
  Building, 
  Sofa, 
  Cog, 
  Heart,
  LucideIcon 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Category, formatNumber } from '@/data/mockData';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Cpu,
  Shirt,
  Factory,
  Wheat,
  Building,
  Sofa,
  Cog,
  Heart,
};

interface CategoryCardProps {
  category: Category;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function CategoryCard({ category, variant = 'default', className }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Cpu;

  if (variant === 'compact') {
    return (
      <Link 
        to={`/category/${category.slug}`}
        className={cn(
          'flex flex-col items-center p-3 rounded-lg hover:bg-muted transition-colors text-center group',
          className
        )}
      >
        <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <p className="mt-2 text-sm font-medium line-clamp-2">{category.name}</p>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link to={`/category/${category.slug}`}>
        <Card className={cn(
          'group overflow-hidden hover:shadow-lg transition-all duration-300 h-full',
          className
        )}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary group-hover:scale-110 transition-transform">
              <Icon className="h-10 w-10" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{category.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatNumber(category.productCount)} Products
            </p>
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {category.subcategories.slice(0, 3).map(sub => (
                <span 
                  key={sub.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {sub.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link to={`/category/${category.slug}`}>
      <Card className={cn(
        'group hover:shadow-md hover:border-primary/50 transition-all duration-300',
        className
      )}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{category.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatNumber(category.productCount)} products
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
