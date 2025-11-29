/**
 * EXTRACTION TYPES - Shared between Member 1 (Extraction) and Member 2 (Backend)
 * 
 * This file defines the contract for receipt extraction output.
 * Member 1: Implement extraction that outputs `ExtractionResult`
 * Member 2: Accept `ExtractionResult` and store in database
 */

// ============================================
// CORD Dataset Ground Truth Label Reference
// ============================================
// menu: { nm, num, unitprice, cnt, discountprice, price, itemsubtotal, sub }
// sub_total: { subtotal_price, discount_price, service_price, othersvc_price, tax_price, etc. }
// total: { total_price, creditcardprice, emoneyprice, cashprice, changeprice, menutype_cnt, menuqty_cnt }
// store_info: { name, addr, tel, fax, biznum }

// ============================================
// EXTRACTION OUTPUT TYPES
// ============================================

/**
 * Vendor/Store info - OPTIONAL in CORD dataset
 * Note: Not all CORD receipts have store_info in gt_parse.
 * When missing, extract from valid_line if available, or leave empty.
 */
export interface VendorInfo {
  name: string;              // CORD: store_info.name (may need to extract from image)
  address?: string;          // CORD: store_info.addr
  phone?: string;            // CORD: store_info.tel
  businessNumber?: string;   // CORD: store_info.biznum
}

/**
 * CORD prices are STRINGS with locale formatting (e.g., "16,500")
 * Use this helper to parse them to numbers.
 */
export function parseCordPrice(priceStr: string | undefined): number | undefined {
  if (!priceStr) return undefined;
  // Remove all non-numeric chars except decimal point
  // CORD uses comma as thousand separator, not decimal
  const cleaned = priceStr.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : undefined;
}

export interface LineItem {
  name: string;              // CORD: menu.nm
  quantity: number;          // CORD: menu.cnt (default: 1)
  unitPrice?: number;        // CORD: menu.unitprice
  totalPrice: number;        // CORD: menu.price
  subItems?: LineItem[];     // CORD: menu.sub (nested items)
}

export interface ReceiptData {
  // Date/Time
  date?: string;             // ISO 8601 format (e.g., "2024-01-15")
  time?: string;             // HH:mm format (e.g., "14:30")
  
  // Subtotals (CORD: sub_total)
  subtotal?: number;         // CORD: sub_total.subtotal_price
  taxAmount?: number;        // CORD: sub_total.tax_price (VAT/GST)
  serviceCharge?: number;    // CORD: sub_total.service_price
  discount?: number;         // CORD: sub_total.discount_price
  
  // Total (CORD: total)
  totalAmount: number;       // CORD: total.total_price (REQUIRED)
  
  // Payment breakdown (CORD: total)
  paymentMethod: 'cash' | 'card' | 'mixed' | 'other';
  cashPaid?: number;         // CORD: total.cashprice
  cardPaid?: number;         // CORD: total.creditcardprice
  changeAmount?: number;     // CORD: total.changeprice
  
  // Item counts (CORD: total)
  itemTypeCount?: number;    // CORD: total.menutype_cnt
  totalItemCount?: number;   // CORD: total.menuqty_cnt
}

export interface ExtractionResult {
  // Status
  success: boolean;
  confidence: number;        // 0.0 - 1.0 (overall extraction confidence)
  errors?: string[];         // Any errors/warnings during extraction
  
  // Extracted data
  data: {
    vendor: VendorInfo | null;  // NULL if no store_info found in receipt
    receipt: ReceiptData;
    items: LineItem[];
  };
  
  // Debug info
  rawOcrText?: string;       // Raw text from OCR (for debugging)
  processingTimeMs?: number; // How long extraction took
  modelUsed?: string;        // Which LLM was used (e.g., "llama3.2-vision")
}

// ============================================
// EXTRACTION FUNCTION SIGNATURE
// ============================================

/**
 * Member 1 implements this function.
 * Input: Receipt image file
 * Output: Structured extraction result
 */
export type ExtractReceiptFn = (
  imagePath: string,
  options?: {
    language?: string;       // Default: 'en'
    includeRawText?: boolean;
  }
) => Promise<ExtractionResult>;

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// Member 1 - Extraction code
import { ExtractionResult } from './extraction.types';

export async function extractReceipt(imagePath: string): Promise<ExtractionResult> {
  // 1. OCR the image
  // 2. Send to Ollama LLM with structured prompt
  // 3. Parse response into ExtractionResult
  
  return {
    success: true,
    confidence: 0.92,
    data: {
      vendor: {
        name: "Coffee Shop ABC",
        address: "123 Main St",
        phone: "555-1234"
      },
      receipt: {
        date: "2024-01-15",
        subtotal: 25.00,
        taxAmount: 2.50,
        totalAmount: 27.50,
        paymentMethod: 'card',
        cardPaid: 27.50
      },
      items: [
        { name: "Latte", quantity: 2, unitPrice: 5.00, totalPrice: 10.00 },
        { name: "Croissant", quantity: 1, unitPrice: 3.50, totalPrice: 3.50 },
        { name: "Sandwich", quantity: 1, unitPrice: 11.50, totalPrice: 11.50 }
      ]
    }
  };
}

// Member 2 - API endpoint
app.post('/api/receipts/upload', async (req, res) => {
  const { imagePath } = req.body;
  
  // Call Member 1's extraction function
  const result = await extractReceipt(imagePath);
  
  if (!result.success) {
    return res.status(400).json({ error: result.errors });
  }
  
  // Store in database
  const receipt = await db.receipts.create({
    data: {
      vendorName: result.data.vendor.name,
      totalAmount: result.data.receipt.totalAmount,
      confidenceScore: result.confidence,
      // ... etc
    }
  });
  
  return res.json({ receipt });
});
*/

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateExtractionResult(result: ExtractionResult): string[] {
  const errors: string[] = [];
  
  if (!result.data.receipt.totalAmount) {
    errors.push('Total amount is required');
  }
  
  // Vendor is now optional (not all CORD receipts have store_info)
  // if (!result.data.vendor?.name) {
  //   errors.push('Vendor name is required');
  // }
  
  if (result.data.items.length === 0) {
    errors.push('At least one line item is required');
  }
  
  // Check if items sum to total (with tolerance for tax/service)
  const itemsSum = result.data.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const expectedSubtotal = result.data.receipt.subtotal || result.data.receipt.totalAmount;
  
  // Use percentage tolerance (5%) instead of fixed amount for Indonesian Rupiah
  const tolerance = expectedSubtotal * 0.05;
  if (Math.abs(itemsSum - expectedSubtotal) > tolerance) { 
    errors.push(`Items sum (${itemsSum}) doesn't match subtotal (${expectedSubtotal})`);
  }
  
  return errors;
}

// ============================================
// CORD DATASET TYPES (for parsing gt_parse)
// ============================================

/**
 * Raw CORD gt_parse structure - matches the dataset exactly.
 * Use CordParser to convert to ExtractionResult.
 */
export interface CordGtParse {
  menu?: CordMenuItem[];
  sub_total?: {
    subtotal_price?: string;
    discount_price?: string;
    service_price?: string;
    othersvc_price?: string;
    tax_price?: string;
  };
  total?: {
    total_price?: string;
    creditcardprice?: string;
    emoneyprice?: string;
    cashprice?: string;
    changeprice?: string;
    menutype_cnt?: string;
    menuqty_cnt?: string;
  };
  store_info?: {
    name?: string;
    addr?: string;
    tel?: string;
    fax?: string;
    biznum?: string;
  };
}

export interface CordMenuItem {
  nm?: string;           // Item name
  num?: string;          // Item number
  unitprice?: string;    // Unit price
  cnt?: string;          // Count/quantity
  discountprice?: string;
  price?: string;        // Total price for this item
  itemsubtotal?: string;
  sub?: CordMenuItem[];  // Sub-items (e.g., toppings, modifiers)
}

export interface CordValidLine {
  words: Array<{
    quad: { x1: number; y1: number; x2: number; y2: number; x3: number; y3: number; x4: number; y4: number };
    is_key: number;
    row_id: number;
    text: string;
  }>;
  category: string;      // e.g., "menu.nm", "menu.cnt", "total.total_price"
  group_id: number;
  sub_group_id: number;
}

/**
 * Convert CORD gt_parse to our ExtractionResult format
 */
export function cordToExtractionResult(gtParse: CordGtParse): ExtractionResult {
  const items: LineItem[] = (gtParse.menu || []).map(item => ({
    name: item.nm || 'Unknown Item',
    quantity: parseCordPrice(item.cnt) || 1,
    unitPrice: parseCordPrice(item.unitprice),
    totalPrice: parseCordPrice(item.price) || 0,
    subItems: item.sub?.map(sub => ({
      name: sub.nm || 'Sub-item',
      quantity: parseCordPrice(sub.cnt) || 1,
      unitPrice: parseCordPrice(sub.unitprice),
      totalPrice: parseCordPrice(sub.price) || 0,
    })),
  }));

  const totalAmount = parseCordPrice(gtParse.total?.total_price) || 0;
  const cashPaid = parseCordPrice(gtParse.total?.cashprice);
  const cardPaid = parseCordPrice(gtParse.total?.creditcardprice);
  
  // Determine payment method
  let paymentMethod: 'cash' | 'card' | 'mixed' | 'other' = 'other';
  if (cashPaid && cardPaid) paymentMethod = 'mixed';
  else if (cashPaid) paymentMethod = 'cash';
  else if (cardPaid) paymentMethod = 'card';

  const vendor: VendorInfo | null = gtParse.store_info?.name 
    ? {
        name: gtParse.store_info.name,
        address: gtParse.store_info.addr,
        phone: gtParse.store_info.tel,
        businessNumber: gtParse.store_info.biznum,
      }
    : null;

  return {
    success: true,
    confidence: 1.0, // Ground truth = 100% confidence
    data: {
      vendor,
      receipt: {
        subtotal: parseCordPrice(gtParse.sub_total?.subtotal_price),
        taxAmount: parseCordPrice(gtParse.sub_total?.tax_price),
        serviceCharge: parseCordPrice(gtParse.sub_total?.service_price),
        discount: parseCordPrice(gtParse.sub_total?.discount_price),
        totalAmount,
        paymentMethod,
        cashPaid,
        cardPaid,
        changeAmount: parseCordPrice(gtParse.total?.changeprice),
        itemTypeCount: parseCordPrice(gtParse.total?.menutype_cnt),
        totalItemCount: parseCordPrice(gtParse.total?.menuqty_cnt),
      },
      items,
    },
    modelUsed: 'cord-ground-truth',
  };
}

