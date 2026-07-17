# Comfort Studio Project Analysis

I have completed a thorough analysis of the **Comfort Studio** project workspace. Below is a detailed breakdown of the project architecture, features, database schema, and server status.

---

## 🛠️ Technology Stack & Architecture

Comfort Studio is structured as a decoupled monorepo containing a separate **frontend** and **backend**:

| Layer | Technology Choice | Details |
|---|---|---|
| **Frontend** | Next.js 15.5 (App Router) | React 19, TypeScript, Tailwind CSS, Lucide icons, `react-hot-toast` |
| **Backend** | Node.js Express Server | TypeScript, `tsx` runner, CORS enabled, JSON body parser |
| **Database** | SQLite via `sql.js` | Saved as a persistent file under `backend/data/store.db` |
| **Authentication** | Custom JWT Flow | Handled via custom express routes (`/api/auth`) and React Context (`AuthContext`) |
| **State Management** | React Context | Separate contexts for authentication state (`AuthContext`) and cart state (`CartContext`) |

---

## 📁 Directory Structure

```
Comfort-Studio/
├── backend/               # Express backend application
│   ├── data/              # SQLite database storage (store.db)
│   ├── src/
│   │   ├── db.ts          # SQLite database schema, wrapper, and initialization
│   │   ├── server.ts      # Server initialization & API middleware configuration
│   │   ├── seed.ts        # Script to pre-populate database with dummy products/users
│   │   ├── routes/        # Router files (auth, products, banners, contact, orders, reviews, etc.)
│   │   └── middleware/    # Auth verification middleware
│   └── package.json
│
├── frontend/              # Next.js 15 App Router frontend application
│   ├── src/
│   │   ├── app/           # Page routes (storefront pages, shop, product details, admin panels)
│   │   ├── components/    # Reusable UI components (Header, Footer, ProductCard, Animations)
│   │   ├── contexts/      # AuthContext and CartContext providers
│   │   ├── lib/           # API wrapper clients
│   │   └── types/         # TypeScript interfaces
│   └── package.json
│
└── start.bat              # Script to boot both services (Windows fallback)
```

---

## 🗄️ Database Schema & Seed Data

The project uses a structured relational database with the following key tables:

*   **`users`**: Customer and administrator credentials (`isAdmin` flag controls roles).
*   **`categories` & `subcategories`**: Multi-level taxonomy (e.g. *Sofas* containing *Sectional Sofas*, *Sleeper Sofas*, etc.).
*   **`products`**: Product catalog items with slugs, base prices, original prices, stock levels, ratings, and active/featured flags.
*   **`orders` & `order_items`**: Tracks customer orders, shipping details, and items purchased.
*   **`reviews`**: Holds rating, comments, and administrator replies.
*   **`banners` & `scroll_banners`**: Dynamic custom promotional copy editable via the admin dashboard.
*   **`footer`**: Centralized config for footer contacts, social links, and links.

### Seeding Status
A seed script is available at `backend/src/seed.ts` containing:
*   An administrator user: `numanasghar901@gmail.com`
*   Four categories (Sofas, Living Room, Dining Room, Office) and subcategories.
*   20+ detailed sofa and furniture products.
*   Default hero banners, scroll banners, and footer records.

---

## ⚡ Current Server & Port Status

I verified the status of the local servers:
1.  **Express Backend**: Currently running on port **`5000`** (`http://localhost:5000`). Verified health is response-ready (`{"status":"ok"}`).
2.  **Next.js Frontend**:
    *   **Port Conflict Resolved**: An old, stale Next.js server was hung on port `3000`. I successfully terminated the stale process and restarted the dev server.
    *   **Current Status**: Running on port **`3000`** (`http://localhost:3000`) and fully compiled/responsive.
