/**
 * SQLite Database Setup for Auto-Bookkeeper
 * Uses better-sqlite3 for synchronous, fast SQLite operations
 */

import Database from 'better-sqlite3';
import path from 'path';

// Database file location
const DB_PATH = path.join(process.cwd(), 'data', 'bookkeeper.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database instance
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  -- Vendors table
  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_number TEXT,
    address TEXT,
    phone TEXT,
    category TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Receipts table
  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    vendor_id TEXT REFERENCES vendors(id),
    
    receipt_number TEXT,
    receipt_date DATETIME,
    
    subtotal REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    service_charge REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    
    payment_method TEXT DEFAULT 'cash',
    cash_paid REAL,
    card_paid REAL,
    change_amount REAL,
    
    status TEXT DEFAULT 'pending',
    confidence_score REAL,
    
    image_path TEXT,
    raw_ocr_text TEXT,
    extracted_json TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Line items table
  CREATE TABLE IF NOT EXISTS line_items (
    id TEXT PRIMARY KEY,
    receipt_id TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price REAL,
    total_price REAL NOT NULL,
    
    parent_item_id TEXT REFERENCES line_items(id),
    is_sub_item INTEGER DEFAULT 0,
    
    category TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Categories table
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#808080',
    icon TEXT,
    parent_id TEXT REFERENCES categories(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Receipt categories junction table
  CREATE TABLE IF NOT EXISTS receipt_categories (
    receipt_id TEXT REFERENCES receipts(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (receipt_id, category_id)
  );

  -- Chat history table
  CREATE TABLE IF NOT EXISTS chat_history (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    referenced_receipts TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(vendor_id);
  CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(receipt_date);
  CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
  CREATE INDEX IF NOT EXISTS idx_line_items_receipt ON line_items(receipt_id);
  CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(session_id);
`);

// Insert default categories if not exists
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)
`);

const defaultCategories = [
  ['cat_office', 'Office Supplies', '#2196F3'],
  ['cat_food', 'Food & Beverage', '#4CAF50'],
  ['cat_travel', 'Travel & Transport', '#FF9800'],
  ['cat_utilities', 'Utilities', '#9C27B0'],
  ['cat_services', 'Services', '#00BCD4'],
  ['cat_other', 'Other', '#607D8B'],
];

for (const [id, name, color] of defaultCategories) {
  insertCategory.run(id, name, color);
}

console.log('✅ Database initialized at:', DB_PATH);

export default db;

// Export prepared statements for common operations
export const statements = {
  // Vendors
  insertVendor: db.prepare(`
    INSERT INTO vendors (id, name, business_number, address, phone, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  getVendorByName: db.prepare(`
    SELECT * FROM vendors WHERE name = ?
  `),
  
  getAllVendors: db.prepare(`
    SELECT * FROM vendors ORDER BY name
  `),

  // Receipts
  insertReceipt: db.prepare(`
    INSERT INTO receipts (
      id, vendor_id, receipt_number, receipt_date,
      subtotal, tax_amount, service_charge, discount, total_amount,
      payment_method, cash_paid, card_paid, change_amount,
      status, confidence_score, image_path, raw_ocr_text, extracted_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getReceiptById: db.prepare(`
    SELECT r.*, v.name as vendor_name 
    FROM receipts r
    LEFT JOIN vendors v ON r.vendor_id = v.id
    WHERE r.id = ?
  `),
  
  getAllReceipts: db.prepare(`
    SELECT r.*, v.name as vendor_name 
    FROM receipts r
    LEFT JOIN vendors v ON r.vendor_id = v.id
    ORDER BY r.created_at DESC
  `),
  
  getReceiptsByStatus: db.prepare(`
    SELECT r.*, v.name as vendor_name 
    FROM receipts r
    LEFT JOIN vendors v ON r.vendor_id = v.id
    WHERE r.status = ?
    ORDER BY r.created_at DESC
  `),
  
  updateReceiptStatus: db.prepare(`
    UPDATE receipts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),
  
  deleteReceipt: db.prepare(`
    DELETE FROM receipts WHERE id = ?
  `),

  // Line Items
  insertLineItem: db.prepare(`
    INSERT INTO line_items (id, receipt_id, name, description, quantity, unit_price, total_price, parent_item_id, is_sub_item, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getLineItemsByReceipt: db.prepare(`
    SELECT * FROM line_items WHERE receipt_id = ? ORDER BY created_at
  `),

  // Analytics
  getTotalsByPeriod: db.prepare(`
    SELECT 
      strftime('%Y-%m', receipt_date) as period,
      COUNT(*) as receipt_count,
      SUM(total_amount) as total_spent,
      SUM(tax_amount) as total_tax,
      AVG(total_amount) as avg_transaction
    FROM receipts
    WHERE receipt_date >= ?
    GROUP BY period
    ORDER BY period DESC
  `),
  
  getTotalsByVendor: db.prepare(`
    SELECT 
      v.name as vendor,
      COUNT(*) as receipt_count,
      SUM(r.total_amount) as total_spent
    FROM receipts r
    LEFT JOIN vendors v ON r.vendor_id = v.id
    GROUP BY r.vendor_id
    ORDER BY total_spent DESC
    LIMIT 10
  `),
  
  getOverallStats: db.prepare(`
    SELECT 
      COUNT(*) as receipt_count,
      SUM(total_amount) as total_spent,
      SUM(tax_amount) as total_tax,
      AVG(total_amount) as avg_transaction,
      AVG(confidence_score) as avg_confidence
    FROM receipts
  `),

  // Categories
  getAllCategories: db.prepare(`
    SELECT * FROM categories ORDER BY name
  `),

  // Chat
  insertChatMessage: db.prepare(`
    INSERT INTO chat_history (id, session_id, role, content, referenced_receipts)
    VALUES (?, ?, ?, ?, ?)
  `),
  
  getChatHistory: db.prepare(`
    SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at
  `),
};
