// @ts-ignore
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'store.db');

let db: any;

function toPrimitive(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') {
    if (val instanceof Uint8Array) return null;
    if (typeof val.toNumber === 'function') return val.toNumber();
    if (typeof val.value === 'number') return val.value;
    if (typeof val.value === 'string') return val.value;
    if (typeof val.value === 'boolean') return val.value;
    return null;
  }
  return val;
}

function rowToObject(cols: string[], vals: any[]): Record<string, any> {
  const obj: Record<string, any> = {};
  for (let i = 0; i < cols.length; i++) {
    obj[cols[i]] = toPrimitive(vals[i]);
  }
  return obj;
}

export async function initDB() {
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');


  db.run(`
  CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  )
`);


  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin INTEGER DEFAULT 0,
      provider TEXT DEFAULT 'local',
      avatar TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoryId INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      originalPrice REAL,
      image TEXT DEFAULT '',
      categoryId INTEGER,
      subcategoryId INTEGER,
      stock INTEGER DEFAULT 10,
      rating REAL DEFAULT 0,
      reviewCount INTEGER DEFAULT 0,
      badge TEXT DEFAULT '',
      featured INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      gallery_images TEXT DEFAULT '[]',
      colors TEXT DEFAULT '[]',
      sizes TEXT DEFAULT '[]',
      storage_options TEXT DEFAULT '[]',
      mattress_options TEXT DEFAULT '[]',
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (subcategoryId) REFERENCES subcategories(id) ON DELETE SET NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      orderNumber TEXT UNIQUE,
      total REAL NOT NULL,
      shipping REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      shippingName TEXT,
      shippingEmail TEXT,
      shippingPhone TEXT,
      shippingAddress TEXT,
      shippingCity TEXT,
      shippingState TEXT,
      shippingZip TEXT,
      shippingCountry TEXT DEFAULT 'United States',
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL,
      selectedSize TEXT,
      selectedColor TEXT,
      selectedStorage TEXT,
      selectedMattress TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT DEFAULT '',
      adminReply TEXT DEFAULT '',
      adminReplyDate TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      image TEXT DEFAULT '',
      bgColor TEXT DEFAULT '#1a1a2e',
      textColor TEXT DEFAULT '#ffffff',
      active INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS footer (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      tagline TEXT DEFAULT '',
      copyright TEXT DEFAULT '',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      hours TEXT DEFAULT '',
      socialLinks TEXT DEFAULT '[]',
      quickLinks TEXT DEFAULT '[]',
      customerServiceLinks TEXT DEFAULT '[]',
      paymentIcons TEXT DEFAULT '[]'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      selectedSize TEXT,
      selectedColor TEXT,
      selectedStorage TEXT,
      selectedMattress TEXT,
      price REAL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS scroll_banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL DEFAULT 'Cash on Delivery Available',
      bgColor TEXT DEFAULT '#c8956c',
      textColor TEXT DEFAULT '#ffffff',
      speed INTEGER DEFAULT 20,
      active INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT DEFAULT '',
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  try { db.run("ALTER TABLE banners ADD COLUMN image TEXT DEFAULT ''"); } catch {}
  try { db.run("ALTER TABLE orders ADD COLUMN orderNumber TEXT"); } catch {}
  try { db.run("ALTER TABLE orders ADD COLUMN paymentScreenshot TEXT DEFAULT ''"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local'"); } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''"); } catch {}

  // Option variations migrations
  try { db.run("ALTER TABLE products ADD COLUMN gallery_images TEXT DEFAULT '[]'"); } catch {}
  try { db.run("ALTER TABLE products ADD COLUMN colors TEXT DEFAULT '[]'"); } catch {}
  try { db.run("ALTER TABLE products ADD COLUMN sizes TEXT DEFAULT '[]'"); } catch {}
  try { db.run("ALTER TABLE products ADD COLUMN storage_options TEXT DEFAULT '[]'"); } catch {}
  try { db.run("ALTER TABLE products ADD COLUMN mattress_options TEXT DEFAULT '[]'"); } catch {}

  try { db.run("ALTER TABLE order_items ADD COLUMN selectedSize TEXT"); } catch {}
  try { db.run("ALTER TABLE order_items ADD COLUMN selectedColor TEXT"); } catch {}
  try { db.run("ALTER TABLE order_items ADD COLUMN selectedStorage TEXT"); } catch {}
  try { db.run("ALTER TABLE order_items ADD COLUMN selectedMattress TEXT"); } catch {}

  try { db.run("ALTER TABLE cart ADD COLUMN selectedSize TEXT"); } catch {}
  try { db.run("ALTER TABLE cart ADD COLUMN selectedColor TEXT"); } catch {}
  try { db.run("ALTER TABLE cart ADD COLUMN selectedStorage TEXT"); } catch {}
  try { db.run("ALTER TABLE cart ADD COLUMN selectedMattress TEXT"); } catch {}
  try { db.run("ALTER TABLE cart ADD COLUMN price REAL"); } catch {}

  // Migrate orders table to make userId nullable if it was originally NOT NULL
  try {
    const stmt = db.prepare("PRAGMA table_info(orders)");
    const tableInfo: any[] = [];
    while (stmt.step()) {
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      // Row to object
      const obj: any = {};
      for (let i = 0; i < cols.length; i++) {
        obj[cols[i]] = vals[i];
      }
      tableInfo.push(obj);
    }
    stmt.free();

    const userIdCol = tableInfo.find((c: any) => c.name === 'userId');
    if (userIdCol && userIdCol.notnull === 1) {
      console.log('Migrating orders table to make userId nullable...');
      db.run('PRAGMA foreign_keys = OFF');
      db.run('BEGIN TRANSACTION');
      db.run('ALTER TABLE orders RENAME TO orders_old');
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          orderNumber TEXT UNIQUE,
          total REAL NOT NULL,
          shipping REAL DEFAULT 0,
          status TEXT DEFAULT 'pending',
          shippingName TEXT,
          shippingEmail TEXT,
          shippingPhone TEXT,
          shippingAddress TEXT,
          shippingCity TEXT,
          shippingState TEXT,
          shippingZip TEXT,
          shippingCountry TEXT DEFAULT 'United States',
          paymentScreenshot TEXT DEFAULT '',
          createdAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      db.run(`
        INSERT INTO orders (id, userId, orderNumber, total, shipping, status, shippingName, shippingEmail, shippingPhone, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry, paymentScreenshot, createdAt)
        SELECT id, userId, orderNumber, total, shipping, status, shippingName, shippingEmail, shippingPhone, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry, COALESCE(paymentScreenshot, ''), createdAt FROM orders_old
      `);
      db.run('DROP TABLE orders_old');
      db.run('COMMIT');
      db.run('PRAGMA foreign_keys = ON');
      console.log('Orders table migrated successfully.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }

  save();
}

export function save() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

const dbWrapper = {
  prepare(sql: string) {
    return {
      run(...params: any[]) {
        const bound = params.length > 0 ? params : undefined;
        if (bound) {
          db.run(sql, bound);
        } else {
          db.run(sql);
        }
        const lastId = db.exec('SELECT last_insert_rowid() as id');
        const lastInsertRowid = lastId.length > 0 ? toPrimitive(lastId[0].values[0][0]) : 0;
        const changes = toPrimitive(db.getRowsModified());
        save();
        return { changes, lastInsertRowid };
      },
      get(...params: any[]) {
        const stmt = db.prepare(sql);
        try {
          if (params.length > 0) {
            stmt.bind(params);
          }
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            return rowToObject(cols, vals);
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params: any[]) {
        const results: Record<string, any>[] = [];
        const stmt = db.prepare(sql);
        try {
          if (params.length > 0) {
            stmt.bind(params);
          }
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            results.push(rowToObject(cols, vals));
          }
          return results;
        } finally {
          stmt.free();
        }
      },
    };
  },
  exec(sql: string) {
    db.run(sql);
    save();
  },
  pragma(pragma: string) {
    db.run(`PRAGMA ${pragma}`);
  },
  getRowsModified() {
    return toPrimitive(db.getRowsModified());
  },
};

export default dbWrapper;
