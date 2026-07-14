# 🛋️ Furniture Shop (Sofa Store) — Complete Build Plan

**Reference sites:** mandhliving.co.uk, honeypotfurniture.co.uk, sofaclub.co.uk
**Goal:** Full-stack e-commerce store — browse sofas, filter, view variants (color/fabric/size), add to cart, checkout online, no physical meeting. Admin dashboard to manage everything.

---

## 1. Tech Stack (Final)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14/15 (App Router)** | SSR for SEO on product pages, one codebase for storefront + admin |
| Styling | **Tailwind CSS** | Fast, AI-friendly, easy to vibe-code |
| Database | **PostgreSQL** | Relational data (products → variants → images → orders) fits better than Mongo |
| ORM | **Prisma** | Type-safe, migrations, AI tools handle it very well |
| Auth | **NextAuth.js (Auth.js)** | Separate roles: `CUSTOMER` and `ADMIN` |
| Payments | **Stripe Checkout** | Fastest to integrate, handles cards/Apple Pay/Google Pay. Add JazzCash/Easypaisa later if needed for PK market |
| Image hosting | **Cloudinary** or **UploadThing** | Product photo upload + auto-optimization |
| Email | **Resend** | Order confirmation emails |
| State management | **Zustand** | Cart state (persisted to localStorage + synced to DB for logged-in users) |
| Forms | **React Hook Form + Zod** | Checkout & admin forms with validation |
| Hosting | **Vercel** (app) + **Railway / Neon** (Postgres) | Fast deploy, free tier available |

---

## 2. Folder Structure

```
furniture-shop/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (storefront)/
│   │   │   ├── page.tsx                    # Homepage
│   │   │   ├── collections/[slug]/page.tsx # Category/filtered listing
│   │   │   ├── products/[slug]/page.tsx    # Product detail
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── order-confirmation/[id]/page.tsx
│   │   │   ├── account/page.tsx            # Customer order history (optional)
│   │   │   └── layout.tsx
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx          # Sales overview
│   │   │   ├── products/page.tsx           # Product list
│   │   │   ├── products/new/page.tsx
│   │   │   ├── products/[id]/edit/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   └── layout.tsx                  # Protected layout
│   │   └── api/
│   │       ├── products/route.ts
│   │       ├── products/[id]/route.ts
│   │       ├── cart/route.ts
│   │       ├── checkout/route.ts
│   │       ├── webhooks/stripe/route.ts
│   │       ├── orders/route.ts
│   │       └── upload/route.ts
│   ├── components/
│   │   ├── storefront/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   ├── VariantSelector.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   └── Navbar.tsx
│   │   ├── admin/
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── OrdersTable.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/                             # shared buttons, inputs, etc.
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── stripe.ts
│   │   ├── auth.ts
│   │   └── cloudinary.ts
│   ├── store/
│   │   └── cartStore.ts                    # Zustand
│   └── types/
│       └── index.ts
├── .env
├── next.config.js
└── package.json
```

---

## 3. Database Schema (Prisma)

```prisma
model Product {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])
  basePrice   Decimal
  isActive    Boolean   @default(true)
  isFeatured  Boolean   @default(false)
  onSale      Boolean   @default(false)
  salePrice   Decimal?
  variants    ProductVariant[]
  images      ProductImage[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ProductVariant {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  color      String?
  fabric     String?
  size       String?   // e.g. "3 Seater", "Corner Left"
  sku        String    @unique
  price      Decimal
  stockQty   Int       @default(0)
  images     ProductImage[]
  orderItems OrderItem[]
}

model ProductImage {
  id         String   @id @default(cuid())
  url        String
  order      Int      @default(0)
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  variantId  String?
  variant    ProductVariant? @relation(fields: [variantId], references: [id])
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  products Product[]
}

model Order {
  id              String      @id @default(cuid())
  customerEmail   String
  customerName    String
  shippingAddress String
  phone           String
  status          OrderStatus @default(PENDING)
  total           Decimal
  stripeSessionId String?
  items           OrderItem[]
  createdAt       DateTime    @default(now())
}

model OrderItem {
  id              String         @id @default(cuid())
  orderId         String
  order           Order          @relation(fields: [orderId], references: [id])
  variantId       String
  variant         ProductVariant @relation(fields: [variantId], references: [id])
  quantity        Int
  priceAtPurchase Decimal
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model Admin {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  name         String
}
```

---

## 4. Feature Checklist (MVP scope)

### Customer-facing
- [ ] Homepage — hero banner, featured collections, best sellers
- [ ] Category listing page — grid of products, basic filters (type, color, fabric, price range), sort (price/newest)
- [ ] Product detail page — image gallery, variant selector (color swatch + size dropdown), live price update, stock status, "Add to Cart"
- [ ] Cart drawer (slide-in) + full cart page — quantity update, remove item, subtotal
- [ ] Checkout — guest checkout (name, email, address, phone) → Stripe Checkout redirect
- [ ] Order confirmation page + confirmation email
- [ ] Responsive design (mobile-first, since most furniture browsing happens on mobile)

### Admin dashboard
- [ ] Admin login (separate from customer auth)
- [ ] Dashboard home — total orders, revenue, low-stock alerts
- [ ] Product CRUD — create/edit/delete products, add variants (color/fabric/size/price/stock), multi-image upload
- [ ] Order management — view all orders, filter by status, update order status
- [ ] Category management — add/edit categories

### Deferred (v2, not MVP)
- Wishlist
- Customer accounts / order history
- Financing/installment calculator
- Fabric swatch request system
- Reviews & ratings
- Multi-warehouse/showroom locator

---

## 5. Environment Variables Needed

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
ADMIN_EMAIL=
```

---

## 6. Day-by-Day Execution Plan

**Day 1 — Foundation**
- `npx create-next-app` with Tailwind, TypeScript
- Set up Prisma + Postgres (Neon/Railway), write schema, run migration
- Seed script with ~15-20 dummy sofas (name, variants, prices, placeholder images)
- NextAuth setup with Admin role

**Day 2 — Storefront core**
- Homepage layout
- Category/listing page with filter sidebar (client-side filter on fetched data is fine for MVP)
- Product detail page with variant selector logic (price changes based on selected variant)

**Day 3 — Cart & Checkout**
- Zustand cart store (add/remove/update qty, persist to localStorage)
- Cart drawer UI
- Stripe Checkout session creation (API route) → redirect
- Stripe webhook to mark order as PAID
- Order confirmation page + Resend email

**Day 4 — Admin Dashboard**
- Admin login + protected layout (middleware checks role)
- Product list + create/edit form with Cloudinary image upload
- Variant management UI (add multiple color/size combos per product)
- Orders table + status update

**Day 5 — Polish & Deploy**
- Mobile responsiveness pass
- Loading states, error handling, empty states
- Deploy to Vercel, connect Postgres, set env vars
- Full end-to-end test: browse → add to cart → checkout → admin sees order
- Buffer for bug fixes

---

## 7. Master Prompt — Paste This Into Claude Code to Start Scaffolding

```
I'm building a furniture e-commerce store (sofas) with Next.js 14 App Router,
TypeScript, Tailwind CSS, Prisma + PostgreSQL, NextAuth, Stripe Checkout,
Cloudinary for images, Zustand for cart state, and Resend for emails.

Reference UX: sofaclub.co.uk style — product grid with filters (type, color,
fabric, price), product detail page with color/size variant selector that
updates price and images, cart drawer, guest checkout via Stripe.

Please scaffold the project in this order:
1. Initialize Next.js project with the folder structure below (paste structure
   from section 2 above)
2. Set up Prisma schema exactly as specified (paste schema from section 3)
3. Create a seed script with 15 realistic dummy sofa products (varying types:
   corner sofa, 3-seater, 2-seater, sofa bed — each with 2-3 color variants)
4. Build the homepage, category listing page with filters, and product detail
   page with a working variant selector
5. Build the cart (Zustand store + drawer component) and checkout flow using
   Stripe Checkout Sessions
6. Build the admin dashboard: login, product CRUD with image upload, and
   order management table
7. Add middleware to protect all /admin routes for ADMIN role only

Work incrementally — after each step, show me the result before moving to
the next. Use Tailwind for all styling, keep components in
src/components/storefront and src/components/admin as appropriate.
```

---

## 8. Notes / Risk Areas (don't blindly trust AI here — test manually)

- **Stripe webhook signature verification** — easy to get wrong, test with Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- **Variant price logic** — make sure selecting a variant actually updates price/stock shown, not just cosmetic
- **Stock quantity race conditions** — for MVP, simple decrement on order is fine; don't over-engineer
- **Image upload** — verify Cloudinary URLs actually save to DB correctly, test with real images not just placeholders
