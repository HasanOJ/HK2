/**
 * Seed script - Populate database from CORD dataset JSON
 * Usage: node seed-db.mjs
 * 
 * Prerequisites: npm install (to get better-sqlite3)
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { dirname } from 'path';

const DB_PATH = './data/bookkeeper.db';
const JSON_PATH = './data/cord_receipts.json';

// Ensure data directory exists
if (!existsSync(dirname(DB_PATH))) {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}

console.log('🗄️  Initializing database...');
const db = new Database(DB_PATH);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_number TEXT,
    address TEXT,
    phone TEXT,
    category TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    vendor_id TEXT REFERENCES vendors(id),
    receipt_date DATETIME,
    subtotal REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    service_charge REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'pending',
    confidence_score REAL,
    extracted_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS line_items (
    id TEXT PRIMARY KEY,
    receipt_id TEXT NOT NULL REFERENCES receipts(id),
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL,
    total_price REAL NOT NULL,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#808080'
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    referenced_receipts TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(vendor_id);
  CREATE INDEX IF NOT EXISTS idx_line_items_receipt ON line_items(receipt_id);
`);

// Insert default categories
const categories = [
  ['cat_food', 'Food & Beverage', '#4CAF50'],
  ['cat_office', 'Office Supplies', '#2196F3'],
  ['cat_travel', 'Travel', '#FF9800'],
  ['cat_other', 'Uncategorized', '#607D8B'],
];

const insertCat = db.prepare('INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)');
categories.forEach(c => insertCat.run(...c));

// Load and seed data
if (!existsSync(JSON_PATH)) {
  console.log('⚠️  No cord_receipts.json found. Run the notebook to generate it.');
  console.log('   Or start the server and POST to /api/seed');
  process.exit(0);
}

console.log('📦 Loading CORD data...');
const receipts = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));

const insertVendor = db.prepare(`
  INSERT OR IGNORE INTO vendors (id, name, address, phone, category)
  VALUES (?, ?, ?, ?, 'general')
`);

const insertReceipt = db.prepare(`
  INSERT OR REPLACE INTO receipts (id, vendor_id, subtotal, tax_amount, total_amount, payment_method, status, confidence_score, extracted_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1.0, ?)
`);

const insertItem = db.prepare(`
  INSERT INTO line_items (id, receipt_id, name, quantity, unit_price, total_price, category)
  VALUES (?, ?, ?, ?, ?, ?, 'Uncategorized')
`);

let vendorCount = 0, receiptCount = 0, itemCount = 0;
const vendorMap = new Map();

const seedAll = db.transaction(() => {
  for (const data of receipts) {
    const vendorName = data.vendor?.name || 'Unknown Vendor';
    
    if (!vendorMap.has(vendorName)) {
      const vendorId = `vendor_${randomUUID().slice(0, 8)}`;
      insertVendor.run(vendorId, vendorName, data.vendor?.address, data.vendor?.phone);
      vendorMap.set(vendorName, vendorId);
      vendorCount++;
    }
    
    const vendorId = vendorMap.get(vendorName);
    const receipt = data.receipt;
    const status = receipt.has_error ? 'flagged' : 'verified';
    
    insertReceipt.run(
      receipt.id, vendorId,
      receipt.subtotal || 0, receipt.tax_amount || 0, receipt.total_amount || 0,
      receipt.payment_method || 'unknown', status,
      JSON.stringify(data)
    );
    receiptCount++;
    
    for (const item of data.items || []) {
      const itemId = `item_${randomUUID().slice(0, 8)}`;
      insertItem.run(itemId, receipt.id, item.name, item.quantity || 1, item.unit_price, item.total_price || 0);
      itemCount++;
    }
  }
});

seedAll();

console.log('✅ Database seeded!');
console.log(`   📦 Vendors: ${vendorCount}`);
console.log(`   🧾 Receipts: ${receiptCount}`);
console.log(`   📝 Line items: ${itemCount}`);

db.close();
