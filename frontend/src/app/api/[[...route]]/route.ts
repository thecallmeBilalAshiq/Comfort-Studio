import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { getSupabase } from '@/lib/supabase';

// Lazy proxy for supabase client to prevent build-time crashes when env vars are missing
const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
}) as any;

// ----------------------------------------------------
// AUTHENTICATION HELPERS
// ----------------------------------------------------

async function authenticate(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check role from users table in Supabase
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decodedToken.uid)
      .maybeSingle();
      
    if (error) throw error;
    
    return {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || userData?.name || '',
      isAdmin: !!decodedToken.admin || !!userData?.is_admin,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Authentication failed');
  }
}

async function authenticateAdmin(req: Request) {
  const user = await authenticate(req);
  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
}

// ----------------------------------------------------
// DATA MAPPING HELPERS
// ----------------------------------------------------

function mapCategory(c: any) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image || '',
    createdAt: c.created_at,
    subcategories: c.subcategories?.map((s: any) => ({ name: s.name, slug: s.slug })) || []
  };
}

function mapProduct(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || '',
    price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : null,
    image: p.image || '',
    categoryId: p.category_id,
    categorySlug: p.categories?.slug || null,
    categoryName: p.categories?.name || null,
    subcategoryId: p.subcategory_id,
    subcategorySlug: p.subcategories?.slug || null,
    subcategoryName: p.subcategories?.name || null,
    stock: Number(p.stock),
    rating: Number(p.rating || 0),
    reviewCount: Number(p.review_count || 0),
    badge: p.badge || '',
    featured: !!p.featured,
    createdAt: p.created_at
  };
}

function mapBanner(b: any) {
  if (!b) return null;
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle || '',
    image: b.image || '',
    bgColor: b.bg_color || '#1a1a2e',
    textColor: b.text_color || '#ffffff',
    active: !!b.active,
    sortOrder: Number(b.sort_order || 0),
    createdAt: b.created_at
  };
}

function mapScrollBanner(sb: any) {
  if (!sb) return null;
  return {
    id: sb.id,
    text: sb.text,
    bgColor: sb.bg_color || '#c8956c',
    textColor: sb.text_color || '#ffffff',
    speed: Number(sb.speed || 20),
    active: !!sb.active,
    sortOrder: Number(sb.sort_order || 0),
    createdAt: sb.created_at
  };
}

function mapUser(u: any) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: !!u.is_admin,
    provider: u.provider || 'local',
    avatar: u.avatar || '',
    createdAt: u.created_at
  };
}

function mapReview(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    productId: r.product_id,
    userId: r.user_id,
    userName: r.user_name || 'Customer',
    rating: Number(r.rating),
    comment: r.comment || '',
    adminReply: r.admin_reply || '',
    adminReplyDate: r.admin_reply_date || null,
    createdAt: r.created_at
  };
}

function mapOrder(o: any) {
  if (!o) return null;
  return {
    id: o.id,
    userId: o.user_id,
    orderNumber: o.order_number,
    total: Number(o.total),
    shipping: Number(o.shipping || 0),
    status: o.status || 'pending',
    shippingName: o.shipping_name,
    shippingEmail: o.shipping_email,
    shippingPhone: o.shipping_phone || '',
    shippingAddress: o.shipping_address,
    shippingCity: o.shipping_city,
    shippingState: o.shipping_state,
    shippingZip: o.shipping_zip,
    shippingCountry: o.shipping_country || 'United States',
    paymentScreenshot: o.payment_screenshot || '',
    createdAt: o.created_at,
    items: o.order_items?.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.products?.name || 'Product',
      productImage: item.products?.image || '',
      quantity: Number(item.quantity),
      price: Number(item.price)
    })) || []
  };
}

function mapContactMessage(m: any) {
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject || '',
    message: m.message,
    read: !!m.read,
    createdAt: m.created_at
  };
}

// ----------------------------------------------------
// ROUTE HANDLERS
// ----------------------------------------------------

async function handleGet(pathSegments: string[], req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // GET /api/products
  if (pathSegments[0] === 'products') {
    // GET /api/products/featured
    if (pathSegments[1] === 'featured') {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug), subcategories(name, slug)')
        .eq('featured', true)
        .order('price', { ascending: false })
        .limit(8);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data.map(mapProduct));
    }
    
    // GET /api/products/best-sellers
    if (pathSegments[1] === 'best-sellers') {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug), subcategories(name, slug)')
        .in('badge', ['Best Seller', 'Top Rated'])
        .order('price', { ascending: false })
        .limit(4);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data.map(mapProduct));
    }

    // GET /api/products/:slug
    if (pathSegments[1] && pathSegments[1] !== 'search') {
      const slug = pathSegments[1];
      const { data: product, error: pError } = await supabase
        .from('products')
        .select('*, categories(name, slug), subcategories(name, slug)')
        .eq('slug', slug)
        .maybeSingle();

      if (pError) return NextResponse.json({ error: pError.message }, { status: 500 });
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      // Get related products (same category, excluding current product)
      const { data: related } = await supabase
        .from('products')
        .select('*, categories(name, slug), subcategories(name, slug)')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(4);

      // Get reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      
      const mappedProduct = mapProduct(product);
      const mappedRelated = (related || []).map(mapProduct);
      const mappedReviews = (reviews || []).map(mapReview);

      const reviewCount = mappedReviews.length;
      const avgRating = reviewCount > 0 
        ? mappedReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / reviewCount 
        : 0;

      return NextResponse.json({
        product: mappedProduct,
        related: mappedRelated,
        reviews: mappedReviews,
        reviewCount,
        avgRating: parseFloat(avgRating.toFixed(1))
      });
    }

    // GET /api/products (List + Filters)
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const badge = searchParams.get('badge');
    const inStock = searchParams.get('inStock');
    const sort = searchParams.get('sort');

    let query = supabase
      .from('products')
      .select('*, categories!inner(name, slug), subcategories(name, slug)');

    if (category) query = query.eq('categories.slug', category);
    if (subcategory) query = query.eq('subcategories.slug', subcategory);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let products = data as any[];

    // In-memory advanced filter rules for search term matching
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p => p.name?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s));
    }
    if (minPrice) products = products.filter(p => Number(p.price) >= Number(minPrice));
    if (maxPrice) products = products.filter(p => Number(p.price) <= Number(maxPrice));
    if (inStock === '1') products = products.filter(p => p.stock > 0);
    
    if (badge) {
      if (badge === 'best-seller') {
        products = products.filter(p => p.badge?.includes('Best Seller') || p.badge?.includes('Top Rated'));
      } else if (badge === 'new') {
        products = products.filter(p => p.badge?.includes('New'));
      } else if (badge === 'sale') {
        products = products.filter(p => p.badge?.includes('Sale'));
      } else if (badge === 'featured') {
        products = products.filter(p => p.featured === true);
      } else {
        products = products.filter(p => p.badge === badge);
      }
    }

    // Sort order mapping
    if (sort === 'price_asc' || sort === 'price-low') {
      products.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price_desc' || sort === 'price-high') {
      products.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === 'rating') {
      products.sort((a, b) => Number(b.rating) - Number(a.rating) || Number(b.review_count) - Number(a.review_count));
    } else if (sort === 'newest') {
      products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'name') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.name.localeCompare(b.name));
    }

    return NextResponse.json(products.map(mapProduct));
  }

  // GET /api/categories
  if (pathSegments[0] === 'categories') {
    // In Supabase, categories has subcategories related via category_id
    const { data, error } = await supabase
      .from('categories')
      .select('*, subcategories(name, slug)')
      .order('name');
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data.map(mapCategory));
  }

  // GET /api/banners
  if (pathSegments[0] === 'banners') {
    if (pathSegments[1] === 'scroll') {
      const { data, error } = await supabase
        .from('scroll_banners')
        .select('*')
        .eq('active', true)
        .order('sort_order');
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data.map(mapScrollBanner));
    }
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('sort_order');
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data.map(mapBanner));
  }

  // GET /api/footer
  if (pathSegments[0] === 'footer') {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'footer')
      .maybeSingle();
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.value || {});
  }

  // GET /api/auth/me
  if (pathSegments[0] === 'auth' && pathSegments[1] === 'me') {
    try {
      const user = await authenticate(req);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) throw error;
      return NextResponse.json(data ? mapUser(data) : user);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
  }

  // GET /api/cart
  if (pathSegments[0] === 'cart') {
    try {
      const user = await authenticate(req);
      const { data, error } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      const formattedItems = (data || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        quantity: Number(item.quantity),
        userId: item.user_id,
        productName: item.products?.name || '',
        price: Number(item.products?.price || 0),
        productImage: item.products?.image || '',
        stock: Number(item.products?.stock || 0)
      }));
      return NextResponse.json(formattedItems);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
  }

  // GET /api/orders
  if (pathSegments[0] === 'orders') {
    // GET /api/orders/track/:orderNumber
    if (pathSegments[1] === 'track' && pathSegments[2]) {
      const orderNumber = pathSegments[2];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('order_number', orderNumber)
        .maybeSingle();
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      return NextResponse.json(mapOrder(data));
    }

    try {
      const user = await authenticate(req);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return NextResponse.json((data || []).map(mapOrder));
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
  }

  // GET /api/reviews/:productId
  if (pathSegments[0] === 'reviews' && pathSegments[1]) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', pathSegments[1])
      .order('created_at', { ascending: false });
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data || []).map(mapReview));
  }

  // ----------------------------------------------------
  // ADMIN READ ENDPOINTS
  // ----------------------------------------------------
  if (pathSegments[0] === 'admin') {
    try {
      await authenticateAdmin(req);
      const sub = pathSegments[1];

      if (sub === 'stats') {
        const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const { count: uCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { data: oData } = await supabase.from('orders').select('total');
        
        const orders = oData || [];
        const ordersCount = orders.length;
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0);
        
        return NextResponse.json({
          stats: {
            products: pCount || 0,
            orders: ordersCount,
            revenue: parseFloat(totalRevenue.toFixed(2)),
            users: uCount || 0
          }
        });
      }

      if (sub === 'products') {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name), subcategories(name)')
          .order('name');
        if (error) throw error;
        return NextResponse.json(data.map(mapProduct));
      }

      if (sub === 'categories') {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        return NextResponse.json(data.map(mapCategory));
      }

      if (sub === 'orders') {
        const { data, error } = await supabase.from('orders').select('*, order_items(*, products(*))').order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data.map(mapOrder));
      }

      if (sub === 'reviews') {
        const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data.map(mapReview));
      }

      if (sub === 'users') {
        const { data, error } = await supabase.from('users').select('*').order('name');
        if (error) throw error;
        return NextResponse.json(data.map(mapUser));
      }

      if (sub === 'banners') {
        const { data, error } = await supabase.from('banners').select('*').order('sort_order');
        if (error) throw error;
        return NextResponse.json(data.map(mapBanner));
      }

      if (sub === 'scroll-banners') {
        const { data, error } = await supabase.from('scroll_banners').select('*').order('sort_order');
        if (error) throw error;
        return NextResponse.json(data.map(mapScrollBanner));
      }

      if (sub === 'contact-messages') {
        const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data.map(mapContactMessage));
      }

      if (sub === 'footer') {
        const { data, error } = await supabase.from('settings').select('value').eq('key', 'footer').maybeSingle();
        if (error) throw error;
        return NextResponse.json(data?.value || {});
      }
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

async function handlePost(pathSegments: string[], req: NextRequest) {
  // POST /api/contact
  if (pathSegments[0] === 'contact') {
    const { name, email, subject, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({ name, email, subject: subject || '', message })
      .select()
      .single();
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id, success: true });
  }

  // POST /api/cart
  if (pathSegments[0] === 'cart') {
    try {
      const user = await authenticate(req);
      const { productId, quantity } = await req.json();
      if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

      // Check if product exists in cart
      const { data: existing, error: findError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        const newQty = (existing.quantity || 0) + (Number(quantity) || 1);
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: newQty })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: Number(quantity) || 1
          });
        if (insertError) throw insertError;
      }

      // Return updated cart
      const { data: cartData, error: getError } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', user.id);
      if (getError) throw getError;
      
      return NextResponse.json((cartData || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        userId: item.user_id,
        productName: item.products?.name || '',
        price: Number(item.products?.price || 0),
        productImage: item.products?.image || '',
        stock: Number(item.products?.stock || 0)
      })));
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
  }

  // POST /api/orders
  if (pathSegments[0] === 'orders') {
    // POST /api/orders/:orderId/screenshot (payment receipt upload)
    if (pathSegments[2] === 'screenshot') {
      try {
        const orderId = pathSegments[1];
        const formData = await req.formData();
        const file = formData.get('screenshot') as File;
        if (!file) return NextResponse.json({ error: 'No screenshot file provided' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `receipts/${orderId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        
        // Upload to Firebase Storage
        const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'comfort-studio.firebasestorage.app');
        const fileRef = bucket.file(fileName);
        
        await fileRef.save(buffer, {
          metadata: { contentType: file.type },
          public: true
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        
        // Save to order document
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_screenshot: publicUrl,
            status: 'awaiting_approval'
          })
          .eq('id', orderId);
          
        if (updateError) throw updateError;

        return NextResponse.json({ screenshotUrl: publicUrl, success: true });
      } catch (e: any) {
        console.error('File upload failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // POST /api/orders (Create new order)
    try {
      const user = await authenticate(req);
      const { items, shipping } = await req.json();
      if (!items || items.length === 0) return NextResponse.json({ error: 'No items in order' }, { status: 400 });

      // Generate order number
      const orderNumber = `CS-${Date.now().toString().slice(-6)}`;
      
      // Calculate total & decrement stock
      let subtotal = 0;
      const orderItemsToInsert = [];
      
      for (const item of items) {
        const { data: prod, error: pErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.productId)
          .maybeSingle();
          
        if (pErr) throw pErr;
        if (!prod) throw new Error(`Product ${item.productId} not found`);
        
        subtotal += Number(prod.price) * (Number(item.quantity) || 1);
        
        // Reduce stock in products
        const currentStock = Number(prod.stock || 0);
        await supabase
          .from('products')
          .update({ stock: Math.max(0, currentStock - (Number(item.quantity) || 1)) })
          .eq('id', prod.id);

        orderItemsToInsert.push({
          product_id: Number(item.productId),
          quantity: Number(item.quantity) || 1,
          price: Number(prod.price)
        });
      }

      const shippingCost = subtotal >= 500 ? 0 : 50;
      const total = subtotal + shippingCost;

      const { data: newOrder, error: oErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total,
          shipping: shippingCost,
          status: 'pending',
          shipping_name: shipping.name || user.name || '',
          shipping_email: shipping.email || user.email || '',
          shipping_phone: shipping.phone || '',
          shipping_address: shipping.address || '',
          shipping_city: shipping.city || '',
          shipping_state: shipping.state || '',
          shipping_zip: shipping.zip || '',
          shipping_country: shipping.country || 'United States'
        })
        .select()
        .single();

      if (oErr) throw oErr;

      // Insert order items
      const itemsWithOrderId = orderItemsToInsert.map(item => ({
        ...item,
        order_id: newOrder.id
      }));
      
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsWithOrderId);
      if (itemsErr) throw itemsErr;

      // Clear user cart in Supabase
      await supabase.from('cart').delete().eq('user_id', user.id);

      // Return order mapped back to JS camelCase
      const { data: finalOrder, error: finalErr } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', newOrder.id)
        .single();
        
      if (finalErr) throw finalErr;

      return NextResponse.json(mapOrder(finalOrder));
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }

  // POST /api/reviews/:productId
  if (pathSegments[0] === 'reviews' && pathSegments[1]) {
    try {
      const user = await authenticate(req);
      const productId = Number(pathSegments[1]);
      const { rating, comment } = await req.json();

      if (!rating) return NextResponse.json({ error: 'Rating required' }, { status: 400 });

      const { data: newReview, error: rErr } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          user_name: user.name || 'Customer',
          rating: Number(rating),
          comment: comment || ''
        })
        .select()
        .single();

      if (rErr) throw rErr;

      // Re-calculate average product rating
      const { data: reviews, error: revsErr } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);
        
      if (revsErr) throw revsErr;

      const reviewCount = reviews.length;
      const avgRating = reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0) / reviewCount;

      await supabase
        .from('products')
        .update({
          rating: parseFloat(avgRating.toFixed(1)),
          review_count: reviewCount
        })
        .eq('id', productId);

      return NextResponse.json(mapReview(newReview));
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
  }

  // ----------------------------------------------------
  // ADMIN POST ENDPOINTS
  // ----------------------------------------------------
  if (pathSegments[0] === 'admin') {
    try {
      await authenticateAdmin(req);
      const sub = pathSegments[1];

      if (sub === 'products') {
        const prod = await req.json();
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: prod.name,
            slug: prod.slug,
            description: prod.description || '',
            price: Number(prod.price),
            original_price: prod.originalPrice ? Number(prod.originalPrice) : null,
            image: prod.image || '',
            category_id: prod.categoryId ? Number(prod.categoryId) : null,
            subcategory_id: prod.subcategoryId ? Number(prod.subcategoryId) : null,
            stock: Number(prod.stock || 10),
            rating: Number(prod.rating || 0),
            review_count: Number(prod.reviewCount || 0),
            badge: prod.badge || '',
            featured: prod.featured === true
          })
          .select()
          .single();
          
        if (error) throw error;
        return NextResponse.json(mapProduct(data));
      }

      if (sub === 'categories') {
        const cat = await req.json();
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: cat.name,
            slug: cat.slug,
            image: cat.image || ''
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Insert subcategories if present
        if (cat.subcategories && cat.subcategories.length > 0) {
          const subs = cat.subcategories.map((s: any) => ({
            category_id: data.id,
            name: s.name,
            slug: s.slug
          }));
          await supabase.from('subcategories').insert(subs);
        }
        
        // Return full category
        const { data: fullCat } = await supabase
          .from('categories')
          .select('*, subcategories(name, slug)')
          .eq('id', data.id)
          .single();
          
        return NextResponse.json(mapCategory(fullCat));
      }

      if (sub === 'banners') {
        const banner = await req.json();
        const { data, error } = await supabase
          .from('banners')
          .insert({
            title: banner.title,
            subtitle: banner.subtitle || '',
            image: banner.image || '',
            bg_color: banner.bgColor || '#1a1a2e',
            text_color: banner.textColor || '#ffffff',
            active: banner.active === true,
            sort_order: Number(banner.sortOrder || 0)
          })
          .select()
          .single();
          
        if (error) throw error;
        return NextResponse.json(mapBanner(data));
      }

      if (sub === 'scroll-banners') {
        const sb = await req.json();
        const { data, error } = await supabase
          .from('scroll_banners')
          .insert({
            text: sb.text,
            bg_color: sb.bgColor || '#c8956c',
            text_color: sb.textColor || '#ffffff',
            speed: Number(sb.speed || 20),
            active: sb.active === true,
            sort_order: Number(sb.sortOrder || 0)
          })
          .select()
          .single();
          
        if (error) throw error;
        return NextResponse.json(mapScrollBanner(data));
      }
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

async function handlePut(pathSegments: string[], req: NextRequest) {
  // PUT /api/cart/:productId
  if (pathSegments[0] === 'cart' && pathSegments[1]) {
    try {
      const user = await authenticate(req);
      const productId = Number(pathSegments[1]);
      const { quantity } = await req.json();

      const { error: updateError } = await supabase
        .from('cart')
        .update({ quantity: Number(quantity) })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (updateError) throw updateError;

      const { data, error: getError } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', user.id);
        
      if (getError) throw getError;
      
      return NextResponse.json((data || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        userId: item.user_id,
        productName: item.products?.name || '',
        price: Number(item.products?.price || 0),
        productImage: item.products?.image || '',
        stock: Number(item.products?.stock || 0)
      })));
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
  }

  // ----------------------------------------------------
  // ADMIN PUT ENDPOINTS
  // ----------------------------------------------------
  if (pathSegments[0] === 'admin' && pathSegments[1]) {
    try {
      await authenticateAdmin(req);
      const sub = pathSegments[1];
      const id = pathSegments[2];

      if (sub === 'products' && id) {
        const data = await req.json();
        const mappedData: any = {};
        
        if (data.name !== undefined) mappedData.name = data.name;
        if (data.slug !== undefined) mappedData.slug = data.slug;
        if (data.description !== undefined) mappedData.description = data.description;
        if (data.price !== undefined) mappedData.price = Number(data.price);
        if (data.originalPrice !== undefined) mappedData.original_price = data.originalPrice ? Number(data.originalPrice) : null;
        if (data.image !== undefined) mappedData.image = data.image;
        if (data.categoryId !== undefined) mappedData.category_id = data.categoryId ? Number(data.categoryId) : null;
        if (data.subcategoryId !== undefined) mappedData.subcategory_id = data.subcategoryId ? Number(data.subcategoryId) : null;
        if (data.stock !== undefined) mappedData.stock = Number(data.stock);
        if (data.badge !== undefined) mappedData.badge = data.badge;
        if (data.featured !== undefined) mappedData.featured = data.featured === true;

        const { error } = await supabase.from('products').update(mappedData).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'categories' && id) {
        const data = await req.json();
        
        // Update category name/slug/image
        const { error } = await supabase.from('categories').update({
          name: data.name,
          slug: data.slug,
          image: data.image || ''
        }).eq('id', id);
        if (error) throw error;

        // Subcategories sync (delete and recreate subcategories for simplicity)
        if (data.subcategories) {
          await supabase.from('subcategories').delete().eq('category_id', id);
          if (data.subcategories.length > 0) {
            const subs = data.subcategories.map((s: any) => ({
              category_id: id,
              name: s.name,
              slug: s.slug
            }));
            await supabase.from('subcategories').insert(subs);
          }
        }
        return NextResponse.json({ success: true });
      }

      if (sub === 'orders' && id) {
        const { status } = await req.json();
        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'banners' && id) {
        const data = await req.json();
        const mappedData: any = {};
        if (data.title !== undefined) mappedData.title = data.title;
        if (data.subtitle !== undefined) mappedData.subtitle = data.subtitle;
        if (data.image !== undefined) mappedData.image = data.image;
        if (data.bgColor !== undefined) mappedData.bg_color = data.bgColor;
        if (data.textColor !== undefined) mappedData.text_color = data.textColor;
        if (data.active !== undefined) mappedData.active = data.active === true;
        if (data.sortOrder !== undefined) mappedData.sort_order = Number(data.sortOrder);

        const { error } = await supabase.from('banners').update(mappedData).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'scroll-banners' && id) {
        const data = await req.json();
        const mappedData: any = {};
        if (data.text !== undefined) mappedData.text = data.text;
        if (data.bgColor !== undefined) mappedData.bg_color = data.bgColor;
        if (data.textColor !== undefined) mappedData.text_color = data.textColor;
        if (data.speed !== undefined) mappedData.speed = Number(data.speed);
        if (data.active !== undefined) mappedData.active = data.active === true;
        if (data.sortOrder !== undefined) mappedData.sort_order = Number(data.sortOrder);

        const { error } = await supabase.from('scroll_banners').update(mappedData).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'reviews' && id) {
        const { adminReply } = await req.json();
        const { error } = await supabase
          .from('reviews')
          .update({
            admin_reply: adminReply || '',
            admin_reply_date: new Date().toISOString()
          })
          .eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'contact-messages' && id && pathSegments[3] === 'read') {
        const { error } = await supabase.from('contact_messages').update({ read: true }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'footer') {
        const data = await req.json();
        const { error } = await supabase.from('settings').upsert({
          key: 'footer',
          value: data
        });
        if (error) throw error;
        return NextResponse.json({ success: true });
      }
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

async function handleDelete(pathSegments: string[], req: NextRequest) {
  // DELETE /api/cart/:productId
  if (pathSegments[0] === 'cart' && pathSegments[1]) {
    try {
      const user = await authenticate(req);
      const productId = Number(pathSegments[1]);

      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      const { data, error: getError } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', user.id);
        
      if (getError) throw getError;
      
      return NextResponse.json((data || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        userId: item.user_id,
        productName: item.products?.name || '',
        price: Number(item.products?.price || 0),
        productImage: item.products?.image || '',
        stock: Number(item.products?.stock || 0)
      })));
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
  }

  // ----------------------------------------------------
  // ADMIN DELETE ENDPOINTS
  // ----------------------------------------------------
  if (pathSegments[0] === 'admin' && pathSegments[1] && pathSegments[2]) {
    try {
      await authenticateAdmin(req);
      const sub = pathSegments[1];
      const id = pathSegments[2];

      if (sub === 'products') {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'categories') {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'banners') {
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'scroll-banners') {
        const { error } = await supabase.from('scroll_banners').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'reviews') {
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'contact-messages') {
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      if (sub === 'users') {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        
        // Also delete from Firebase Auth
        try {
          await adminAuth.deleteUser(id);
        } catch {}
        return NextResponse.json({ success: true });
      }
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// ----------------------------------------------------
// EXPORT HANDLERS
// ----------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const route = (await params).route || [];
  return handleGet(route, request);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const route = (await params).route || [];
  return handlePost(route, request);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const route = (await params).route || [];
  return handlePut(route, request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const route = (await params).route || [];
  return handleDelete(route, request);
}
