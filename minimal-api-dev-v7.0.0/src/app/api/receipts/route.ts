/**
 * Receipts API Routes
 * GET /api/receipts - List all receipts
 * POST /api/receipts - Create new receipt from extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db, { statements } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let receipts;
    if (status) {
      receipts = statements.getReceiptsByStatus.all(status);
    } else {
      receipts = statements.getAllReceipts.all();
    }

    // Get line items for each receipt
    const receiptsWithItems = receipts.map((receipt: any) => {
      const items = statements.getLineItemsByReceipt.all(receipt.id);
      return {
        ...receipt,
        items,
      };
    });

    return NextResponse.json({
      receipts: receiptsWithItems,
      total: receiptsWithItems.length,
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Expected body format matches ExtractionResult.data
    const { vendor, receipt, items, imagePath, confidence, rawOcrText } = body;

    // Start a transaction
    const transaction = db.transaction(() => {
      // Create or find vendor
      let vendorId = null;
      if (vendor?.name) {
        const existingVendor = statements.getVendorByName.get(vendor.name);
        if (existingVendor) {
          vendorId = (existingVendor as any).id;
        } else {
          vendorId = uuidv4();
          statements.insertVendor.run(
            vendorId,
            vendor.name,
            vendor.businessNumber || null,
            vendor.address || null,
            vendor.phone || null,
            'general'
          );
        }
      }

      // Create receipt
      const receiptId = uuidv4();
      statements.insertReceipt.run(
        receiptId,
        vendorId,
        null, // receipt_number
        receipt.date || null,
        receipt.subtotal || 0,
        receipt.taxAmount || 0,
        receipt.serviceCharge || 0,
        receipt.discount || 0,
        receipt.totalAmount,
        receipt.paymentMethod,
        receipt.cashPaid || null,
        receipt.cardPaid || null,
        receipt.changeAmount || null,
        'pending',
        confidence || null,
        imagePath || null,
        rawOcrText || null,
        JSON.stringify({ vendor, receipt, items })
      );

      // Create line items
      for (const item of items || []) {
        const itemId = uuidv4();
        statements.insertLineItem.run(
          itemId,
          receiptId,
          item.name,
          item.description || null,
          item.quantity || 1,
          item.unitPrice || null,
          item.totalPrice,
          null, // parent_item_id
          0, // is_sub_item
          item.category || null
        );

        // Handle sub-items
        if (item.subItems) {
          for (const subItem of item.subItems) {
            statements.insertLineItem.run(
              uuidv4(),
              receiptId,
              subItem.name,
              null,
              subItem.quantity || 1,
              subItem.unitPrice || null,
              subItem.totalPrice,
              itemId,
              1,
              null
            );
          }
        }
      }

      return receiptId;
    });

    const receiptId = transaction();

    // Fetch the created receipt with items
    const createdReceipt = statements.getReceiptById.get(receiptId);
    const createdItems = statements.getLineItemsByReceipt.all(receiptId);

    return NextResponse.json({
      success: true,
      receipt: {
        ...createdReceipt,
        items: createdItems,
      },
    });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to create receipt', details: String(error) },
      { status: 500 }
    );
  }
}
