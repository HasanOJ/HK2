/**
 * Single Receipt API Routes
 * GET /api/receipts/[id] - Get receipt by ID
 * PUT /api/receipts/[id] - Update receipt
 * DELETE /api/receipts/[id] - Delete receipt
 */

import { NextRequest, NextResponse } from 'next/server';
import { statements } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const receipt = statements.getReceiptById.get(id);
    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    const items = statements.getLineItemsByReceipt.all(id);

    return NextResponse.json({
      receipt: {
        ...receipt,
        items,
      },
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // For now, only allow updating status
    if (body.status) {
      statements.updateReceiptStatus.run(body.status, id);
    }

    const updatedReceipt = statements.getReceiptById.get(id);
    const items = statements.getLineItemsByReceipt.all(id);

    return NextResponse.json({
      success: true,
      receipt: {
        ...updatedReceipt,
        items,
      },
    });
  } catch (error) {
    console.error('Error updating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to update receipt' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const receipt = statements.getReceiptById.get(id);
    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    statements.deleteReceipt.run(id);

    return NextResponse.json({
      success: true,
      message: 'Receipt deleted',
    });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 }
    );
  }
}
