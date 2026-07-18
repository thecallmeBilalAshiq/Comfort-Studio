import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
const fullPath = path.resolve(__dirname, '..', serviceAccountPath);

if (!fs.existsSync(fullPath)) {
  console.error(`Firebase service account file not found at ${fullPath}. Cannot migrate.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
initializeApp({
  credential: cert(serviceAccount)
});

const firestore = getFirestore();

// Initialize SQLite
import db, { initDB } from './db';

async function migrate() {
  await initDB();
  console.log('--- Starting Migration from SQLite to Firestore ---');

  try {
    // 1. Migrate Categories & Subcategories
    console.log('Migrating categories...');
    const categories = db.prepare('SELECT * FROM categories').all();
    for (const cat of categories) {
      const subcategories = db.prepare('SELECT name, slug FROM subcategories WHERE categoryId = ?').all(cat.id);
      
      const firestoreCat = {
        id: String(cat.id),
        name: cat.name,
        slug: cat.slug,
        image: cat.image || '',
        createdAt: cat.createdAt || new Date().toISOString(),
        subcategories: subcategories.map((sub: any) => ({ name: sub.name, slug: sub.slug }))
      };

      await firestore.collection('categories').doc(String(cat.id)).set(firestoreCat);
    }
    console.log(`Migrated ${categories.length} categories.`);

    // 2. Migrate Products
    console.log('Migrating products...');
    const products = db.prepare('SELECT * FROM products').all();
    for (const prod of products) {
      // Get category and subcategory slug
      const cat = db.prepare('SELECT slug, name FROM categories WHERE id = ?').get(prod.categoryId) as any;
      const sub = db.prepare('SELECT slug, name FROM subcategories WHERE id = ?').get(prod.subcategoryId) as any;

      const firestoreProd = {
        id: String(prod.id),
        name: prod.name,
        slug: prod.slug,
        description: prod.description || '',
        price: Number(prod.price),
        originalPrice: prod.originalPrice ? Number(prod.originalPrice) : null,
        image: prod.image || '',
        categoryId: prod.categoryId ? String(prod.categoryId) : null,
        categorySlug: cat ? cat.slug : null,
        categoryName: cat ? cat.name : null,
        subcategoryId: prod.subcategoryId ? String(prod.subcategoryId) : null,
        subcategorySlug: sub ? sub.slug : null,
        subcategoryName: sub ? sub.name : null,
        stock: Number(prod.stock),
        rating: Number(prod.rating || 0),
        reviewCount: Number(prod.reviewCount || 0),
        badge: prod.badge || '',
        featured: Number(prod.featured) === 1,
        createdAt: prod.createdAt || new Date().toISOString()
      };

      await firestore.collection('products').doc(String(prod.id)).set(firestoreProd);
    }
    console.log(`Migrated ${products.length} products.`);

    // 3. Migrate Banners
    console.log('Migrating banners...');
    const banners = db.prepare('SELECT * FROM banners').all();
    for (const banner of banners) {
      await firestore.collection('banners').doc(String(banner.id)).set({
        id: String(banner.id),
        title: banner.title,
        subtitle: banner.subtitle || '',
        image: banner.image || '',
        bgColor: banner.bgColor || '#1a1a2e',
        textColor: banner.textColor || '#ffffff',
        active: Number(banner.active) === 1,
        sortOrder: Number(banner.sortOrder || 0),
        createdAt: banner.createdAt || new Date().toISOString()
      });
    }
    console.log(`Migrated ${banners.length} banners.`);

    // 4. Migrate Scroll Banners
    console.log('Migrating scroll banners...');
    const scrollBanners = db.prepare('SELECT * FROM scroll_banners').all();
    for (const sb of scrollBanners) {
      await firestore.collection('scroll_banners').doc(String(sb.id)).set({
        id: String(sb.id),
        text: sb.text,
        bgColor: sb.bgColor || '#c8956c',
        textColor: sb.textColor || '#ffffff',
        speed: Number(sb.speed || 20),
        active: Number(sb.active) === 1,
        sortOrder: Number(sb.sortOrder || 0),
        createdAt: sb.createdAt || new Date().toISOString()
      });
    }
    console.log(`Migrated ${scrollBanners.length} scroll banners.`);

    // 5. Migrate Footer
    console.log('Migrating footer...');
    const footers = db.prepare('SELECT * FROM footer').all();
    if (footers.length > 0) {
      const ft = footers[0];
      await firestore.collection('settings').doc('footer').set({
        tagline: ft.tagline || '',
        copyright: ft.copyright || '',
        address: ft.address || '',
        phone: ft.phone || '',
        email: ft.email || '',
        hours: ft.hours || '',
        socialLinks: JSON.parse(ft.socialLinks || '[]'),
        quickLinks: JSON.parse(ft.quickLinks || '[]'),
        customerServiceLinks: JSON.parse(ft.customerServiceLinks || '[]'),
        paymentIcons: JSON.parse(ft.paymentIcons || '[]')
      });
    }
    console.log('Migrated footer.');

    // 6. Migrate Users (To maintain user profiles and roles)
    console.log('Migrating users...');
    const users = db.prepare('SELECT * FROM users').all();
    for (const user of users) {
      // In Firestore, we will store user profiles.
      // Firebase Auth manages authentication, but user profiles/roles go into firestore collection 'users'
      // Since SQLite users have auto-increment IDs, we can map their SQLite user ID to a document in Firestore.
      // Later when they log in with Firebase, we can map their email to find this user record.
      await firestore.collection('users').doc(String(user.id)).set({
        id: String(user.id),
        name: user.name,
        email: user.email.toLowerCase(),
        isAdmin: Number(user.isAdmin) === 1,
        provider: user.provider || 'local',
        avatar: user.avatar || '',
        createdAt: user.createdAt || new Date().toISOString()
      });
    }
    console.log(`Migrated ${users.length} users.`);

    // 7. Migrate Reviews
    console.log('Migrating reviews...');
    const reviews = db.prepare('SELECT * FROM reviews').all();
    for (const rev of reviews) {
      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(rev.userId) as any;
      await firestore.collection('reviews').doc(String(rev.id)).set({
        id: String(rev.id),
        productId: String(rev.productId),
        userId: String(rev.userId),
        userName: user ? user.name : 'Customer',
        rating: Number(rev.rating),
        comment: rev.comment || '',
        adminReply: rev.adminReply || '',
        adminReplyDate: rev.adminReplyDate || null,
        createdAt: rev.createdAt || new Date().toISOString()
      });
    }
    console.log(`Migrated ${reviews.length} reviews.`);

    // 8. Migrate Orders
    console.log('Migrating orders...');
    const orders = db.prepare('SELECT * FROM orders').all();
    for (const order of orders) {
      const orderItems = db.prepare(`
        SELECT oi.*, p.name as productName, p.image as productImage 
        FROM order_items oi 
        LEFT JOIN products p ON oi.productId = p.id 
        WHERE oi.orderId = ?
      `).all(order.id);

      const items = orderItems.map((item: any) => ({
        id: String(item.id),
        productId: String(item.productId),
        productName: item.productName || 'Product',
        productImage: item.productImage || '',
        quantity: Number(item.quantity),
        price: Number(item.price)
      }));

      await firestore.collection('orders').doc(String(order.id)).set({
        id: String(order.id),
        userId: String(order.userId),
        orderNumber: order.orderNumber || `CS-${1000 + order.id}`,
        total: Number(order.total),
        shipping: Number(order.shipping || 0),
        status: order.status || 'pending',
        shippingName: order.shippingName || '',
        shippingEmail: order.shippingEmail || '',
        shippingPhone: order.shippingPhone || '',
        shippingAddress: order.shippingAddress || '',
        shippingCity: order.shippingCity || '',
        shippingState: order.shippingState || '',
        shippingZip: order.shippingZip || '',
        shippingCountry: order.shippingCountry || 'United States',
        paymentScreenshot: order.paymentScreenshot || '',
        items: items,
        createdAt: order.createdAt || new Date().toISOString()
      });
    }
    console.log(`Migrated ${orders.length} orders.`);

    console.log('--- Migration Finished Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
}

migrate();
