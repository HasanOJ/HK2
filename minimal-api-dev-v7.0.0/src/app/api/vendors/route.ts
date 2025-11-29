/**
 * Vendors API Routes
 * GET /api/vendors - List all vendors
 */

import { NextRequest, NextResponse } from 'next/server';
import { statements } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const vendors = statements.getAllVendors.all();

    return NextResponse.json({
      vendors,
      total: vendors.length,
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}
