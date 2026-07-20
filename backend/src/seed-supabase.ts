import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';
import { mockCatalog } from '../../frontend/src/data/mockCatalog';

// Load environment variables from frontend/.env.local
dotenv.config({ path: path.join(__dirname, '..', '..', 'frontend', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runSeed() {
  console.log('--- Seeding Strict Categories and Mock Products with Explicit IDs ---');

  try {
    // 1. Delete dependent table entries
    console.log('Clearing dependent tables: order_items, reviews, cart...');
    await supabase.from('order_items').delete().neq('id', 0);
    await supabase.from('reviews').delete().neq('id', 0);
    await supabase.from('cart').delete().neq('id', 0);

    // 2. Delete products
    console.log('Clearing products...');
    await supabase.from('products').delete().neq('id', 0);

    // 3. Delete subcategories
    console.log('Clearing subcategories...');
    await supabase.from('subcategories').delete().neq('id', 0);

    // 4. Delete categories
    console.log('Clearing categories...');
    await supabase.from('categories').delete().neq('id', 0);

    // 5. Insert new categories with explicit IDs
    console.log(`Inserting ${mockCatalog.length} strict categories...`);
    for (const cat of mockCatalog) {
      const { data: insertedCats, error: catErr } = await supabase
        .from('categories')
        .insert({
          id: cat.id, // Explicit ID!
          name: cat.name,
          slug: cat.slug,
          image: cat.image
        })
        .select();

      if (catErr || !insertedCats || insertedCats.length === 0) {
        throw new Error(`Failed to insert category ${cat.name}: ${catErr?.message}`);
      }

      console.log(`Created category: ${cat.name} (ID: ${cat.id})`);

      // 6. Insert products with explicit IDs belonging to this category
      console.log(`Inserting ${cat.products.length} products for ${cat.name}...`);
      for (const prod of cat.products) {
        const { error: prodErr } = await supabase
          .from('products')
          .insert({
            id: prod.id, // Explicit ID!
            name: prod.name,
            slug: prod.slug,
            description: prod.description,
            price: prod.price,
            original_price: prod.originalPrice,
            image: prod.image,
            badge: prod.badge,
            stock: prod.stock,
            rating: prod.rating,
            review_count: prod.reviewCount,
            category_id: cat.id, // Reference the category's explicit ID!
            featured: prod.id % 2 === 1
          });

        if (prodErr) {
          throw new Error(`Failed to insert product ${prod.name}: ${prodErr.message}`);
        }
      }
    }

    console.log('--- Database Seeding Succeeded Successfully with Explicit IDs! ---');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed with error:', err);
    process.exit(1);
  }
}

runSeed();
