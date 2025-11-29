/**
 * AI Auditor Chat API - Pillar 3
 * Natural language interface for querying receipts
 * 
 * Supports queries like:
 * - "Show me all receipts above 50000"
 * - "How much did we spend total?"
 * - "Which receipts are flagged?"
 * - "Find receipts paid by card"
 * - "What's the tax breakdown?"
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { statements } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Query patterns for intent detection
const QUERY_PATTERNS = {
  total_spending: /how much|total|spent|spending|sum/i,
  high_value: /above|over|more than|greater|expensive|highest/i,
  low_value: /below|under|less than|cheaper|lowest|cheapest/i,
  flagged: /flag|error|mismatch|problem|issue|wrong/i,
  payment_method: /cash|card|credit|e-money|payment/i,
  count: /how many|count|number of/i,
  list: /show|list|find|get|display|all/i,
  tax: /tax|vat/i,
  vendor: /vendor|merchant|store|shop/i,
  category: /category|type|kind/i,
  audit: /audit|duplicate|suspicious|alcohol|tobacco/i,
  recent: /recent|latest|last/i,
  date: /today|yesterday|week|month|date/i,
};

// Extract number from query
function extractNumber(query: string): number | null {
  const match = query.match(/(\d+[\d,]*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return null;
}

// Parse natural language to SQL
function parseQuery(query: string): { sql: string; params: any[]; intent: string } {
  const lowerQuery = query.toLowerCase();
  let sql = '';
  let params: any[] = [];
  let intent = 'general';

  // Detect intents
  const isTotalQuery = QUERY_PATTERNS.total_spending.test(lowerQuery);
  const isHighValue = QUERY_PATTERNS.high_value.test(lowerQuery);
  const isLowValue = QUERY_PATTERNS.low_value.test(lowerQuery);
  const isFlagged = QUERY_PATTERNS.flagged.test(lowerQuery);
  const isPaymentQuery = QUERY_PATTERNS.payment_method.test(lowerQuery);
  const isCountQuery = QUERY_PATTERNS.count.test(lowerQuery);
  const isTaxQuery = QUERY_PATTERNS.tax.test(lowerQuery);
  const isAuditQuery = QUERY_PATTERNS.audit.test(lowerQuery);

  const threshold = extractNumber(query);

  // Build SQL based on intent
  if (isCountQuery && isFlagged) {
    intent = 'count_flagged';
    sql = `SELECT COUNT(*) as count FROM receipts WHERE status = 'flagged'`;
  } else if (isCountQuery) {
    intent = 'count_all';
    sql = `SELECT COUNT(*) as count, SUM(total_amount) as total FROM receipts`;
  } else if (isTotalQuery && !isHighValue && !isLowValue) {
    intent = 'total_spending';
    sql = `
      SELECT 
        COUNT(*) as receipt_count,
        SUM(total_amount) as total_spent,
        SUM(tax_amount) as total_tax,
        AVG(total_amount) as avg_receipt
      FROM receipts
    `;
  } else if (isFlagged) {
    intent = 'flagged_receipts';
    sql = `
      SELECT r.id, r.total_amount, r.status, v.name as vendor
      FROM receipts r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.status = 'flagged'
      ORDER BY r.total_amount DESC
    `;
  } else if (isHighValue && threshold) {
    intent = 'high_value_receipts';
    sql = `
      SELECT r.id, r.total_amount, r.payment_method, v.name as vendor
      FROM receipts r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.total_amount > ?
      ORDER BY r.total_amount DESC
      LIMIT 20
    `;
    params = [threshold];
  } else if (isLowValue && threshold) {
    intent = 'low_value_receipts';
    sql = `
      SELECT r.id, r.total_amount, r.payment_method, v.name as vendor
      FROM receipts r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.total_amount < ?
      ORDER BY r.total_amount ASC
      LIMIT 20
    `;
    params = [threshold];
  } else if (isPaymentQuery) {
    intent = 'payment_breakdown';
    if (lowerQuery.includes('cash')) {
      sql = `
        SELECT r.id, r.total_amount, r.payment_method, v.name as vendor
        FROM receipts r
        LEFT JOIN vendors v ON r.vendor_id = v.id
        WHERE r.payment_method = 'cash'
        ORDER BY r.total_amount DESC
        LIMIT 20
      `;
    } else if (lowerQuery.includes('card')) {
      sql = `
        SELECT r.id, r.total_amount, r.payment_method, v.name as vendor
        FROM receipts r
        LEFT JOIN vendors v ON r.vendor_id = v.id
        WHERE r.payment_method = 'card'
        ORDER BY r.total_amount DESC
        LIMIT 20
      `;
    } else {
      sql = `
        SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
        FROM receipts
        GROUP BY payment_method
        ORDER BY count DESC
      `;
    }
  } else if (isTaxQuery) {
    intent = 'tax_info';
    sql = `
      SELECT r.id, r.total_amount, r.tax_amount, v.name as vendor
      FROM receipts r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.tax_amount > 0
      ORDER BY r.tax_amount DESC
      LIMIT 20
    `;
  } else if (isAuditQuery) {
    intent = 'audit_findings';
    sql = `
      SELECT r.id, r.total_amount, r.status, r.tax_amount, v.name as vendor
      FROM receipts r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.status = 'flagged' OR r.tax_amount IS NULL OR r.tax_amount = 0
      ORDER BY r.total_amount DESC
      LIMIT 20
    `;
  } else {
    // Default: show recent receipts
    intent = 'list_receipts';
    sql = `
      SELECT r.id, r.total_amount, r.payment_method, r.status, v.name as vendor
      FROM receipts r
      LEFT JOIN vendors v ON r.vendor_id = v.id
      ORDER BY r.total_amount DESC
      LIMIT 15
    `;
  }

  return { sql, params, intent };
}

// Format currency
const formatAmount = (n: number) => n?.toLocaleString('en-US') ?? '0';

// Generate natural language response
function generateResponse(intent: string, results: any[], query: string): string {
  if (results.length === 0) {
    return "I couldn't find any receipts matching your query.";
  }

  switch (intent) {
    case 'total_spending': {
      const r = results[0];
      return `📊 **Spending Summary**\n\n` +
        `- Total receipts: **${r.receipt_count}**\n` +
        `- Total spent: **${formatAmount(r.total_spent)}** IDR\n` +
        `- Total tax: **${formatAmount(r.total_tax)}** IDR\n` +
        `- Average receipt: **${formatAmount(Math.round(r.avg_receipt))}** IDR`;
    }
    case 'count_all': {
      const r = results[0];
      return `You have **${r.count}** receipts totaling **${formatAmount(r.total)}** IDR.`;
    }
    case 'count_flagged': {
      return `There are **${results[0].count}** flagged receipts that need review.`;
    }
    case 'flagged_receipts': {
      let response = `🚨 **Flagged Receipts** (${results.length} found)\n\n`;
      response += `These receipts have mismatches between line items and totals:\n\n`;
      results.forEach(r => {
        response += `- **${r.id}**: ${formatAmount(r.total_amount)} IDR\n`;
      });
      return response;
    }
    case 'high_value_receipts': {
      const threshold = extractNumber(query);
      let response = `💰 **High Value Receipts** (above ${formatAmount(threshold!)} IDR)\n\n`;
      response += `Found ${results.length} receipts:\n\n`;
      results.slice(0, 10).forEach(r => {
        response += `- **${r.id}**: ${formatAmount(r.total_amount)} IDR (${r.payment_method || 'unknown'})\n`;
      });
      if (results.length > 10) {
        response += `\n... and ${results.length - 10} more`;
      }
      return response;
    }
    case 'low_value_receipts': {
      const threshold = extractNumber(query);
      let response = `📉 **Low Value Receipts** (below ${formatAmount(threshold!)} IDR)\n\n`;
      response += `Found ${results.length} receipts:\n\n`;
      results.slice(0, 10).forEach(r => {
        response += `- **${r.id}**: ${formatAmount(r.total_amount)} IDR (${r.payment_method || 'unknown'})\n`;
      });
      return response;
    }
    case 'payment_breakdown': {
      if (results[0]?.id) {
        const method = results[0].payment_method;
        let response = `💳 **${(method || 'Unknown').toUpperCase()} Payments** (${results.length} found)\n\n`;
        const total = results.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);
        response += `Total: **${formatAmount(total)}** IDR\n\n`;
        results.slice(0, 10).forEach(r => {
          response += `- **${r.id}**: ${formatAmount(r.total_amount)} IDR\n`;
        });
        return response;
      } else {
        let response = `💳 **Payment Method Breakdown**\n\n`;
        results.forEach(r => {
          response += `- **${r.payment_method || 'Unknown'}**: ${r.count} receipts (${formatAmount(r.total)} IDR)\n`;
        });
        return response;
      }
    }
    case 'tax_info': {
      let response = `🧾 **Receipts with Tax/VAT** (${results.length} found)\n\n`;
      const totalTax = results.reduce((sum: number, r: any) => sum + (r.tax_amount || 0), 0);
      response += `Total tax collected: **${formatAmount(totalTax)}** IDR\n\n`;
      results.slice(0, 10).forEach(r => {
        response += `- **${r.id}**: Tax ${formatAmount(r.tax_amount)} IDR (Receipt: ${formatAmount(r.total_amount)} IDR)\n`;
      });
      return response;
    }
    case 'audit_findings': {
      let response = `🔍 **Audit Findings** (${results.length} items)\n\n`;
      const flagged = results.filter(r => r.status === 'flagged');
      const noTax = results.filter(r => !r.tax_amount || r.tax_amount === 0);
      
      if (flagged.length > 0) {
        response += `**⚠️ Flagged (mismatch):** ${flagged.length}\n`;
        flagged.slice(0, 5).forEach(r => {
          response += `  - ${r.id}: ${formatAmount(r.total_amount)} IDR\n`;
        });
      }
      if (noTax.length > 0) {
        response += `\n**📋 Missing VAT:** ${noTax.length}\n`;
        noTax.slice(0, 5).forEach(r => {
          response += `  - ${r.id}: ${formatAmount(r.total_amount)} IDR\n`;
        });
      }
      return response;
    }
    default: {
      let response = `📋 **Receipts** (showing ${Math.min(results.length, 15)})\n\n`;
      results.slice(0, 15).forEach(r => {
        const status = r.status === 'flagged' ? '🚨' : '✅';
        response += `- ${status} **${r.id}**: ${formatAmount(r.total_amount)} IDR (${r.payment_method || 'unknown'})\n`;
      });
      return response;
    }
  }
}

// POST - Chat query
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId = uuidv4() } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Parse the query
    const { sql, params, intent } = parseQuery(message);

    // Execute query
    const stmt = db.prepare(sql);
    const results = params.length > 0 ? stmt.all(...params) : stmt.all();

    // Generate response
    const response = generateResponse(intent, results, message);

    // Extract referenced receipt IDs
    const referencedReceipts = results
      .filter((r: any) => r.id)
      .map((r: any) => r.id)
      .slice(0, 20);

    // Save to chat history
    const userMsgId = `msg_${uuidv4().slice(0, 8)}`;
    const assistantMsgId = `msg_${uuidv4().slice(0, 8)}`;

    statements.insertChatMessage.run(
      userMsgId,
      sessionId,
      'user',
      message,
      null
    );

    statements.insertChatMessage.run(
      assistantMsgId,
      sessionId,
      'assistant',
      response,
      JSON.stringify(referencedReceipts)
    );

    return NextResponse.json({
      sessionId,
      message: response,
      intent,
      referencedReceipts,
      resultCount: results.length,
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Get chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const history = statements.getChatHistory.all(sessionId);

    return NextResponse.json({
      sessionId,
      messages: history,
    });

  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history', details: String(error) },
      { status: 500 }
    );
  }
}
