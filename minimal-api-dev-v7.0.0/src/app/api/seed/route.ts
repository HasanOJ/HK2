/**
 * Seed API - Ingest CORD dataset into SQLite database
 * POST /api/seed - Seeds the database with cord_receipts.json
 * DELETE /api/seed - Clears all data from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db, { statements } from '@/lib/db';

interface CordReceipt {
  vendor: {
    name: string;
    address: string | null;
    phone: string | null;
    business_number: string | null;
  };
  receipt: {
    id: string;
    vendor_name: string;
    date: string | null;
    subtotal: number | null;
    tax_amount: number | null;
    service_charge: number | null;
    discount: number | null;
    total_amount: number;
    cash_paid: number | null;
    card_paid: number | null;
    change_amount: number | null;
    payment_method: string;
    category: string;
    has_error: boolean;
    items_sum: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number | null;
    total_price: number;
  }>;
  split: string;
}

// POST - Seed the database
export async function POST(request: NextRequest) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'cord_receipts.json');
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'cord_receipts.json not found. Run the notebook first.' },
        { status: 404 }
      );
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const receipts: CordReceipt[] = JSON.parse(rawData);

    let vendorsCreated = 0;
    let receiptsCreated = 0;
    let itemsCreated = 0;
    const errors: string[] = [];

    // Track unique vendors
    const vendorMap = new Map<string, string>();

    // Use transaction for better performance
    const seedTransaction = db.transaction(() => {
      for (const cordReceipt of receipts) {
        try {
          // 1. Get or create vendor
          let vendorId: string;
          const vendorName = cordReceipt.vendor.name || 'Unknown Vendor';
          
          if (vendorMap.has(vendorName)) {
            vendorId = vendorMap.get(vendorName)!;
          } else {
            // Check if vendor exists
            const existingVendor = statements.getVendorByName.get(vendorName) as { id: string } | undefined;
            
            if (existingVendor) {
              vendorId = existingVendor.id;
            } else {
              // Create new vendor
              vendorId = `vendor_${uuidv4().slice(0, 8)}`;
              statements.insertVendor.run(
                vendorId,
                vendorName,
                cordReceipt.vendor.business_number,
                cordReceipt.vendor.address,
                cordReceipt.vendor.phone,
                'general' // default category
              );
              vendorsCreated++;
            }
            vendorMap.set(vendorName, vendorId);
          }

          // 2. Create receipt
          const receiptId = cordReceipt.receipt.id;
          const status = cordReceipt.receipt.has_error ? 'flagged' : 'verified';
          
          statements.insertReceipt.run(
            receiptId,
            vendorId,
            null, // receipt_number
            cordReceipt.receipt.date, // receipt_date (null for CORD)
            cordReceipt.receipt.subtotal || 0,
            cordReceipt.receipt.tax_amount || 0,
            cordReceipt.receipt.service_charge || 0,
            cordReceipt.receipt.discount || 0,
            cordReceipt.receipt.total_amount || 0,
            cordReceipt.receipt.payment_method,
            cordReceipt.receipt.cash_paid,
            cordReceipt.receipt.card_paid,
            cordReceipt.receipt.change_amount,
            status,
            1.0, // confidence_score (CORD ground truth is 100% accurate)
            null, // image_path
            null, // raw_ocr_text
            JSON.stringify(cordReceipt) // extracted_json - store original data
          );
          receiptsCreated++;

          // 3. Create line items
          for (const item of cordReceipt.items) {
            const itemId = `item_${uuidv4().slice(0, 8)}`;
            statements.insertLineItem.run(
              itemId,
              receiptId,
              item.name,
              null, // description
              item.quantity || 1,
              item.unit_price,
              item.total_price || 0,
              null, // parent_item_id
              0, // is_sub_item
              cordReceipt.receipt.category // category
            );
            itemsCreated++;
          }
        } catch (err) {
          errors.push(`Error processing ${cordReceipt.receipt.id}: ${err}`);
        }
      }
    });

    // Execute transaction
    seedTransaction();

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      stats: {
        vendorsCreated,
        receiptsCreated,
        itemsCreated,
        totalRecordsProcessed: receipts.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Clear all data
export async function DELETE(request: NextRequest) {
  try {
    // Clear all tables in correct order (respecting foreign keys)
    db.exec(`
      DELETE FROM line_items;
      DELETE FROM receipt_categories;
      DELETE FROM receipts;
      DELETE FROM vendors;
      DELETE FROM chat_history;
    `);

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
    });
  } catch (error) {
    console.error('Clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear database', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Check seed status
export async function GET(request: NextRequest) {
  try {
    const stats = statements.getOverallStats.get() as {
      receipt_count: number;
      total_spent: number;
      total_tax: number;
      avg_transaction: number;
      avg_confidence: number;
    };

    const vendors = statements.getAllVendors.all();

    return NextResponse.json({
      seeded: stats.receipt_count > 0,
      stats: {
        receiptCount: stats.receipt_count,
        vendorCount: vendors.length,
        totalSpent: stats.total_spent,
        totalTax: stats.total_tax,
        avgTransaction: stats.avg_transaction,
      },
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get seed status', details: String(error) },
      { status: 500 }
    );
  }
}
