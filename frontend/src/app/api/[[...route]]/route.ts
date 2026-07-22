import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { mockCatalog } from '@/data/mockCatalog';
import { sendOrderConfirmationEmail, sendContactFormEmail } from '@/lib/email';

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
    let user: any;
    const { data: { user: sbUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !sbUser) {
      // In local development, if system clocks are out of sync (causing fake token expiration),
      // we fall back to manually decoding the token for local testing.
      if (process.env.NODE_ENV === 'development' || !process.env.VERCEL) {
        console.warn('[Dev Authentication Fallback]: Token verification failed, manually decoding JWT payload:', authError?.message || 'No user found');
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            user = {
              id: payload.user_id || payload.sub,
              email: payload.email || '',
              user_metadata: { name: payload.name || '' }
            };
          } else {
            throw authError || new Error('Invalid token structure');
          }
        } catch (decodeError) {
          throw authError || new Error('Invalid token');
        }
      } else {
        throw authError || new Error('Invalid token');
      }
    } else {
      user = sbUser;
    }
    
    // Check role from users table in Supabase
    let { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (error) throw error;

    // Fallback to match by email if ID is not found (e.g. user in auth but not in users table yet)
    if (!userData && user.email) {
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();
      
      if (!emailError && emailUser) {
        userData = emailUser;
      }
    }
    
    return {
      id: userData?.id || user.id,
      email: user.email || '',
      name: userData?.name || user.user_metadata?.name || '',
      isAdmin: !!userData?.is_admin || user.email?.toLowerCase() === 'comfortstudiouk@gmail.com',
    };
  } catch (error: any) {
    console.error('[Authentication Error]:', error);
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

async function authenticateOptional(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }
  try {
    return await authenticate(req);
  } catch (error) {
    console.warn('[Optional Authentication Fallback]: Proceeding as guest due to validation error:', error);
    return null;
  }
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
    subcategories: c.subcategories?.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug })) || []
  };
}

function safeParseJson(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val;
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
    createdAt: p.created_at,
    galleryImages: safeParseJson(p.gallery_images || p.galleryImages, []),
    colors: safeParseJson(p.colors, []),
    sizes: safeParseJson(p.sizes, []),
    storageOptions: safeParseJson(p.storage_options || p.storageOptions, []),
    mattressOptions: safeParseJson(p.mattress_options || p.mattressOptions, [])
  };
}

function mapCartItem(item: any) {
  if (!item) return null;
  const prod = mapProduct(item.products);
  return {
    id: item.id,
    userId: item.user_id,
    productId: item.product_id,
    quantity: Number(item.quantity),
    name: prod?.name || '',
    image: prod?.image || '',
    price: item.price ? Number(item.price) : (prod?.price || 0),
    slug: prod?.slug || '',
    stock: prod?.stock || 0,
    selectedSize: item.selected_size || '',
    selectedColor: item.selected_color || '',
    selectedStorage: item.selected_storage || '',
    selectedMattress: item.selected_mattress || ''
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
    productName: r.products?.name || 'Product',
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
    customerName: o.users?.name || o.shipping_name || 'Customer',
    customerEmail: o.users?.email || o.shipping_email || '',
    orderNumber: o.order_number,
    total: Number(o.total),
    shipping: Number(o.shipping || 0),
    status: o.status || 'pending',
    shippingName: o.shipping_name,
    shippingEmail: o.shipping_email,
    shippingPhone: o.shipping_phone || '',
    shippingCity: o.shipping_city,
    shippingPostalCode: o.shipping_zip || '',
    paymentScreenshot: o.payment_screenshot || '',
    createdAt: o.created_at,
    items: o.order_items?.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.products?.name || 'Product',
      productImage: item.products?.image || '',
      name: item.products?.name || 'Product',
      image: item.products?.image || '',
      slug: item.products?.slug || '',
      quantity: Number(item.quantity),
      price: Number(item.price),
      selectedSize: item.selected_size || '',
      selectedColor: item.selected_color || '',
      selectedStorage: item.selected_storage || '',
      selectedMattress: item.selected_mattress || ''
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
    let dbProducts: any[] = [];
    let useFallback = false;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug), subcategories(name, slug)');
      
      if (error) throw error;
      if (data && data.length > 0) {
        dbProducts = data;
      } else {
        useFallback = true;
      }
    } catch (err) {
      console.error('Failed to fetch products from Supabase, using mockCatalog:', err);
      useFallback = true;
    }

    if (useFallback) {
      // Construct in-memory products matching Supabase structure for mapping compatibility
      dbProducts = [];
      for (const cat of mockCatalog) {
        for (const p of cat.products) {
          dbProducts.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: p.price,
            original_price: p.originalPrice,
            image: p.image,
            category_id: cat.id,
            subcategory_id: p.subcategoryId || null,
            stock: p.stock,
            rating: p.rating,
            review_count: p.reviewCount,
            badge: p.badge,
            featured: p.id % 2 === 1,
            categories: { name: cat.name, slug: cat.slug },
            subcategories: p.subcategorySlug ? { name: p.subcategoryName, slug: p.subcategorySlug } : null,
            gallery_images: p.galleryImages || [],
            colors: p.colors || [],
            sizes: p.sizes || [],
            storage_options: p.storageOptions || [],
            mattress_options: p.mattressOptions || [],
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // GET /api/products/featured
    if (pathSegments[1] === 'featured') {
      const featured = dbProducts.filter(p => p.featured).slice(0, 8);
      return NextResponse.json(featured.map(mapProduct));
    }
    
    // GET /api/products/best-sellers
    if (pathSegments[1] === 'best-sellers') {
      const bestSellers = dbProducts.filter(p => p.badge === 'Best Seller' || p.badge === 'Top Choice' || p.badge === 'Trending').slice(0, 4);
      return NextResponse.json(bestSellers.map(mapProduct));
    }

    // GET /api/products/:slug
    if (pathSegments[1] && pathSegments[1] !== 'search') {
      const slug = pathSegments[1];
      const product = dbProducts.find(p => p.slug === slug);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      const related = dbProducts.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);

      const reviews = [
        {
          id: 1,
          product_id: product.id,
          user_id: '1',
          user_name: 'Sarah Jenkins',
          rating: 5,
          comment: 'Absolutely stunning furniture! Delivered fast and built to perfection.',
          admin_reply: 'Thank you Sarah! We hope you love your new purchase.',
          admin_reply_date: new Date().toISOString(),
          created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 2,
          product_id: product.id,
          user_id: '2',
          user_name: 'David Miller',
          rating: 4,
          comment: 'Very comfortable and fits the room perfectly. Minor delays on delivery, but excellent support.',
          admin_reply: '',
          admin_reply_date: null,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ];
      
      const mappedProduct = mapProduct(product);
      const mappedRelated = related.map(mapProduct);
      const mappedReviews = reviews.map(mapReview);

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

    let products = [...dbProducts];

    if (category) products = products.filter(p => p.categories.slug === category);
    if (subcategory) products = products.filter(p => p.subcategories?.slug === subcategory);

    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p => p.name?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s));
    }
    if (minPrice) products = products.filter(p => Number(p.price) >= Number(minPrice));
    if (maxPrice) products = products.filter(p => Number(p.price) <= Number(maxPrice));
    if (inStock === '1') products = products.filter(p => p.stock > 0);
    
    if (badge) {
      if (badge === 'best-seller') {
        products = products.filter(p => p.badge?.includes('Best Seller') || p.badge?.includes('Top Choice'));
      } else if (badge === 'new') {
        products = products.filter(p => p.badge?.includes('New'));
      } else if (badge === 'sale') {
        products = products.filter(p => p.badge?.includes('OFF') || p.badge?.includes('Save'));
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
    let categoriesData: any[] = [];
    let useFallback = false;

    try {
      const { data: cats, error: catsErr } = await supabase
        .from('categories')
        .select('*, subcategories(id, name, slug)')
        .order('name');
      
      if (catsErr) throw catsErr;
      if (cats && cats.length > 0) {
        // Count products for each category
        const { data: countData, error: countErr } = await supabase
          .from('products')
          .select('category_id');
        if (countErr) throw countErr;

        const countMap: Record<number, number> = {};
        if (countData) {
          countData.forEach((p: any) => {
            if (p.category_id) {
              countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
            }
          });
        }

        categoriesData = cats.map((c: any) => {
          const mappedCat = mapCategory(c) as any;
          mappedCat.productCount = countMap[c.id] || 0;
          return mappedCat;
        });
      } else {
        useFallback = true;
      }
    } catch (err) {
      console.error('Failed to fetch categories from Supabase, using fallback:', err);
      useFallback = true;
    }

    if (useFallback) {
      categoriesData = mockCatalog.map((cat) => {
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image,
          createdAt: new Date().toISOString(),
          subcategories: [],
          productCount: cat.products.length
        };
      });
    }
    return NextResponse.json(categoriesData);
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
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) throw error;

      if (!data) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            name: user.name || user.email.split('@')[0] || 'Customer',
            email: user.email.toLowerCase(),
            is_admin: user.isAdmin || false,
            provider: 'firebase',
            avatar: ''
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Failed to auto-create user in Supabase:', insertError);
        } else {
          data = newUser;
        }
      }

      return NextResponse.json(data ? mapUser(data) : user);
    } catch (e: any) {
      const status = e.message === 'No token provided' || e.message === 'Authentication failed' ? 401 : 500;
      return NextResponse.json({ error: e.message }, { status });
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
      
      return NextResponse.json((data || []).map(mapCartItem));
    } catch (e: any) {
      const status = e.message === 'No token provided' || e.message === 'Authentication failed' ? 401 : 500;
      return NextResponse.json({ error: e.message }, { status });
    }
  }

  // GET /api/orders
  if (pathSegments[0] === 'orders') {
    // GET /api/orders/track/:orderNumber
    if (pathSegments[1] === 'track' && pathSegments[2]) {
      const rawInput = decodeURIComponent(pathSegments[2]).trim().replace(/^#/, '');
      const email = searchParams.get('email')?.trim().toLowerCase();
      
      if (!rawInput) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      }

      const searchCandidates = [rawInput];
      if (!rawInput.toUpperCase().startsWith('CS-')) {
        searchCandidates.push(`CS-${rawInput}`);
      }

      // 1. Try order_number exact match
      let { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .in('order_number', searchCandidates)
        .maybeSingle();
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // 2. Try numeric ID match if input is number
      if (!data && /^\d+$/.test(rawInput)) {
        const { data: idMatch } = await supabase
          .from('orders')
          .select('*, order_items(*, products(*))')
          .eq('id', Number(rawInput))
          .maybeSingle();
        if (idMatch) data = idMatch;
      }

      // 3. Fallback partial order_number search
      if (!data) {
        const { data: ilikeMatches } = await supabase
          .from('orders')
          .select('*, order_items(*, products(*))')
          .ilike('order_number', `%${rawInput}%`)
          .limit(1);
        if (ilikeMatches && ilikeMatches.length > 0) {
          data = ilikeMatches[0];
        }
      }

      if (!data) return NextResponse.json({ error: 'Order not found. Please check your Order ID and try again.' }, { status: 404 });

      // Check email matching ONLY if caller passed an email parameter
      if (email) {
        const orderEmail = (data.shipping_email || '').trim().toLowerCase();
        if (orderEmail && orderEmail !== email) {
          return NextResponse.json({ error: 'Order found, but the email address does not match this order.' }, { status: 403 });
        }
      }

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
      const status = e.message === 'No token provided' || e.message === 'Authentication failed' ? 401 : 500;
      return NextResponse.json({ error: e.message }, { status });
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
        const { count: uCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_admin', false);
        const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: pendingCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        const { count: reviewCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
        
        const { data: revenueData } = await supabase.from('orders').select('total');
        const totalRevenue = (revenueData || []).reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

        const { data: ratingData } = await supabase.from('reviews').select('rating');
        const totalRating = (ratingData || []).reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
        const avgRating = ratingData && ratingData.length > 0 ? (totalRating / ratingData.length) : 0;

        const { data: recentOrdersData } = await supabase
          .from('orders')
          .select('*, users(name)')
          .order('created_at', { ascending: false })
          .limit(5);

        return NextResponse.json({
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalProducts: pCount || 0,
          totalOrders: oCount || 0,
          totalUsers: uCount || 0,
          pendingOrders: pendingCount || 0,
          totalCategories: catCount || 0,
          totalReviews: reviewCount || 0,
          avgRating: parseFloat(avgRating.toFixed(1)),
          recentOrders: (recentOrdersData || []).map((o: any) => ({
            id: o.id,
            customerName: o.users?.name || o.shipping_name || 'Customer',
            total: Number(o.total),
            status: o.status,
            createdAt: o.created_at
          }))
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
        const { data: cats, error: catsErr } = await supabase
          .from('categories')
          .select('*, subcategories(id, name, slug)')
          .order('name');
        if (catsErr) throw catsErr;

        const { data: countData, error: countErr } = await supabase
          .from('products')
          .select('category_id');
        if (countErr) throw countErr;

        const countMap: Record<number, number> = {};
        if (countData) {
          countData.forEach((p: any) => {
            if (p.category_id) {
              countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
            }
          });
        }

        const mapped = (cats || []).map((c: any) => {
          const mappedCat = mapCategory(c) as any;
          mappedCat.productCount = countMap[c.id] || 0;
          return mappedCat;
        });

        return NextResponse.json(mapped);
      }

      if (sub === 'orders') {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, products(*)), users(name, email)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data.map(mapOrder));
      }

      if (sub === 'reviews') {
        const { data, error } = await supabase
          .from('reviews')
          .select('*, products(name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data.map(mapReview));
      }

      if (sub === 'users') {
        const { data: usersData, error: uErr } = await supabase
          .from('users')
          .select('*')
          .eq('is_admin', false)
          .order('created_at', { ascending: false });
        if (uErr) throw uErr;

        const { data: ordersData } = await supabase.from('orders').select('user_id');
        const { data: reviewsData } = await supabase.from('reviews').select('user_id');

        const orderCountMap: Record<string, number> = {};
        if (ordersData) {
          ordersData.forEach((o: any) => {
            if (o.user_id) {
              orderCountMap[o.user_id] = (orderCountMap[o.user_id] || 0) + 1;
            }
          });
        }

        const reviewCountMap: Record<string, number> = {};
        if (reviewsData) {
          reviewsData.forEach((r: any) => {
            if (r.user_id) {
              reviewCountMap[r.user_id] = (reviewCountMap[r.user_id] || 0) + 1;
            }
          });
        }

        const mapped = (usersData || []).map((u: any) => {
          const mappedUser = mapUser(u) as any;
          mappedUser.orderCount = orderCountMap[u.id] || 0;
          mappedUser.reviewCount = reviewCountMap[u.id] || 0;
          return mappedUser;
        });

        return NextResponse.json(mapped);
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
      console.error('[Admin GET Endpoint Error]:', e);
      const isAuth = e.message === 'No token provided' || e.message === 'Authentication failed' || e.message === 'Admin access required';
      return NextResponse.json({ error: e.message || 'Internal error' }, { status: isAuth ? 403 : 500 });
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

    // Send email notification to comfortstudiouk@gmail.com
    sendContactFormEmail({ name, email, subject: subject || '', message }).catch((emailErr) => {
      console.error('[Contact Email Dispatch Error]:', emailErr);
    });

    return NextResponse.json({ id: data.id, success: true });
  }

  // POST /api/cart
  if (pathSegments[0] === 'cart') {
    try {
      const user = await authenticate(req);
      const { productId, quantity, size, color, storage, mattress, price } = await req.json();
      if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

      const selSize = size || '';
      const selColor = color || '';
      const selStorage = storage || '';
      const selMattress = mattress || '';

      // Check if product exists in cart with matching configuration
      const { data: existing, error: findError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('selected_size', selSize)
        .eq('selected_color', selColor)
        .eq('selected_storage', selStorage)
        .eq('selected_mattress', selMattress)
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
            quantity: Number(quantity) || 1,
            selected_size: selSize,
            selected_color: selColor,
            selected_storage: selStorage,
            selected_mattress: selMattress,
            price: price ? Number(price) : null
          });
        if (insertError) throw insertError;
      }

      // Return updated cart
      const { data: cartData, error: getError } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', user.id);
      if (getError) throw getError;
      
      return NextResponse.json((cartData || []).map(mapCartItem));
    } catch (e: any) {
      const status = e.message === 'No token provided' || e.message === 'Authentication failed' ? 401 : 500;
      return NextResponse.json({ error: e.message }, { status });
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

        // Upload to Cloudinary using comfort_payments preset
        const formDataCloudinary = new FormData();
        formDataCloudinary.append('file', file);
        formDataCloudinary.append('upload_preset', 'comfort_payments');

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'iqtgqdjs';
        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formDataCloudinary
        });

        if (!cloudinaryRes.ok) {
          const errData = await cloudinaryRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Failed to upload screenshot to Cloudinary');
        }

        const cloudinaryData = await cloudinaryRes.json();
        const publicUrl = cloudinaryData.secure_url;
        
        // Save to order document
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update({
            payment_screenshot: publicUrl,
            status: 'processing'
          })
          .eq('id', orderId)
          .select()
          .single();
          
        if (updateError) throw updateError;

        // Fetch full order with items & product details for email dispatch
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('*, order_items(*, products(*))')
          .eq('id', orderId)
          .single();

        if (fullOrder) {
          sendOrderConfirmationEmail({
            orderNumber: fullOrder.order_number,
            shippingName: fullOrder.shipping_name,
            shippingEmail: fullOrder.shipping_email,
            shippingPhone: fullOrder.shipping_phone || '',
            shippingCity: fullOrder.shipping_city || '',
            shippingPostalCode: fullOrder.shipping_zip || '',
            paymentMethod: 'Bank Pay',
            status: 'processing',
            total: Number(fullOrder.total),
            shipping: Number(fullOrder.shipping || 0),
            items: (fullOrder.order_items || []).map((item: any) => ({
              name: item.products?.name || 'Product',
              quantity: Number(item.quantity || 1),
              price: Number(item.price || 0),
              selectedSize: item.selected_size || '',
              selectedColor: item.selected_color || '',
              selectedStorage: item.selected_storage || '',
              selectedMattress: item.selected_mattress || '',
              image: item.products?.image || ''
            }))
          }).catch(err => console.error('[Email Dispatch Error]:', err));
        }

        return NextResponse.json({ screenshotUrl: publicUrl, success: true });
      } catch (e: any) {
        console.error('File upload failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    // POST /api/orders (Create new order)
    try {
      const user = await authenticateOptional(req);
      const { items, shipping } = await req.json();
      if (!items || items.length === 0) return NextResponse.json({ error: 'No items in order' }, { status: 400 });

      // Generate order number
      const orderNumber = `CS-${Date.now().toString().slice(-6)}`;
      
      // Calculate total & decrement stock
      let subtotal = 0;
      const orderItemsToInsert = [];
      
      for (const item of items) {
        let prod = null;
        let isDbProduct = false;

        const { data: dbProd, error: pErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', Number(item.productId))
          .maybeSingle();
          
        if (!pErr && dbProd) {
          prod = dbProd;
          isDbProduct = true;
        } else {
          // Fallback to mockCatalog if product not in database
          let mockProduct = null;
          for (const cat of mockCatalog) {
            const found = cat.products.find(p => p.id === Number(item.productId));
            if (found) {
              mockProduct = found;
              break;
            }
          }
          if (mockProduct) {
            prod = {
              id: mockProduct.id,
              name: mockProduct.name,
              price: mockProduct.price,
              stock: mockProduct.stock,
              image: mockProduct.image
            };
          }
        }
          
        if (!prod) throw new Error(`Product ${item.productId} not found`);
        
        const itemPrice = item.price ? Number(item.price) : Number(prod.price);
        subtotal += itemPrice * (Number(item.quantity) || 1);
        
        // Reduce stock in products table only if the product exists in the DB
        if (isDbProduct) {
          const currentStock = Number(prod.stock || 0);
          await supabase
            .from('products')
            .update({ stock: Math.max(0, currentStock - (Number(item.quantity) || 1)) })
            .eq('id', prod.id);
        }

        orderItemsToInsert.push({
          product_id: Number(item.productId),
          quantity: Number(item.quantity) || 1,
          price: itemPrice,
          selected_size: item.selectedSize || '',
          selected_color: item.selectedColor || '',
          selected_storage: item.selectedStorage || '',
          selected_mattress: item.selectedMattress || ''
        });
      }

      const shippingCost = subtotal >= 500 ? 0 : 50;
      const total = subtotal + shippingCost;
      const paymentMethod = shipping.paymentMethod || 'Bank Pay';
      const status = paymentMethod === 'Cash on Delivery' ? 'processing' : 'pending_proof';

      const { data: newOrder, error: oErr } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          total,
          shipping: shippingCost,
          status,
          shipping_name: shipping.name || `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || user?.name || 'Guest',
          shipping_email: shipping.email || user?.email || '',
          shipping_phone: shipping.phone || '',
          shipping_address: '',
          shipping_city: shipping.city || '',
          shipping_state: '',
          shipping_zip: shipping.postalCode || shipping.zip || '',
          shipping_country: ''
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

      // Clear user cart in Supabase (only if logged in)
      if (user?.id) {
        await supabase.from('cart').delete().eq('user_id', user.id);
      }

      // Return order mapped back to JS camelCase
      const { data: finalOrder, error: finalErr } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', newOrder.id)
        .single();
        
      if (finalErr) throw finalErr;

      // Dispatch order confirmation email immediately for Cash on Delivery orders
      if (paymentMethod === 'Cash on Delivery' && finalOrder) {
        sendOrderConfirmationEmail({
          orderNumber: finalOrder.order_number,
          shippingName: finalOrder.shipping_name,
          shippingEmail: finalOrder.shipping_email,
          shippingPhone: finalOrder.shipping_phone || '',
          shippingCity: finalOrder.shipping_city || '',
          shippingPostalCode: finalOrder.shipping_zip || '',
          paymentMethod: 'Cash on Delivery',
          status: 'processing',
          total: Number(finalOrder.total),
          shipping: Number(finalOrder.shipping || 0),
          items: (finalOrder.order_items || []).map((item: any) => ({
            name: item.products?.name || 'Product',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            selectedSize: item.selected_size || '',
            selectedColor: item.selected_color || '',
            selectedStorage: item.selected_storage || '',
            selectedMattress: item.selected_mattress || '',
            image: item.products?.image || ''
          }))
        }).catch(err => console.error('[Email Dispatch Error]:', err));
      }

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
      const status = e.message === 'No token provided' || e.message === 'Authentication failed' ? 401 : 500;
      return NextResponse.json({ error: e.message }, { status });
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
            featured: prod.featured === true,
            gallery_images: prod.galleryImages || [],
            colors: prod.colors || [],
            sizes: prod.sizes || [],
            storage_options: prod.storageOptions || [],
            mattress_options: prod.mattressOptions || []
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
      console.error('[Admin POST Endpoint Error]:', e);
      const isAuth = e.message === 'No token provided' || e.message === 'Authentication failed' || e.message === 'Admin access required';
      return NextResponse.json({ error: e.message || 'Internal error' }, { status: isAuth ? 403 : 500 });
    }
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

async function handlePut(pathSegments: string[], req: NextRequest) {
  // PUT /api/cart/:cartItemId
  if (pathSegments[0] === 'cart' && pathSegments[1]) {
    try {
      const user = await authenticate(req);
      const cartItemId = Number(pathSegments[1]);
      const { quantity } = await req.json();

      const { error: updateError } = await supabase
        .from('cart')
        .update({ quantity: Number(quantity) })
        .eq('user_id', user.id)
        .eq('id', cartItemId);

      if (updateError) throw updateError;

      const { data, error: getError } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', user.id);
        
      if (getError) throw getError;
      
      return NextResponse.json((data || []).map(mapCartItem));
    } catch (e: any) {
      const status = e.message === 'No token provided' || e.message === 'Authentication failed' ? 401 : 500;
      return NextResponse.json({ error: e.message }, { status });
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
        if (data.galleryImages !== undefined) mappedData.gallery_images = data.galleryImages || [];
        if (data.colors !== undefined) mappedData.colors = data.colors || [];
        if (data.sizes !== undefined) mappedData.sizes = data.sizes || [];
        if (data.storageOptions !== undefined) mappedData.storage_options = data.storageOptions || [];
        if (data.mattressOptions !== undefined) mappedData.mattress_options = data.mattressOptions || [];

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

        if (status === 'processing' || status === 'completed') {
          const { data: orderDetails } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*))')
            .eq('id', id)
            .single();

          if (orderDetails) {
            sendOrderConfirmationEmail({
              orderNumber: orderDetails.order_number,
              shippingName: orderDetails.shipping_name,
              shippingEmail: orderDetails.shipping_email,
              shippingPhone: orderDetails.shipping_phone || '',
              shippingCity: orderDetails.shipping_city || '',
              shippingPostalCode: orderDetails.shipping_zip || '',
              paymentMethod: orderDetails.payment_screenshot ? 'Bank Pay' : 'Cash on Delivery',
              status: orderDetails.status,
              total: Number(orderDetails.total),
              shipping: Number(orderDetails.shipping || 0),
              items: (orderDetails.order_items || []).map((item: any) => ({
                name: item.products?.name || 'Product',
                quantity: Number(item.quantity || 1),
                price: Number(item.price || 0),
                selectedSize: item.selected_size || '',
                selectedColor: item.selected_color || '',
                selectedStorage: item.selected_storage || '',
                selectedMattress: item.selected_mattress || '',
                image: item.products?.image || ''
              }))
            }).catch(err => console.error('[Email Dispatch Error]:', err));
          }
        }

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
      console.error('[Admin PUT Endpoint Error]:', e);
      const isAuth = e.message === 'No token provided' || e.message === 'Authentication failed' || e.message === 'Admin access required';
      return NextResponse.json({ error: e.message || 'Internal error' }, { status: isAuth ? 403 : 500 });
    }
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

async function handleDelete(pathSegments: string[], req: NextRequest) {
  // DELETE /api/cart/:cartItemId
  if (pathSegments[0] === 'cart' && pathSegments[1]) {
    try {
      const user = await authenticate(req);
      const cartItemId = Number(pathSegments[1]);

      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('id', cartItemId);

      if (deleteError) throw deleteError;

      const { data, error: getError } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', user.id);
        
      if (getError) throw getError;
      
      return NextResponse.json((data || []).map(mapCartItem));
    } catch (e: any) {
      const status = e.message === 'No token provided' || e.message === 'Authentication failed' ? 401 : 500;
      return NextResponse.json({ error: e.message }, { status });
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
        
        // Also delete from Supabase Auth
        try {
          await supabase.auth.admin.deleteUser(id);
        } catch {}
        return NextResponse.json({ success: true });
      }
    } catch (e: any) {
      console.error('[Admin DELETE Endpoint Error]:', e);
      const isAuth = e.message === 'No token provided' || e.message === 'Authentication failed' || e.message === 'Admin access required';
      return NextResponse.json({ error: e.message || 'Internal error' }, { status: isAuth ? 403 : 500 });
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
