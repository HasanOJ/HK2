/**
 * Analytics API Routes
 * GET /api/analytics/summary - Get overall expense summary
 * GET /api/analytics/by-period - Get expenses by month
 * GET /api/analytics/by-vendor - Get top vendors by spend
 */

import { NextRequest, NextResponse } from 'next/server';
import { statements } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const months = parseInt(searchParams.get('months') || '6');

    // Calculate date range
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString().split('T')[0];

    switch (type) {
      case 'summary': {
        const stats = statements.getOverallStats.get() as any;
        const byVendor = statements.getTotalsByVendor.all();
        const byPeriod = statements.getTotalsByPeriod.all(startDateStr);

        return NextResponse.json({
          summary: {
            totalSpent: stats?.total_spent || 0,
            receiptCount: stats?.receipt_count || 0,
            averageTransaction: stats?.avg_transaction || 0,
            taxTotal: stats?.total_tax || 0,
            avgConfidence: stats?.avg_confidence || 0,
          },
          byVendor,
          byPeriod,
        });
      }

      case 'by-period': {
        const byPeriod = statements.getTotalsByPeriod.all(startDateStr);
        return NextResponse.json({ byPeriod });
      }

      case 'by-vendor': {
        const byVendor = statements.getTotalsByVendor.all();
        return NextResponse.json({ byVendor });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
