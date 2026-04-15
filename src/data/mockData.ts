// Mock data for Jummababa B2B Marketplace

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories: Subcategory[];
  productCount: number;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  logo: string;
  location: string;
  state: string;
  gstVerified: boolean;
  yearEstablished: number;
  rating: number;
  totalProducts: number;
  isTopSupplier: boolean;
  businessType: string;
  annualTurnover: string;
}

export interface PricingSlab {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  images: string[];
  categoryId: string;
  subcategoryId: string;
  supplierId: string;
  moq: number;
  unit: string;
  pricingSlabs: PricingSlab[];
  specifications: Record<string, string>;
  isVerified: boolean;
  createdAt: string;
}

export interface RFQ {
  id: string;
  buyerId: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPrice: number | null;
  deliveryLocation: string;
  description: string;
  status: 'pending' | 'responded' | 'closed';
  createdAt: string;
  responses: RFQResponse[];
}

export interface RFQResponse {
  id: string;
  vendorId: string;
  price: number;
  deliveryDays: number;
  message: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'buyer' | 'vendor' | 'admin';
  companyName?: string;
  gstNumber?: string;
  isVerified: boolean;
  createdAt: string;
}

// Categories
export const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Electronics & Electrical',
    slug: 'electronics-electrical',
    icon: 'Cpu',
    productCount: 15420,
    subcategories: [
      { id: 'sub-1-1', name: 'Mobile Phones', slug: 'mobile-phones' },
      { id: 'sub-1-2', name: 'Computer Hardware', slug: 'computer-hardware' },
      { id: 'sub-1-3', name: 'LED Lights', slug: 'led-lights' },
      { id: 'sub-1-4', name: 'Cables & Wires', slug: 'cables-wires' },
    ],
  },
  {
    id: 'cat-2',
    name: 'Textiles & Apparel',
    slug: 'textiles-apparel',
    icon: 'Shirt',
    productCount: 28350,
    subcategories: [
      { id: 'sub-2-1', name: 'Cotton Fabrics', slug: 'cotton-fabrics' },
      { id: 'sub-2-2', name: 'Ready Made Garments', slug: 'ready-made-garments' },
      { id: 'sub-2-3', name: 'Sarees', slug: 'sarees' },
      { id: 'sub-2-4', name: 'Home Textiles', slug: 'home-textiles' },
    ],
  },
  {
    id: 'cat-3',
    name: 'Industrial Supplies',
    slug: 'industrial-supplies',
    icon: 'Factory',
    productCount: 12890,
    subcategories: [
      { id: 'sub-3-1', name: 'Tools & Equipment', slug: 'tools-equipment' },
      { id: 'sub-3-2', name: 'Safety Products', slug: 'safety-products' },
      { id: 'sub-3-3', name: 'Packaging Materials', slug: 'packaging-materials' },
      { id: 'sub-3-4', name: 'Industrial Chemicals', slug: 'industrial-chemicals' },
    ],
  },
  {
    id: 'cat-4',
    name: 'Food & Agriculture',
    slug: 'food-agriculture',
    icon: 'Wheat',
    productCount: 18670,
    subcategories: [
      { id: 'sub-4-1', name: 'Grains & Pulses', slug: 'grains-pulses' },
      { id: 'sub-4-2', name: 'Spices', slug: 'spices' },
      { id: 'sub-4-3', name: 'Fresh Vegetables', slug: 'fresh-vegetables' },
      { id: 'sub-4-4', name: 'Processed Foods', slug: 'processed-foods' },
    ],
  },
  {
    id: 'cat-5',
    name: 'Building Materials',
    slug: 'building-materials',
    icon: 'Building',
    productCount: 9450,
    subcategories: [
      { id: 'sub-5-1', name: 'Cement & Concrete', slug: 'cement-concrete' },
      { id: 'sub-5-2', name: 'Steel & Iron', slug: 'steel-iron' },
      { id: 'sub-5-3', name: 'Tiles & Flooring', slug: 'tiles-flooring' },
      { id: 'sub-5-4', name: 'Plumbing Supplies', slug: 'plumbing-supplies' },
    ],
  },
  {
    id: 'cat-6',
    name: 'Furniture & Decor',
    slug: 'furniture-decor',
    icon: 'Sofa',
    productCount: 7820,
    subcategories: [
      { id: 'sub-6-1', name: 'Office Furniture', slug: 'office-furniture' },
      { id: 'sub-6-2', name: 'Home Furniture', slug: 'home-furniture' },
      { id: 'sub-6-3', name: 'Decorative Items', slug: 'decorative-items' },
      { id: 'sub-6-4', name: 'Lighting Fixtures', slug: 'lighting-fixtures' },
    ],
  },
  {
    id: 'cat-7',
    name: 'Machinery & Equipment',
    slug: 'machinery-equipment',
    icon: 'Cog',
    productCount: 6340,
    subcategories: [
      { id: 'sub-7-1', name: 'Manufacturing Machines', slug: 'manufacturing-machines' },
      { id: 'sub-7-2', name: 'Agricultural Machines', slug: 'agricultural-machines' },
      { id: 'sub-7-3', name: 'Printing Machines', slug: 'printing-machines' },
      { id: 'sub-7-4', name: 'Packaging Machines', slug: 'packaging-machines' },
    ],
  },
  {
    id: 'cat-8',
    name: 'Health & Medical',
    slug: 'health-medical',
    icon: 'Heart',
    productCount: 5120,
    subcategories: [
      { id: 'sub-8-1', name: 'Medical Equipment', slug: 'medical-equipment' },
      { id: 'sub-8-2', name: 'Pharmaceuticals', slug: 'pharmaceuticals' },
      { id: 'sub-8-3', name: 'Personal Care', slug: 'personal-care' },
      { id: 'sub-8-4', name: 'Hospital Supplies', slug: 'hospital-supplies' },
    ],
  },
];

// Suppliers
export const suppliers: Supplier[] = [
  {
    id: 'sup-1',
    companyName: 'Rajesh Electronics Pvt Ltd',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    location: 'Mumbai',
    state: 'Maharashtra',
    gstVerified: true,
    yearEstablished: 2005,
    rating: 4.8,
    totalProducts: 245,
    isTopSupplier: true,
    businessType: 'Manufacturer',
    annualTurnover: '₹50-100 Cr',
  },
  {
    id: 'sup-2',
    companyName: 'Sharma Textiles',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
    location: 'Surat',
    state: 'Gujarat',
    gstVerified: true,
    yearEstablished: 1998,
    rating: 4.6,
    totalProducts: 520,
    isTopSupplier: true,
    businessType: 'Manufacturer & Exporter',
    annualTurnover: '₹100-500 Cr',
  },
  {
    id: 'sup-3',
    companyName: 'Industrial Tools India',
    logo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&h=100&fit=crop',
    location: 'Ludhiana',
    state: 'Punjab',
    gstVerified: true,
    yearEstablished: 2010,
    rating: 4.5,
    totalProducts: 180,
    isTopSupplier: false,
    businessType: 'Wholesaler',
    annualTurnover: '₹10-50 Cr',
  },
  {
    id: 'sup-4',
    companyName: 'Agro Fresh Exports',
    logo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=100&h=100&fit=crop',
    location: 'Nashik',
    state: 'Maharashtra',
    gstVerified: true,
    yearEstablished: 2015,
    rating: 4.7,
    totalProducts: 95,
    isTopSupplier: true,
    businessType: 'Exporter',
    annualTurnover: '₹25-50 Cr',
  },
  {
    id: 'sup-5',
    companyName: 'BuildRight Materials',
    logo: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=100&h=100&fit=crop',
    location: 'Chennai',
    state: 'Tamil Nadu',
    gstVerified: true,
    yearEstablished: 2008,
    rating: 4.4,
    totalProducts: 320,
    isTopSupplier: false,
    businessType: 'Distributor',
    annualTurnover: '₹50-100 Cr',
  },
  {
    id: 'sup-6',
    companyName: 'Delhi Furniture House',
    logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop',
    location: 'New Delhi',
    state: 'Delhi',
    gstVerified: true,
    yearEstablished: 2000,
    rating: 4.3,
    totalProducts: 210,
    isTopSupplier: true,
    businessType: 'Manufacturer',
    annualTurnover: '₹25-50 Cr',
  },
];

// Products
export const products: Product[] = [
  {
    id: 'prod-8',
    name: 'Silk Sarees Wholesale Lot',
    slug: 'silk-sarees-wholesale-lot',
    description: 'Premium Kanchipuram silk sarees in assorted designs. Ideal for retailers and wedding bulk buyers.',
    shortDescription: 'Pure Silk, Traditional Designs, Zari Work',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    ],
    categoryId: 'cat-2',
    subcategoryId: 'sub-2-3',
    supplierId: 'sup-2',
    moq: 25,
    unit: 'pieces',
    pricingSlabs: [
      { minQty: 25, maxQty: 49, pricePerUnit: 8500 },
      { minQty: 50, maxQty: 99, pricePerUnit: 7800 },
      { minQty: 100, maxQty: null, pricePerUnit: 7200 },
    ],
    specifications: {
      'Material': 'Pure Silk',
      'Length': '6.3 meters',
      'Blouse Piece': 'Included',
      'Work': 'Zari Borders',
      'Origin': 'Kanchipuram',
      'Care': 'Dry Clean only',
    },
    isVerified: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'prod-1',
    name: 'Samsung Galaxy A54 5G Bulk Pack',
    slug: 'samsung-galaxy-a54-5g-bulk-pack',
    description: 'Brand new Samsung Galaxy A54 5G smartphones in bulk. Perfect for retailers and distributors. All units come with manufacturer warranty and GST invoice.',
    shortDescription: 'Samsung Galaxy A54 5G - 8GB RAM, 256GB Storage',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
    ],
    categoryId: 'cat-1',
    subcategoryId: 'sub-1-1',
    supplierId: 'sup-1',
    moq: 50,
    unit: 'pieces',
    pricingSlabs: [
      { minQty: 50, maxQty: 99, pricePerUnit: 28500 },
      { minQty: 100, maxQty: 499, pricePerUnit: 27800 },
      { minQty: 500, maxQty: null, pricePerUnit: 27000 },
    ],
    specifications: {
      'Brand': 'Samsung',
      'Model': 'Galaxy A54 5G',
      'RAM': '8GB',
      'Storage': '256GB',
      'Display': '6.4" Super AMOLED',
      'Battery': '5000 mAh',
      'Warranty': '1 Year Manufacturer',
    },
    isVerified: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'prod-2',
    name: 'Premium Cotton Fabric Roll',
    slug: 'premium-cotton-fabric-roll',
    description: 'High-quality 100% cotton fabric rolls ideal for garment manufacturing. Available in multiple colors and patterns. Consistent quality and GST compliant.',
    shortDescription: '100% Cotton, 120 GSM, Multiple Colors Available',
    images: [
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600',
      'https://images.unsplash.com/photo-1528459105426-b9548367069b?w=600',
    ],
    categoryId: 'cat-2',
    subcategoryId: 'sub-2-1',
    supplierId: 'sup-2',
    moq: 100,
    unit: 'meters',
    pricingSlabs: [
      { minQty: 100, maxQty: 499, pricePerUnit: 85 },
      { minQty: 500, maxQty: 1999, pricePerUnit: 78 },
      { minQty: 2000, maxQty: null, pricePerUnit: 72 },
    ],
    specifications: {
      'Material': '100% Cotton',
      'GSM': '120',
      'Width': '44 inches',
      'Pattern': 'Plain',
      'Shrinkage': 'Pre-shrunk',
      'Colors': '25+ Available',
    },
    isVerified: true,
    createdAt: '2024-01-10',
  },
  {
    id: 'prod-3',
    name: 'Heavy Duty Industrial Drill Machine',
    slug: 'heavy-duty-industrial-drill-machine',
    description: 'Professional grade industrial drill machine for heavy-duty applications. Suitable for manufacturing units and construction sites.',
    shortDescription: '1500W Motor, Variable Speed, Metal Body',
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600',
    ],
    categoryId: 'cat-3',
    subcategoryId: 'sub-3-1',
    supplierId: 'sup-3',
    moq: 10,
    unit: 'pieces',
    pricingSlabs: [
      { minQty: 10, maxQty: 24, pricePerUnit: 8500 },
      { minQty: 25, maxQty: 49, pricePerUnit: 8000 },
      { minQty: 50, maxQty: null, pricePerUnit: 7500 },
    ],
    specifications: {
      'Power': '1500W',
      'Speed': '0-3000 RPM',
      'Chuck Size': '13mm',
      'Body': 'Metal',
      'Voltage': '220-240V',
      'Warranty': '2 Years',
    },
    isVerified: true,
    createdAt: '2024-01-08',
  },
  {
    id: 'prod-4',
    name: 'Organic Basmati Rice Premium Grade',
    slug: 'organic-basmati-rice-premium-grade',
    description: 'Premium quality organic Basmati rice sourced directly from farms in Dehradun region. FSSAI certified and export quality.',
    shortDescription: 'Organic, Long Grain, Aged 2 Years',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
      'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600',
    ],
    categoryId: 'cat-4',
    subcategoryId: 'sub-4-1',
    supplierId: 'sup-4',
    moq: 500,
    unit: 'kg',
    pricingSlabs: [
      { minQty: 500, maxQty: 999, pricePerUnit: 125 },
      { minQty: 1000, maxQty: 4999, pricePerUnit: 118 },
      { minQty: 5000, maxQty: null, pricePerUnit: 110 },
    ],
    specifications: {
      'Type': 'Basmati',
      'Grade': 'Premium',
      'Grain Length': 'Extra Long',
      'Aged': '2 Years',
      'Certification': 'FSSAI, Organic',
      'Origin': 'Dehradun',
    },
    isVerified: true,
    createdAt: '2024-01-12',
  },
  {
    id: 'prod-5',
    name: 'AAC Blocks for Construction',
    slug: 'aac-blocks-for-construction',
    description: 'Autoclaved Aerated Concrete blocks for modern construction. Lightweight, thermal insulating, and earthquake resistant.',
    shortDescription: '600x200x200mm, Lightweight, Thermal Insulating',
    images: [
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600',
    ],
    categoryId: 'cat-5',
    subcategoryId: 'sub-5-1',
    supplierId: 'sup-5',
    moq: 1000,
    unit: 'pieces',
    pricingSlabs: [
      { minQty: 1000, maxQty: 4999, pricePerUnit: 55 },
      { minQty: 5000, maxQty: 9999, pricePerUnit: 52 },
      { minQty: 10000, maxQty: null, pricePerUnit: 48 },
    ],
    specifications: {
      'Size': '600x200x200mm',
      'Density': '550-650 kg/m³',
      'Compressive Strength': '3-4 N/mm²',
      'Thermal Conductivity': '0.16 W/mK',
      'Fire Resistance': '4 Hours',
      'Sound Insulation': '45 dB',
    },
    isVerified: true,
    createdAt: '2024-01-05',
  },
  {
    id: 'prod-6',
    name: 'Executive Office Chair Bulk',
    slug: 'executive-office-chair-bulk',
    description: 'Ergonomic executive office chairs with adjustable height and lumbar support. Perfect for corporate offices and startups.',
    shortDescription: 'Ergonomic, Adjustable, Mesh Back',
    images: [
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600',
      'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=600',
    ],
    categoryId: 'cat-6',
    subcategoryId: 'sub-6-1',
    supplierId: 'sup-6',
    moq: 20,
    unit: 'pieces',
    pricingSlabs: [
      { minQty: 20, maxQty: 49, pricePerUnit: 6500 },
      { minQty: 50, maxQty: 99, pricePerUnit: 6000 },
      { minQty: 100, maxQty: null, pricePerUnit: 5500 },
    ],
    specifications: {
      'Material': 'Mesh Back, Foam Seat',
      'Adjustable Height': 'Yes',
      'Armrest': 'Adjustable',
      'Lumbar Support': 'Yes',
      'Weight Capacity': '120 kg',
      'Warranty': '3 Years',
    },
    isVerified: true,
    createdAt: '2024-01-18',
  },
  {
    id: 'prod-7',
    name: 'LED Panel Light 40W',
    slug: 'led-panel-light-40w',
    description: 'Energy efficient LED panel lights for commercial and industrial spaces. Flicker-free with high lumen output.',
    shortDescription: '40W, 4000 Lumens, Cool White',
    images: [
      'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    ],
    categoryId: 'cat-1',
    subcategoryId: 'sub-1-3',
    supplierId: 'sup-1',
    moq: 100,
    unit: 'pieces',
    pricingSlabs: [
      { minQty: 100, maxQty: 499, pricePerUnit: 650 },
      { minQty: 500, maxQty: 999, pricePerUnit: 580 },
      { minQty: 1000, maxQty: null, pricePerUnit: 520 },
    ],
    specifications: {
      'Wattage': '40W',
      'Lumens': '4000 lm',
      'Color Temperature': '6500K Cool White',
      'Size': '600x600mm',
      'Lifespan': '50,000 hours',
      'Warranty': '2 Years',
    },
    isVerified: true,
    createdAt: '2024-01-20',
  },
];

// Sample RFQs
export const rfqs: RFQ[] = [
  {
    id: 'rfq-1',
    buyerId: 'user-1',
    productName: 'Cotton T-shirts Plain',
    quantity: 5000,
    unit: 'pieces',
    targetPrice: 120,
    deliveryLocation: 'Mumbai, Maharashtra',
    description: 'Looking for plain cotton t-shirts in 5 colors (Black, White, Navy, Grey, Red). Sizes M, L, XL in equal ratio.',
    status: 'pending',
    createdAt: '2024-01-25',
    responses: [],
  },
  {
    id: 'rfq-2',
    buyerId: 'user-1',
    productName: 'Office Stationery Kit',
    quantity: 500,
    unit: 'sets',
    targetPrice: 250,
    deliveryLocation: 'Bangalore, Karnataka',
    description: 'Need complete office stationery kits including notebooks, pens, staplers, and organizers.',
    status: 'responded',
    createdAt: '2024-01-20',
    responses: [
      {
        id: 'resp-1',
        vendorId: 'sup-3',
        price: 275,
        deliveryDays: 7,
        message: 'We can provide premium quality stationery kits. Price includes packaging.',
        createdAt: '2024-01-21',
      },
    ],
  },
];

// Sample Orders
export const orders: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'JB-2024-001245',
    buyerId: 'user-1',
    vendorId: 'sup-1',
    items: [
      { productId: 'prod-1', productName: 'Samsung Galaxy A54 5G Bulk Pack', quantity: 100, pricePerUnit: 27800 },
    ],
    totalAmount: 2780000,
    status: 'delivered',
    createdAt: '2024-01-10',
    shippingAddress: '123 Business Park, Andheri East, Mumbai - 400069',
  },
  {
    id: 'order-2',
    orderNumber: 'JB-2024-001246',
    buyerId: 'user-1',
    vendorId: 'sup-2',
    items: [
      { productId: 'prod-2', productName: 'Premium Cotton Fabric Roll', quantity: 1000, pricePerUnit: 78 },
    ],
    totalAmount: 78000,
    status: 'shipped',
    createdAt: '2024-01-15',
    shippingAddress: '456 Textile Market, Ring Road, Surat - 395002',
  },
  {
    id: 'order-3',
    orderNumber: 'JB-2024-001247',
    buyerId: 'user-1',
    vendorId: 'sup-4',
    items: [
      { productId: 'prod-4', productName: 'Organic Basmati Rice Premium Grade', quantity: 2000, pricePerUnit: 118 },
    ],
    totalAmount: 236000,
    status: 'confirmed',
    createdAt: '2024-01-22',
    shippingAddress: '789 Food Market, APMC, Nashik - 422001',
  },
];

// Sample Users
export const users: User[] = [
  {
    id: 'user-1',
    name: 'Amit Kumar',
    email: 'amit@retailstore.com',
    phone: '+91 9876543210',
    role: 'buyer',
    companyName: 'Kumar Retail Stores',
    gstNumber: '27AABCU9603R1ZM',
    isVerified: true,
    createdAt: '2023-06-15',
  },
  {
    id: 'user-2',
    name: 'Rajesh Sharma',
    email: 'rajesh@sharmatextiles.com',
    phone: '+91 9876543211',
    role: 'vendor',
    companyName: 'Sharma Textiles',
    gstNumber: '24AADCS2230M1Z5',
    isVerified: true,
    createdAt: '2023-01-10',
  },
  {
    id: 'user-admin',
    name: 'Admin User',
    email: 'admin@jummababa.com',
    phone: '+91 9876543200',
    role: 'admin',
    isVerified: true,
    createdAt: '2023-01-01',
  },
];

// Helper functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const getSupplierById = (id: string): Supplier | undefined => {
  return suppliers.find(s => s.id === id);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find(c => c.id === id);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
  return products.filter(p => p.categoryId === categoryId);
};

export const getProductsBySupplier = (supplierId: string): Product[] => {
  return products.filter(p => p.supplierId === supplierId);
};
