export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string;
  badge: string;
  stock: number;
  rating: number;
  reviewCount: number;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  subcategoryId?: number;
  subcategoryName?: string;
  subcategorySlug?: string;
  galleryImages?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: { name: string; priceModifier: number }[];
  storageOptions?: { name: string; priceModifier: number }[];
  mattressOptions?: { name: string; priceModifier: number }[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  subcategories?: any[];
  productCount?: number;
  products: Product[];
}

/**
 * Formats a numeric price into a British Pounds (£) formatted string.
 * E.g., 599.99 -> £599.99, 1200 -> £1,200.00
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

// Common options to share
const SOFA_COLORS = [
  { name: 'Royal Blue', hex: '#0F4C81' },
  { name: 'Emerald Green', hex: '#097969' },
  { name: 'Charcoal Grey', hex: '#36454F' },
  { name: 'Blush Pink', hex: '#DE5D83' },
  { name: 'Mustard Yellow', hex: '#E1AD01' }
];

const MATTRESS_SIZES = [
  { name: "2'6 Small Single", priceModifier: -120 },
  { name: "3'0 Single", priceModifier: -80 },
  { name: "4'0 Small Double", priceModifier: -30 },
  { name: "4'6 Double", priceModifier: 0 },
  { name: "5'0 King", priceModifier: 100 },
  { name: "6'0 Super King", priceModifier: 200 }
];

const BED_SIZES = [
  { name: "2'6 Small Single", priceModifier: -150 },
  { name: "3'0 Single", priceModifier: -100 },
  { name: "4'0 Small Double", priceModifier: 0 },
  { name: "4'6 Double", priceModifier: 50 },
  { name: "5'0 King", priceModifier: 150 },
  { name: "6'0 Super King", priceModifier: 250 }
];

const BED_COLORS = [
  { name: 'Plush Black', hex: '#000000' },
  { name: 'Plush Cream', hex: '#D2B48C' },
  { name: 'Plush Grey', hex: '#808080' },
  { name: 'Plush Gold', hex: '#DAA520' },
  { name: 'Plush Burgundy', hex: '#800020' },
  { name: 'Plush Silver', hex: '#C0C0C0' },
  { name: 'Plush Blue', hex: '#4682B4' }
];

const BED_STORAGE = [
  { name: 'No Storage', priceModifier: 0 },
  { name: '2 Drawers', priceModifier: 60 },
  { name: '4 Drawers', priceModifier: 100 },
  { name: 'Gas Lift Ottoman', priceModifier: 180 }
];

const BED_MATTRESS = [
  { name: 'None', priceModifier: 0 },
  { name: 'Memory Foam', priceModifier: 100 },
  { name: 'Orthopedic', priceModifier: 150 },
  { name: 'Pocket Spring', priceModifier: 200 }
];

export const mockCatalog: Category[] = [
  {
    id: 1,
    name: 'Sofas',
    slug: 'sofas',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 101,
        name: 'Luxe Velvet 3-Seater Sofa',
        slug: 'luxe-velvet-3-seater',
        description: 'A deep-seated velvet sofa with plush feather-blend cushions and sleek brass legs.',
        price: 899.00,
        originalPrice: 1199.00,
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
        badge: 'Best Seller',
        stock: 12,
        rating: 4.8,
        reviewCount: 45,
        categoryId: 1,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 102,
        name: 'Chesterfield Classic Leather Sofa',
        slug: 'chesterfield-classic-leather',
        description: 'Traditionally tufted leather sofa featuring scroll arms and solid wood feet.',
        price: 1499.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&auto=format&fit=crop&q=80',
        badge: 'Premium',
        stock: 5,
        rating: 4.9,
        reviewCount: 28,
        categoryId: 1,
        colors: [
          { name: 'Tan Leather', hex: '#A0522D' },
          { name: 'Dark Brown', hex: '#5C4033' },
          { name: 'Classic Black', hex: '#000000' }
        ],
        galleryImages: [
          'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 103,
        name: 'Nordic Minimalist Fabric Sofa',
        slug: 'nordic-minimalist-fabric',
        description: 'Eco-friendly textured fabric couch designed with clean lines and oak peg legs.',
        price: 699.00,
        originalPrice: 799.00,
        image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
        badge: 'New',
        stock: 18,
        rating: 4.5,
        reviewCount: 15,
        categoryId: 1,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Corner sofas',
    slug: 'corner-sofas',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 201,
        name: 'Haven L-Shape Sectional',
        slug: 'haven-l-shape-sectional',
        description: 'Generously proportioned corner couch upholstered in heavy-duty grey weave.',
        price: 1399.00,
        originalPrice: 1799.00,
        image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
        badge: 'Best Seller',
        stock: 8,
        rating: 4.7,
        reviewCount: 32,
        categoryId: 2,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 202,
        name: 'Verona Right-Hand Facing Sofa',
        slug: 'verona-right-hand-facing',
        description: 'A spacious and stylish modular corner sofa with chrome-finished brackets.',
        price: 1599.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
        badge: 'Trending',
        stock: 4,
        rating: 4.8,
        reviewCount: 19,
        categoryId: 2,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Recliner sofas',
    slug: 'recliner-sofas',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 301,
        name: 'Power Motion Reclining 2-Seater',
        slug: 'power-motion-reclining-2-seater',
        description: 'Dual electric recliner with USB charging ports and lumbar support control.',
        price: 999.00,
        originalPrice: 1299.00,
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
        badge: 'Popular',
        stock: 9,
        rating: 4.6,
        reviewCount: 22,
        categoryId: 3,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 302,
        name: 'Grand Executive Leather Recliner',
        slug: 'grand-executive-leather-recliner',
        description: 'Top-grain leather power reclining couch with adjustable power headrests.',
        price: 1449.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80',
        badge: 'Premium',
        stock: 6,
        rating: 4.9,
        reviewCount: 14,
        categoryId: 3,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'Sofa bed',
    slug: 'sofa-bed',
    image: 'https://images.unsplash.com/photo-1544030288-e6e6108867f8?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 401,
        name: 'Sleeper Pro Click-Clack Sofa Bed',
        slug: 'sleeper-pro-click-clack',
        description: 'Easily transforms from a stylish daybed to a comfortable guest sleeper.',
        price: 449.00,
        originalPrice: 599.00,
        image: 'https://images.unsplash.com/photo-1544030288-e6e6108867f8?w=600&auto=format&fit=crop&q=80',
        badge: 'Best Value',
        stock: 15,
        rating: 4.4,
        reviewCount: 39,
        categoryId: 4,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1544030288-e6e6108867f8?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 402,
        name: 'Pull-Out Velvet Guest Bed',
        slug: 'pull-out-velvet-guest-bed',
        description: 'Plush velvet sofa with a metal pull-out frame and memory foam mattress inside.',
        price: 799.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80',
        badge: 'Premium',
        stock: 10,
        rating: 4.7,
        reviewCount: 25,
        categoryId: 4,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544030288-e6e6108867f8?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 5,
    name: 'Beds',
    slug: 'beds',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
    subcategories: [
      { id: 51, name: "Ottoman Beds", slug: "ottoman-beds", categoryId: 5 },
      { id: 52, name: "Wooden Beds", slug: "wooden-beds", categoryId: 5 }
    ],
    products: [
      {
        id: 501,
        name: 'Monaco Velvet Ottoman Bed Frame',
        slug: 'monaco-velvet-ottoman',
        description: 'Gas-lift hydraulic ottoman bed offering vast under-bed storage.',
        price: 549.00,
        originalPrice: 699.00,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
        badge: 'Best Seller',
        stock: 11,
        rating: 4.8,
        reviewCount: 54,
        categoryId: 5,
        categoryName: 'Beds',
        categorySlug: 'beds',
        subcategoryId: 51,
        subcategoryName: 'Ottoman Beds',
        subcategorySlug: 'ottoman-beds',
        colors: BED_COLORS,
        sizes: BED_SIZES,
        storageOptions: BED_STORAGE,
        mattressOptions: BED_MATTRESS,
        galleryImages: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 502,
        name: 'Oxford Solid Oak Sleigh Bed',
        slug: 'oxford-solid-oak-sleigh',
        description: 'Beautifully crafted sleigh bed made from sustainable rustic European oak.',
        price: 649.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
        badge: 'New',
        stock: 8,
        rating: 4.6,
        reviewCount: 12,
        categoryId: 5,
        categoryName: 'Beds',
        categorySlug: 'beds',
        subcategoryId: 52,
        subcategoryName: 'Wooden Beds',
        subcategorySlug: 'wooden-beds',
        colors: BED_COLORS,
        sizes: BED_SIZES,
        storageOptions: BED_STORAGE,
        mattressOptions: BED_MATTRESS,
        galleryImages: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 6,
    name: 'Mattresses',
    slug: 'mattresses',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 601,
        name: 'Orthopaedic Pocket Sprung Mattress',
        slug: 'orthopaedic-pocket-sprung',
        description: 'Firm orthopaedic mattress with 2000 individual pocket springs and cooling gel.',
        price: 349.00,
        originalPrice: 449.00,
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
        badge: 'Healthy Back',
        stock: 20,
        rating: 4.7,
        reviewCount: 88,
        categoryId: 6,
        sizes: MATTRESS_SIZES,
        galleryImages: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 602,
        name: 'Hybrid Gel Memory Foam Mattress',
        slug: 'hybrid-gel-memory-foam',
        description: 'Zero motion transfer mattress blending memory foam layers and pocket micro-coils.',
        price: 499.00,
        originalPrice: 649.00,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
        badge: 'Top Choice',
        stock: 14,
        rating: 4.9,
        reviewCount: 112,
        categoryId: 6,
        sizes: MATTRESS_SIZES,
        galleryImages: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 7,
    name: 'Chairs',
    slug: 'chairs',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 701,
        name: 'Slipper Velvet Accent Chair',
        slug: 'slipper-velvet-accent',
        description: 'A button-back lounge chair finished in smooth royal gold upholstery.',
        price: 199.00,
        originalPrice: 249.00,
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
        badge: 'Trending',
        stock: 25,
        rating: 4.5,
        reviewCount: 30,
        categoryId: 7,
        galleryImages: [
          'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 702,
        name: 'Classic Wingback Lounge Chair',
        slug: 'classic-wingback-lounge',
        description: 'An elegant reading chair featuring wooden cabriole legs and side wings.',
        price: 299.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80',
        badge: 'Traditional',
        stock: 10,
        rating: 4.8,
        reviewCount: 17,
        categoryId: 7,
        galleryImages: [
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 8,
    name: 'Dining',
    slug: 'dining',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 801,
        name: 'Solid Oak Extendable Table',
        slug: 'solid-oak-extendable-table',
        description: 'Seats up to 8-10 diners with a convenient central butterfly extension system.',
        price: 699.00,
        originalPrice: 899.00,
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
        badge: 'Family Size',
        stock: 6,
        rating: 4.7,
        reviewCount: 16,
        categoryId: 8,
        galleryImages: [
          'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 802,
        name: 'Madrid Marble Table Set',
        slug: 'madrid-marble-table-set',
        description: 'Chic white marble dining table paired with 4 tufted fabric high-back chairs.',
        price: 1199.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600&auto=format&fit=crop&q=80',
        badge: 'Exclusive',
        stock: 3,
        rating: 4.9,
        reviewCount: 9,
        categoryId: 8,
        galleryImages: [
          'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 9,
    name: 'Shop by room',
    slug: 'shop-by-room',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 901,
        name: 'Living Room Elegance Set',
        slug: 'living-room-elegance-set',
        description: 'Includes our Luxe Velvet Sofa, Marble Coffee Table, and Velvet Accent Chair.',
        price: 1399.00,
        originalPrice: 1547.00,
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80',
        badge: 'Bundle Deal',
        stock: 5,
        rating: 4.9,
        reviewCount: 11,
        categoryId: 9,
        galleryImages: [
          'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 902,
        name: 'Master Bedroom Suite Set',
        slug: 'master-bedroom-suite-set',
        description: 'Includes Monaco Ottoman Bed frame, Hybrid Mattress, and two oak bedside tables.',
        price: 1099.00,
        originalPrice: 1297.00,
        image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&auto=format&fit=crop&q=80',
        badge: 'Save £198',
        stock: 4,
        rating: 4.8,
        reviewCount: 7,
        categoryId: 9,
        galleryImages: [
          'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 10,
    name: 'Offers',
    slug: 'offers',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 1001,
        name: 'Velvet Footstool Bargain',
        slug: 'velvet-footstool-bargain',
        description: 'Upholstered footstool matching the Luxe Velvet series. Limited stock.',
        price: 99.00,
        originalPrice: 199.00,
        image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
        badge: '50% OFF',
        stock: 32,
        rating: 4.3,
        reviewCount: 41,
        categoryId: 10,
        galleryImages: [
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 1002,
        name: 'Discounted Compact Loveseat',
        slug: 'discounted-compact-loveseat',
        description: 'Small space fabric loveseat couch, end-of-line stock price drop.',
        price: 499.00,
        originalPrice: 799.00,
        image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
        badge: 'Save £300',
        stock: 8,
        rating: 4.4,
        reviewCount: 14,
        categoryId: 10,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 11,
    name: 'Trending',
    slug: 'trending',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 1101,
        name: 'Bouclé Curved Lounge Sofa',
        slug: 'boucle-curved-lounge',
        description: 'Featuring high-texture white bouclé upholstery and an organic kidney-shaped silhouette.',
        price: 1199.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
        badge: 'Viral Style',
        stock: 6,
        rating: 4.9,
        reviewCount: 63,
        categoryId: 11,
        colors: SOFA_COLORS,
        galleryImages: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 1102,
        name: 'Rattan Woven Accent Chair',
        slug: 'rattan-woven-accent-chair',
        description: 'Warm solid birch wood armchair featuring natural woven cane backing.',
        price: 189.00,
        originalPrice: 229.00,
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80',
        badge: 'Aesthetic',
        stock: 15,
        rating: 4.6,
        reviewCount: 25,
        categoryId: 11,
        galleryImages: [
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 12,
    name: 'Quick delivery',
    slug: 'quick-delivery',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 1201,
        name: 'Express Hybrid Mattress',
        slug: 'express-hybrid-mattress',
        description: 'Shipped vacuum-sealed for next-day delivery if ordered before 2 PM.',
        price: 279.00,
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
        badge: 'Next Day Ship',
        stock: 50,
        rating: 4.5,
        reviewCount: 204,
        categoryId: 12,
        sizes: MATTRESS_SIZES,
        galleryImages: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 1202,
        name: 'Fast-Ship Tub Armchair',
        slug: 'fast-ship-tub-armchair',
        description: 'Cozy faux leather tub chair, pre-packed and ready for prompt dispatch.',
        price: 169.00,
        originalPrice: 199.00,
        image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
        badge: '48h Delivery',
        stock: 40,
        rating: 4.4,
        reviewCount: 35,
        categoryId: 12,
        galleryImages: [
          'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  },
  {
    id: 13,
    name: 'Clearance',
    slug: 'clearance',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80',
    products: [
      {
        id: 1301,
        name: 'Ex-Display Leather Recliner Chair',
        slug: 'ex-display-leather-recliner',
        description: 'Showroom model with minor cosmetic wear, sold as-is at a massive discount.',
        price: 299.00,
        originalPrice: 699.00,
        image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80',
        badge: 'Ex-Display',
        stock: 1,
        rating: 4.1,
        reviewCount: 4,
        categoryId: 13,
        galleryImages: [
          'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&auto=format&fit=crop&q=80'
        ]
      },
      {
        id: 1302,
        name: 'Warehouse Clearance Oak Sideboard',
        slug: 'warehouse-clearance-sideboard',
        description: 'Overstock sideboard featuring double cupboards and drawer storage.',
        price: 329.00,
        originalPrice: 649.00,
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
        badge: 'Clearance Deal',
        stock: 3,
        rating: 4.7,
        reviewCount: 18,
        categoryId: 13,
        galleryImages: [
          'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80'
        ]
      }
    ]
  }
];
