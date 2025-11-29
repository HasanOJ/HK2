# Database Schema for Small Business Auto-Bookkeeper

> **For Member 2 (Backend Engineer)** - This schema is designed to store extracted receipt data and support the Financial Command Center dashboard.

## Overview

This schema is based on:
1. **CORD Dataset ground truth labels** (`gt_parse` structure)
2. **Minimal UI TypeScript types** (`IInvoice`, `IInvoiceItem`, `IOrder`)
3. **Hackathon requirements** (receipt extraction, dashboard, AI chat)

---

## Tables

### 1. `vendors` - Store vendor/merchant information
```sql
CREATE TABLE vendors (
    id TEXT PRIMARY KEY,                    -- UUID
    name TEXT NOT NULL,                     -- From CORD: store_info.name
    business_number TEXT,                   -- From CORD: store_info.biznum
    address TEXT,                           -- From CORD: store_info.addr
    phone TEXT,                             -- From CORD: store_info.tel
    category TEXT DEFAULT 'general',        -- User-defined category
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `receipts` - Main receipt/transaction records
```sql
CREATE TABLE receipts (
    id TEXT PRIMARY KEY,                    -- UUID
    vendor_id TEXT REFERENCES vendors(id),
    
    -- Receipt metadata
    receipt_number TEXT,                    -- From CORD: total.menuqty_cnt
    receipt_date DATETIME,                  -- From CORD: created.date_ymd, time
    
    -- Financial summary (CORD: sub_total, total)
    subtotal REAL DEFAULT 0,                -- From CORD: sub_total.subtotal_price
    tax_amount REAL DEFAULT 0,              -- From CORD: sub_total.tax_price
    service_charge REAL DEFAULT 0,          -- From CORD: sub_total.service_price
    discount REAL DEFAULT 0,                -- From CORD: sub_total.discount_price
    total_amount REAL NOT NULL,             -- From CORD: total.total_price
    
    -- Payment info (CORD: total)
    payment_method TEXT DEFAULT 'cash',     -- 'cash' | 'card' | 'other'
    cash_paid REAL,                         -- From CORD: total.cashprice
    card_paid REAL,                         -- From CORD: total.creditcardprice
    change_amount REAL,                     -- From CORD: total.changeprice
    
    -- Status tracking
    status TEXT DEFAULT 'pending',          -- 'pending' | 'verified' | 'flagged'
    confidence_score REAL,                  -- OCR confidence (0-1)
    
    -- Original image reference
    image_path TEXT,                        -- Path to receipt image
    raw_ocr_text TEXT,                      -- Raw OCR output for debugging
    extracted_json TEXT,                    -- Full extracted JSON from LLM
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. `line_items` - Individual items on receipts
```sql
CREATE TABLE line_items (
    id TEXT PRIMARY KEY,                    -- UUID
    receipt_id TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    
    -- Item details (CORD: menu)
    name TEXT NOT NULL,                     -- From CORD: menu.nm
    description TEXT,                       -- From CORD: menu.nm (extended)
    quantity INTEGER DEFAULT 1,             -- From CORD: menu.cnt
    unit_price REAL,                        -- From CORD: menu.unitprice
    total_price REAL NOT NULL,              -- From CORD: menu.price
    
    -- Sub-item support (CORD: menu.sub)
    parent_item_id TEXT REFERENCES line_items(id),  -- For sub-items
    is_sub_item BOOLEAN DEFAULT FALSE,
    
    -- Category for analytics
    category TEXT,                          -- e.g., 'food', 'beverage', 'supplies'
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. `categories` - Expense categories for reporting
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,              -- e.g., 'Office Supplies', 'Food & Beverage'
    color TEXT DEFAULT '#808080',           -- For dashboard visualization
    icon TEXT,                              -- Icon identifier
    parent_id TEXT REFERENCES categories(id),  -- For hierarchical categories
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default categories
INSERT INTO categories (id, name, color) VALUES
    ('cat_office', 'Office Supplies', '#2196F3'),
    ('cat_food', 'Food & Beverage', '#4CAF50'),
    ('cat_travel', 'Travel & Transport', '#FF9800'),
    ('cat_utilities', 'Utilities', '#9C27B0'),
    ('cat_services', 'Services', '#00BCD4'),
    ('cat_other', 'Other', '#607D8B');
```

### 5. `receipt_categories` - Many-to-many for receipt categorization
```sql
CREATE TABLE receipt_categories (
    receipt_id TEXT REFERENCES receipts(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (receipt_id, category_id)
);
```

### 6. `chat_history` - For AI Auditor Chat (RAG)
```sql
CREATE TABLE chat_history (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,               -- Group messages by session
    role TEXT NOT NULL,                     -- 'user' | 'assistant'
    content TEXT NOT NULL,
    referenced_receipts TEXT,               -- JSON array of receipt IDs used in response
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## TypeScript Interfaces (for Frontend)

These align with the Minimal UI pattern from `src/types/invoice.ts`:

```typescript
// src/types/receipt.ts

export type IVendor = {
  id: string;
  name: string;
  businessNumber?: string;
  address?: string;
  phone?: string;
  category: string;
};

export type ILineItem = {
  id: string;
  receiptId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  category?: string;
  isSubItem: boolean;
  parentItemId?: string;
};

export type IReceipt = {
  id: string;
  vendor?: IVendor;
  vendorId?: string;
  
  // Metadata
  receiptNumber?: string;
  receiptDate: string | null;
  
  // Financials
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discount: number;
  totalAmount: number;
  
  // Payment
  paymentMethod: 'cash' | 'card' | 'other';
  cashPaid?: number;
  cardPaid?: number;
  changeAmount?: number;
  
  // Status
  status: 'pending' | 'verified' | 'flagged';
  confidenceScore?: number;
  
  // Items
  items: ILineItem[];
  
  // References
  imagePath?: string;
  
  createdAt: string;
  updatedAt: string;
};

export type IReceiptTableFilters = {
  name: string;
  status: string;
  vendor: string;
  category: string[];
  startDate: Dayjs | null;
  endDate: Dayjs | null;
};

// For dashboard analytics
export type IExpenseSummary = {
  totalSpent: number;
  receiptCount: number;
  averageTransaction: number;
  taxTotal: number;
  byCategory: { category: string; amount: number; count: number }[];
  byVendor: { vendor: string; amount: number; count: number }[];
  byMonth: { month: string; amount: number; count: number }[];
};
```

---

## CORD Dataset → Schema Mapping

| CORD Field | Schema Field | Table | Notes |
|------------|--------------|-------|-------|
| `store_info.name` | `name` | `vendors` | ⚠️ Not always present |
| `store_info.biznum` | `business_number` | `vendors` | Optional |
| `store_info.addr` | `address` | `vendors` | Optional |
| `store_info.tel` | `phone` | `vendors` | Optional |
| `menu.nm` | `name` | `line_items` | ✅ Always present |
| `menu.cnt` | `quantity` | `line_items` | ✅ Always present |
| `menu.unitprice` | `unit_price` | `line_items` | ⚠️ Not always present |
| `menu.price` | `total_price` | `line_items` | ✅ Always present |
| `menu.sub.*` | Sub-items with `parent_item_id` | `line_items` | Nested items |
| `sub_total.subtotal_price` | `subtotal` | `receipts` | ⚠️ Not always present |
| `sub_total.tax_price` | `tax_amount` | `receipts` | ⚠️ Not always present |
| `sub_total.service_price` | `service_charge` | `receipts` | ⚠️ Not always present |
| `sub_total.discount_price` | `discount` | `receipts` | ⚠️ Not always present |
| `total.total_price` | `total_amount` | `receipts` | ✅ Always present |
| `total.cashprice` | `cash_paid` | `receipts` | Present if cash payment |
| `total.creditcardprice` | `card_paid` | `receipts` | Present if card payment |
| `total.changeprice` | `change_amount` | `receipts` | Present if cash payment |

### ⚠️ Important Notes on CORD Dataset

1. **Prices are STRINGS**: CORD uses locale-formatted strings like `"16,500"` (Indonesian Rupiah)
   - Use `parseCordPrice()` from `extraction.types.ts` to convert to numbers
   
2. **`store_info` is often missing**: Not all receipts have vendor information in `gt_parse`
   - `vendor_id` in `receipts` table is nullable
   
3. **`sub_total` is often missing**: Many receipts only have `total`, not subtotals
   - All subtotal fields are optional in schema

4. **Currency**: CORD receipts are in Indonesian Rupiah (IDR)
   - Consider adding a `currency` field if supporting multiple currencies

---

## API Endpoints (for Member 2)

### Receipts
```
POST   /api/receipts           - Create new receipt (from extraction)
GET    /api/receipts           - List receipts (with filters)
GET    /api/receipts/:id       - Get single receipt with items
PUT    /api/receipts/:id       - Update receipt
DELETE /api/receipts/:id       - Delete receipt
POST   /api/receipts/upload    - Upload image for extraction
```

### Vendors
```
GET    /api/vendors            - List all vendors
POST   /api/vendors            - Create vendor
GET    /api/vendors/:id        - Get vendor with receipts
```

### Analytics (for Dashboard)
```
GET    /api/analytics/summary  - Get expense summary
GET    /api/analytics/by-category?period=month
GET    /api/analytics/by-vendor?period=month
GET    /api/analytics/trends?months=6
```

### Chat (for AI Auditor)
```
POST   /api/chat               - Send message, get AI response
GET    /api/chat/history       - Get chat history
```

---

## Member 1 → Member 2 Interface

**Member 1 (Extraction)** will output JSON in this format:

```typescript
// Output from extraction function
interface ExtractionResult {
  success: boolean;
  confidence: number;
  data: {
    vendor: {
      name: string;
      address?: string;
      phone?: string;
      businessNumber?: string;
    };
    receipt: {
      date?: string;           // ISO format
      subtotal?: number;
      taxAmount?: number;
      serviceCharge?: number;
      discount?: number;
      totalAmount: number;
      paymentMethod: 'cash' | 'card' | 'other';
      cashPaid?: number;
      cardPaid?: number;
      changeAmount?: number;
    };
    items: Array<{
      name: string;
      quantity: number;
      unitPrice?: number;
      totalPrice: number;
      subItems?: Array<{
        name: string;
        quantity: number;
        unitPrice?: number;
        totalPrice: number;
      }>;
    }>;
  };
  rawText?: string;            // OCR text for debugging
}
```

**Member 2 (Backend)** accepts this and stores it via the API.

---

## Quick SQLite Setup

```bash
# Create database file
touch bookkeeper.db

# Run schema (save above SQL to schema.sql)
sqlite3 bookkeeper.db < schema.sql
```

Or use Prisma/Drizzle ORM for type-safe database access in Next.js.

---

## Questions for Team Sync

1. ✅ Use SQLite for hackathon (simple, portable)
2. ✅ Store original image in `/public/uploads/receipts/`
3. ✅ Keep raw OCR text for debugging
4. ⚠️ Decide: Use Prisma or raw SQL?
5. ⚠️ Decide: ChromaDB for RAG - same schema or separate?
