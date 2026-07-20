import db, { initDB } from './db';
import bcrypt from 'bcryptjs';

async function seed() {
  await initDB();

  const adminPassword = bcrypt.hashSync('abdul_studio@8989$$', 10);

  // Seed admin
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('comfortstudiouk@gmail.com');
  if (!existingAdmin) {
    db.prepare('INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, 1)').run('Admin', 'comfortstudiouk@gmail.com', adminPassword);
  }

  // Seed categories
  const categories = [
    { name: 'Sofas', slug: 'sofas', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop', subs: ['Sectional Sofas', 'Sleeper Sofas', 'Loveseats', 'Chesterfield', 'Reclining Sofas'] },
    { name: 'Living Room', slug: 'living-room', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop', subs: ['Coffee Tables', 'TV Stands', 'Bookshelves', 'Accent Chairs', 'Side Tables'] },
    { name: 'Dining Room', slug: 'dining-room', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop', subs: ['Dining Tables', 'Dining Chairs', 'Buffets & Sideboards', 'Bar Stools', 'Dining Sets'] },
    { name: 'Office', slug: 'office', image: 'https://images.unsplash.com/photo-1518455027359-f7f8b661c31f?w=600&h=400&fit=crop', subs: ['Office Desks', 'Office Chairs', 'Filing Cabinets', 'Conference Tables', 'Standing Desks'] },
  ];

  for (const cat of categories) {
    db.prepare('INSERT OR IGNORE INTO categories (name, slug, image) VALUES (?, ?, ?)').run(cat.name, cat.slug, cat.image);
    const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug) as any;
    for (const sub of cat.subs) {
      const subSlug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      db.prepare('INSERT OR IGNORE INTO subcategories (categoryId, name, slug) VALUES (?, ?, ?)').run(row.id, sub, subSlug);
    }
  }

  // Seed products
  const products = [
    { name: 'Luxe Sectional Sofa', slug: 'luxe-sectional-sofa', cat: 'sofas', sub: 'sectional-sofas', price: 2499, orig: 3199, stock: 15, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop', desc: 'Premium L-shaped sectional with deep cushions and velvet upholstery.', badge: 'Best Seller', featured: 1 },
    { name: 'Cloud Comfort Sleeper', slug: 'cloud-comfort-sleeper', cat: 'sofas', sub: 'sleeper-sofas', price: 1899, orig: 2499, stock: 8, img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&h=400&fit=crop', desc: 'Transform your living space with this ultra-comfortable sleeper sofa.', badge: 'Sale', featured: 1 },
    { name: 'Parisian Loveseat', slug: 'parisian-loveseat', cat: 'sofas', sub: 'loveseats', price: 1299, orig: 1599, stock: 22, img: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&h=400&fit=crop', desc: 'Elegant two-seater with tufted back and curved armrests.', badge: 'New', featured: 1 },
    { name: 'Classic Chesterfield', slug: 'classic-chesterfield', cat: 'sofas', sub: 'chesterfield', price: 2199, orig: 2799, stock: 5, img: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&h=400&fit=crop', desc: 'Timeless Chesterfield design with deep button tufting.', badge: 'Premium', featured: 1 },
    { name: 'Power Recliner Sofa', slug: 'power-recliner-sofa', cat: 'sofas', sub: 'reclining-sofas', price: 1799, orig: 2299, stock: 12, img: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=600&h=400&fit=crop', desc: 'Electric reclining sofa with USB charging ports.', badge: '', featured: 0 },
    { name: 'Marble Top Coffee Table', slug: 'marble-top-coffee-table', cat: 'living-room', sub: 'coffee-tables', price: 699, orig: 899, stock: 30, img: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&h=400&fit=crop', desc: 'Luxurious marble top with gold-finished legs.', badge: 'Best Seller', featured: 1 },
    { name: 'Modern TV Console', slug: 'modern-tv-console', cat: 'living-room', sub: 'tv-stands', price: 899, orig: 1199, stock: 18, img: 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=600&h=400&fit=crop', desc: 'Sleek entertainment center with cable management.', badge: 'Sale', featured: 1 },
    { name: 'Oak Bookshelf', slug: 'oak-bookshelf', cat: 'living-room', sub: 'bookshelves', price: 549, orig: 699, stock: 25, img: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&h=400&fit=crop', desc: '5-tier solid oak bookshelf with adjustable shelves.', badge: '', featured: 0 },
    { name: 'Velvet Accent Chair', slug: 'velvet-accent-chair', cat: 'living-room', sub: 'accent-chairs', price: 449, orig: 599, stock: 3, img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=400&fit=crop', desc: 'Plush velvet accent chair with gold metal legs.', badge: 'New', featured: 1 },
    { name: 'Glass Side Table', slug: 'glass-side-table', cat: 'living-room', sub: 'side-tables', price: 299, orig: 399, stock: 40, img: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?w=600&h=400&fit=crop', desc: 'Tempered glass top with brushed nickel frame.', badge: '', featured: 0 },
    { name: 'Extendable Dining Table', slug: 'extendable-dining-table', cat: 'dining-room', sub: 'dining-tables', price: 1399, orig: 1799, stock: 10, img: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop', desc: 'Seats 6-10 guests with hidden extension leaf.', badge: 'Best Seller', featured: 1 },
    { name: 'Upholstered Dining Chair', slug: 'upholstered-dining-chair', cat: 'dining-room', sub: 'dining-chairs', price: 249, orig: 329, stock: 50, img: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=400&fit=crop', desc: 'Comfortable padded seat with solid wood legs.', badge: '', featured: 0 },
    { name: 'Rustic Buffet', slug: 'rustic-buffet', cat: 'dining-room', sub: 'buffets-sideboards', price: 899, orig: 1199, stock: 7, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop', desc: 'Farmhouse-style buffet with adjustable interior shelves.', badge: 'Sale', featured: 0 },
    { name: 'Industrial Bar Stool', slug: 'industrial-bar-stool', cat: 'dining-room', sub: 'bar-stools', price: 179, orig: 249, stock: 35, img: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=400&fit=crop', desc: 'Adjustable height with swivel seat and footrest.', badge: '', featured: 0 },
    { name: 'Complete Dining Set', slug: 'complete-dining-set', cat: 'dining-room', sub: 'dining-sets', price: 2199, orig: 2999, stock: 4, img: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop', desc: 'Table + 6 chairs. Solid wood construction.', badge: 'Bundle', featured: 1 },
    { name: 'Executive Office Desk', slug: 'executive-office-desk', cat: 'office', sub: 'office-desks', price: 799, orig: 1099, stock: 20, img: 'https://images.unsplash.com/photo-1518455027359-f7f8b661c31f?w=600&h=400&fit=crop', desc: 'L-shaped desk with built-in cable management.', badge: 'Best Seller', featured: 1 },
    { name: 'Ergonomic Chair', slug: 'ergonomic-chair', cat: 'office', sub: 'office-chairs', price: 599, orig: 799, stock: 2, img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=400&fit=crop', desc: 'Lumbar support, adjustable armrests, breathable mesh.', badge: 'Top Rated', featured: 1 },
    { name: '4-Drawer Filing Cabinet', slug: '4-drawer-filing-cabinet', cat: 'office', sub: 'filing-cabinets', price: 349, orig: 449, stock: 14, img: 'https://images.unsplash.com/photo-1518455027359-f7f8b661c31f?w=600&h=400&fit=crop', desc: 'Lockable steel construction with smooth-glide drawers.', badge: '', featured: 0 },
    { name: 'Conference Table', slug: 'conference-table', cat: 'office', sub: 'conference-tables', price: 1899, orig: 2499, stock: 6, img: 'https://images.unsplash.com/photo-1518455027359-f7f8b661c31f?w=600&h=400&fit=crop', desc: 'Seats 10-12. Built-in power outlets and USB ports.', badge: '', featured: 0 },
    { name: 'Electric Standing Desk', slug: 'electric-standing-desk', cat: 'office', sub: 'standing-desks', price: 699, orig: 899, stock: 11, img: 'https://images.unsplash.com/photo-1518455027359-f7f8b661c31f?w=600&h=400&fit=crop', desc: 'Dual motor, programmable height presets, cable tray.', badge: 'Popular', featured: 1 },
    { name: 'Luxury Velvet Sectional', slug: 'luxury-velvet-sectional', cat: 'sofas', sub: 'sectional-sofas', price: 3299, orig: 4199, stock: 0, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop', desc: 'Italian velvet, solid wood frame, feather-down fill.', badge: 'Premium', featured: 0 },
    { name: 'Mid-Century Coffee Table', slug: 'mid-century-coffee-table', cat: 'living-room', sub: 'coffee-tables', price: 449, orig: 599, stock: 28, img: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&h=400&fit=crop', desc: 'Walnut finish with tapered legs and storage shelf.', badge: '', featured: 0 },
    { name: 'Farmhouse Dining Table', slug: 'farmhouse-dining-table', cat: 'dining-room', sub: 'dining-tables', price: 1099, orig: 1499, stock: 9, img: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop', desc: 'Reclaimed wood with distressed finish. Seats 8.', badge: 'New', featured: 0 },
    { name: 'Gaming Desk Pro', slug: 'gaming-desk-pro', cat: 'office', sub: 'office-desks', price: 549, orig: 699, stock: 16, img: 'https://images.unsplash.com/photo-1518455027359-f7f8b661c31f?w=600&h=400&fit=crop', desc: 'RGB lighting, headphone hook, cup holder, cable mgmt.', badge: 'Popular', featured: 0 },
  ];

  for (const p of products) {
    const catRow = db.prepare('SELECT id FROM categories WHERE slug = ?').get(p.cat) as any;
    const subRow = db.prepare('SELECT id FROM subcategories WHERE slug = ? AND categoryId = ?').get(p.sub, catRow?.id) as any;
    db.prepare(`INSERT OR IGNORE INTO products (name, slug, description, price, originalPrice, image, categoryId, subcategoryId, stock, rating, reviewCount, badge, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`).run(p.name, p.slug, p.desc, p.price, p.orig, p.img, catRow?.id, subRow?.id, p.stock, p.badge, p.featured);
  }

  // Seed banners
  db.prepare('INSERT OR IGNORE INTO banners (title, subtitle, bgColor, textColor, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?)').run('Summer Sale — Up to 40% Off', 'Premium sofas & living room collections at unbeatable prices', '#1a1a2e', '#ffffff', 1, 0);
  db.prepare('INSERT OR IGNORE INTO banners (title, subtitle, bgColor, textColor, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?)').run('New Office Collection', 'Ergonomic desks & chairs designed for productivity', '#16213e', '#e2e2e2', 1, 1);
  db.prepare('INSERT OR IGNORE INTO banners (title, subtitle, bgColor, textColor, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?)').run('Free Delivery on Orders Over $500', 'White-glove delivery & setup included', '#0f3460', '#ffffff', 1, 2);

  // Seed scroll banners
  const existingScroll = db.prepare('SELECT id FROM scroll_banners LIMIT 1').get();
  if (!existingScroll) {
    db.prepare('INSERT INTO scroll_banners (text, bgColor, textColor, speed, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?)').run('Free Shipping on Orders Over $500 | Cash on Delivery Available | 30-Day Easy Returns | Premium Quality Guaranteed', '#c8956c', '#ffffff', 20, 1, 0);
  }

  // Seed footer
  const existingFooter = db.prepare('SELECT id FROM footer WHERE id = 1').get();
  if (!existingFooter) {
    db.prepare(`INSERT INTO footer (id, tagline, copyright, address, phone, email, hours, socialLinks, quickLinks, customerServiceLinks, paymentIcons) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'Premium furniture for modern living. Quality craftsmanship, timeless design, and comfort that transforms your home.',
      '2026 Comfort Studio. All rights reserved.',
      '123 Furniture Ave, Design District',
      '+44 7983 630088',
      'comfortstudiouk@gmail.com',
      'Mon - Sat: 9:00 AM - 8:00 PM',
      JSON.stringify([{ icon: 'fab fa-facebook-f', url: '#' }, { icon: 'fab fa-instagram', url: '#' }, { icon: 'fab fa-pinterest', url: '#' }, { icon: 'fab fa-twitter', url: '#' }]),
      JSON.stringify([{ label: 'Shop All', href: '/shop' }, { label: 'Sofas', href: '/shop?category=sofas' }, { label: 'Living Room', href: '/shop?category=living-room' }, { label: 'Dining Room', href: '/shop?category=dining-room' }, { label: 'Office', href: '/shop?category=office' }]),
      JSON.stringify([{ label: 'Contact Us', href: '/contact' }, { label: 'FAQs', href: '#' }, { label: 'Shipping Policy', href: '#' }, { label: 'Returns & Exchanges', href: '#' }, { label: 'Warranty', href: '#' }]),
      JSON.stringify(['Visa', 'Mastercard', 'Amex', 'PayPal'])
    );
  }

  console.log('Database seeded successfully!');
}

seed().catch(console.error);
