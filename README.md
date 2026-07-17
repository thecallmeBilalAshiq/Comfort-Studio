# Comfort Studio 🛋️

Comfort Studio is a premium, full-featured e-commerce platform for home furniture and interior decor. It is engineered with a modern, decouple-monorepo architecture featuring an interactive Next.js storefront client and a robust, secure Express.js API backend using SQLite database persistence.

---

## ✨ Features

- **Storefront Client**: Beautiful glassmorphic design system using React 19, Next.js 15, and custom animations.
- **Admin Dashboard**: Manage banners, products, categories, reviews, footer config, and view order details.
- **Dynamic Search & Filters**: Search catalog by name or description. Filter by category, type (Best Sellers, Sale, New), price range, stock, and sort criteria.
- **Email Verification (Firebase)**: Send secure sign-up links/OTPs. Enforces verification before orders/checkout can be completed.
- **Bank Transfer Payment Method**:
  - Displays bank coordinates with copy-to-clipboard buttons on Checkout complete.
  - Multi-channel receipt submission: upload a payment screenshot directly or submit via WhatsApp with pre-filled order details.
- **Excel Data Export**: Admin dashboard includes an **Export to Excel** button that instantly formats and downloads all customer orders into a CSV spreadsheet.

---

## 📁 Folder Structure

```
Comfort-Studio/
├── backend/                  # Node.js Express server
│   ├── data/                 # SQLite database storage (store.db)
│   ├── src/
│   │   ├── db.ts             # SQLite database setup and migration scripts
│   │   ├── server.ts         # Main server initialization and static directory config
│   │   ├── seed.ts           # Pre-population script for products, users, categories
│   │   ├── routes/           # REST endpoints (auth, orders, products, reviews, contact, etc.)
│   │   └── middleware/       # Express auth validation and role checks
│   ├── uploads/              # Static server uploads directory (ignored in git)
│   └── package.json
│
├── frontend/                 # Next.js 15 App Router application
│   ├── src/
│   │   ├── app/              # Routes (Checkout, Shop, Order History, Admin panel, Auth)
│   │   ├── components/       # Core UI elements (Header, Footer, ScrollAnimations, ProductCard)
│   │   ├── contexts/         # Authentication and Cart State Providers
│   │   ├── lib/              # API wrapper client & Firebase client configurations
│   │   └── types/            # TypeScript interfaces
│   └── package.json
│
└── LICENSE                   # MIT License
```

---

## ⚙️ Configuration & Environment Variables

### Backend (`backend/.env`)
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
FIREBASE_SERVICE_ACCOUNT_JSON= # Absolute path to your firebase-service-account.json file
```

### Frontend (`frontend/.env.local`)
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
# Firebase Client Config (for authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🚀 Setup & Installation Steps

### 1. Install Dependencies
Install all modules for both packages:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Seeding & Setup
Run the seed script in the backend directory to initialize your SQLite database and populate it with premium category taxonomies, banners, users, and product catalogs:
```bash
cd backend
npm run seed
```

### 3. Run the Development Servers
Start both servers concurrently to test and modify the code locally:
```bash
# Run backend (in backend/ directory)
npm run dev

# Run frontend (in frontend/ directory)
npm run dev
```
The storefront client will be available at **`http://localhost:3000`** (or `http://localhost:3001` if port 3000 is occupied).

### 4. Build and Run in Production
To test or deploy in production with optimized assets:
```bash
# Build the production bundle
cd frontend
npm run build

# Start the production server
npm run start
```

---

## 🔑 Default Admin Account
Use these credentials to log in to the administrator portal at `/admin` (or `/admin/login`):
* **Email**: `numanasghar901@gmail.com`
* **Password**: `admin123` (or authenticate using your verified Firebase Admin Account configuration)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
