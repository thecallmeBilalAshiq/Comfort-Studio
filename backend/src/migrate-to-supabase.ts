import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.join(__dirname, '..', '..', 'frontend', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Initialize SQLite
import db, { initDB } from './db';

async function migrate() {
  await initDB();
  console.log('--- Starting Migration from SQLite to Supabase ---');

  try {
    // 1. Migrate Categories
    console.log('Migrating categories...');
    const categories = db.prepare('SELECT * FROM categories').all();
    const mappedCategories = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image || '',
      created_at: cat.createdAt || new Date().toISOString()
    }));

    if (mappedCategories.length > 0) {
      const { error } = await supabase.from('categories').upsert(mappedCategories);
      if (error) throw new Error(`Categories migration failed: ${error.message}`);
    }
    console.log(`Migrated ${categories.length} categories.`);

    // 2. Migrate Subcategories
    console.log('Migrating subcategories...');
    const subcategories = db.prepare('SELECT * FROM subcategories').all();
    const mappedSubcategories = subcategories.map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      category_id: sub.categoryId
    }));

    if (mappedSubcategories.length > 0) {
      const { error } = await supabase.from('subcategories').upsert(mappedSubcategories);
      if (error) throw new Error(`Subcategories migration failed: ${error.message}`);
    }
    console.log(`Migrated ${subcategories.length} subcategories.`);

    // 3. Migrate Products
    console.log('Migrating products...');
    const validCatIds = new Set(mappedCategories.map(c => c.id));
    const validSubcatIds = new Set(mappedSubcategories.map(s => s.id));

    const products = db.prepare('SELECT * FROM products').all();
    const mappedProducts = products.map((prod: any) => ({
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description || '',
      price: Number(prod.price),
      original_price: prod.originalPrice ? Number(prod.originalPrice) : null,
      image: prod.image || '',
      category_id: (prod.categoryId && validCatIds.has(prod.categoryId)) ? prod.categoryId : null,
      subcategory_id: (prod.subcategoryId && validSubcatIds.has(prod.subcategoryId)) ? prod.subcategoryId : null,
      stock: Number(prod.stock),
      rating: Number(prod.rating || 0),
      review_count: Number(prod.reviewCount || 0),
      badge: prod.badge || '',
      featured: Number(prod.featured) === 1,
      created_at: prod.createdAt || new Date().toISOString()
    }));

    if (mappedProducts.length > 0) {
      const { error } = await supabase.from('products').upsert(mappedProducts);
      if (error) throw new Error(`Products migration failed: ${error.message}`);
    }
    console.log(`Migrated ${products.length} products.`);

    // 4. Migrate Banners
    console.log('Migrating banners...');
    const banners = db.prepare('SELECT * FROM banners').all();
    const mappedBanners = banners.map((b: any) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image || '',
      bg_color: b.bgColor || '#1a1a2e',
      text_color: b.textColor || '#ffffff',
      active: Number(b.active) === 1,
      sort_order: Number(b.sortOrder || 0),
      created_at: b.createdAt || new Date().toISOString()
    }));

    if (mappedBanners.length > 0) {
      const { error } = await supabase.from('banners').upsert(mappedBanners);
      if (error) throw new Error(`Banners migration failed: ${error.message}`);
    }
    console.log(`Migrated ${banners.length} banners.`);

    // 5. Migrate Scroll Banners
    console.log('Migrating scroll banners...');
    const scrollBanners = db.prepare('SELECT * FROM scroll_banners').all();
    const mappedScrollBanners = scrollBanners.map((sb: any) => ({
      id: sb.id,
      text: sb.text,
      bg_color: sb.bgColor || '#c8956c',
      text_color: sb.textColor || '#ffffff',
      speed: Number(sb.speed || 20),
      active: Number(sb.active) === 1,
      sort_order: Number(sb.sortOrder || 0),
      created_at: sb.createdAt || new Date().toISOString()
    }));

    if (mappedScrollBanners.length > 0) {
      const { error } = await supabase.from('scroll_banners').upsert(mappedScrollBanners);
      if (error) throw new Error(`Scroll banners migration failed: ${error.message}`);
    }
    console.log(`Migrated ${scrollBanners.length} scroll banners.`);

    // 6. Migrate Footer (Settings)
    console.log('Migrating footer settings...');
    const footers = db.prepare('SELECT * FROM footer').all();
    if (footers.length > 0) {
      const ft = footers[0];
      const footerValue = {
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
      };

      const { error } = await supabase.from('settings').upsert({
        key: 'footer',
        value: footerValue
      });
      if (error) throw new Error(`Footer migration failed: ${error.message}`);
    }
    console.log('Migrated footer.');

    // 7. Migrate Users
    console.log('Migrating users...');
    const users = db.prepare('SELECT * FROM users').all();
    const mappedUsers = users.map((u: any) => ({
      id: String(u.id),
      name: u.name,
      email: u.email.toLowerCase(),
      is_admin: Number(u.isAdmin) === 1,
      provider: u.provider || 'local',
      avatar: u.avatar || '',
      created_at: u.createdAt || new Date().toISOString()
    }));

    if (mappedUsers.length > 0) {
      const { error } = await supabase.from('users').upsert(mappedUsers);
      if (error) throw new Error(`Users migration failed: ${error.message}`);
    }
    console.log(`Migrated ${users.length} users.`);

    // 8. Migrate Reviews
    console.log('Migrating reviews...');
    const validProductIds = new Set(mappedProducts.map(p => p.id));
    const reviews = db.prepare('SELECT * FROM reviews').all();
    const mappedReviews = reviews
      .filter((r: any) => r.productId && validProductIds.has(r.productId))
      .map((r: any) => ({
        id: r.id,
        product_id: r.productId,
        user_id: String(r.userId),
        user_name: db.prepare('SELECT name FROM users WHERE id = ?').get(r.userId)?.name || 'Customer',
        rating: Number(r.rating),
        comment: r.comment || '',
        admin_reply: r.adminReply || '',
        admin_reply_date: r.adminReplyDate || null,
        created_at: r.createdAt || new Date().toISOString()
      }));

    if (mappedReviews.length > 0) {
      const { error } = await supabase.from('reviews').upsert(mappedReviews);
      if (error) throw new Error(`Reviews migration failed: ${error.message}`);
    }
    console.log(`Migrated ${mappedReviews.length} reviews.`);

    // 9. Migrate Orders
    console.log('Migrating orders...');
    const orders = db.prepare('SELECT * FROM orders').all();
    const mappedOrders = orders.map((o: any) => ({
      id: o.id,
      user_id: String(o.userId),
      order_number: o.orderNumber || `CS-${1000 + o.id}`,
      total: Number(o.total),
      shipping: Number(o.shipping || 0),
      status: o.status || 'pending',
      shipping_name: o.shippingName || '',
      shipping_email: o.shippingEmail || '',
      shipping_phone: o.shippingPhone || '',
      shipping_address: o.shippingAddress || '',
      shipping_city: o.shippingCity || '',
      shipping_state: o.shippingState || '',
      shipping_zip: o.shippingZip || '',
      shipping_country: o.shippingCountry || 'United States',
      payment_screenshot: o.paymentScreenshot || '',
      created_at: o.createdAt || new Date().toISOString()
    }));

    if (mappedOrders.length > 0) {
      const { error } = await supabase.from('orders').upsert(mappedOrders);
      if (error) throw new Error(`Orders migration failed: ${error.message}`);
    }
    console.log(`Migrated ${orders.length} orders.`);

    // 10. Migrate Order Items
    console.log('Migrating order items...');
    const validOrderIds = new Set(mappedOrders.map(o => o.id));
    const orderItems = db.prepare('SELECT * FROM order_items').all();
    const mappedOrderItems = orderItems
      .filter((oi: any) => oi.productId && validProductIds.has(oi.productId) && oi.orderId && validOrderIds.has(oi.orderId))
      .map((oi: any) => ({
        id: oi.id,
        order_id: oi.orderId,
        product_id: oi.productId,
        quantity: Number(oi.quantity),
        price: Number(oi.price)
      }));

    if (mappedOrderItems.length > 0) {
      const { error } = await supabase.from('order_items').upsert(mappedOrderItems);
      if (error) throw new Error(`Order items migration failed: ${error.message}`);
    }
    console.log(`Migrated ${mappedOrderItems.length} order items.`);

    console.log('\n--- Migration Finished Successfully! ---');
    console.log('\n========================================================================');
    console.log('⚠️ IMPORTANT POST-MIGRATION SQL INSTRUCTIONS');
    console.log('Run the following SQL commands in your Supabase SQL Editor to reset');
    console.log('the auto-increment sequences so new inserts do not clash with migrated IDs:');
    console.log('------------------------------------------------------------------------');
    console.log("SELECT setval(pg_get_serial_sequence('categories', 'id'), coalesce(max(id), 1)) FROM categories;");
    console.log("SELECT setval(pg_get_serial_sequence('subcategories', 'id'), coalesce(max(id), 1)) FROM subcategories;");
    console.log("SELECT setval(pg_get_serial_sequence('products', 'id'), coalesce(max(id), 1)) FROM products;");
    console.log("SELECT setval(pg_get_serial_sequence('banners', 'id'), coalesce(max(id), 1)) FROM banners;");
    console.log("SELECT setval(pg_get_serial_sequence('scroll_banners', 'id'), coalesce(max(id), 1)) FROM scroll_banners;");
    console.log("SELECT setval(pg_get_serial_sequence('reviews', 'id'), coalesce(max(id), 1)) FROM reviews;");
    console.log("SELECT setval(pg_get_serial_sequence('orders', 'id'), coalesce(max(id), 1)) FROM orders;");
    console.log("SELECT setval(pg_get_serial_sequence('order_items', 'id'), coalesce(max(id), 1)) FROM order_items;");
    console.log("SELECT setval(pg_get_serial_sequence('cart', 'id'), coalesce(max(id), 1)) FROM cart;");
    console.log("SELECT setval(pg_get_serial_sequence('contact_messages', 'id'), coalesce(max(id), 1)) FROM contact_messages;");
    console.log('========================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
}

migrate();
