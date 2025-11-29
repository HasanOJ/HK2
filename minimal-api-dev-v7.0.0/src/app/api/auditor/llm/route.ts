/**
 * AI Auditor Chat with Ollama LLM - Enhanced Pillar 3
 * Uses Ollama for intelligent natural language understanding
 * 
 * Queries the database based on parsed intent, then uses
 * Ollama to generate intelligent responses with context.
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { statements } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// System prompt for the AI auditor
const SYSTEM_PROMPT = `You are an AI bookkeeping assistant helping analyze receipt data.
You have access to a database of receipts with the following information:
- Receipt ID, vendor, date, total amount, tax amount
- Payment method (cash, card, e-money)
- Line items (products, quantities, prices)
- Status (verified, flagged, pending)

When answering questions:
1. Be concise and professional
2. Always reference specific receipt IDs when discussing receipts
3. Use currency format with IDR (Indonesian Rupiah)
4. Highlight any concerns or anomalies
5. Format numbers with thousands separators

Current database statistics will be provided as context.`;

// Query patterns for intent detection
const QUERY_PATTERNS = {
  total_spending: /how much|total|spent|spending|sum/i,
  high_value: /above|over|more than|greater|expensive|highest|big/i,
  low_value: /below|under|less than|cheaper|lowest|cheapest|small/i,
  flagged: /flag|error|mismatch|problem|issue|wrong|review/i,
  payment_method: /cash|card|credit|e-money|payment|paid/i,
  count: /how many|count|number of/i,
  tax: /tax|vat/i,
  audit: /audit|duplicate|suspicious|alcohol|tobacco|check/i,
  summary: /summary|overview|report|dashboard|stats/i,
};

// Extract number from query
function extractNumber(query: string): number | null {
  const match = query.match(/(\d+[\d,]*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return null;
}

// Get database context for LLM
function getDatabaseContext(): string {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_receipts,
      SUM(total_amount) as total_spent,
      SUM(tax_amount) as total_tax,
      AVG(total_amount) as avg_receipt,
      SUM(CASE WHEN status = 'flagged' THEN 1 ELSE 0 END) as flagged_count
    FROM receipts
  `).get() as any;

  const paymentBreakdown = db.prepare(`
    SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
    FROM receipts
    GROUP BY payment_method
  `).all();

  return `Current Database State:
- Total receipts: ${stats.total_receipts}
- Total spent: ${stats.total_spent?.toLocaleString()} IDR
- Total tax: ${stats.total_tax?.toLocaleString()} IDR
- Average receipt: ${Math.round(stats.avg_receipt)?.toLocaleString()} IDR
- Flagged receipts: ${stats.flagged_count}
- Payment breakdown: ${JSON.stringify(paymentBreakdown)}`;
}

// Get relevant receipts based on query
function getRelevantReceipts(query: string): any[] {
  const lowerQuery = query.toLowerCase();
  const threshold = extractNumber(query);
  
  // Determine which receipts to fetch
  if (QUERY_PATTERNS.flagged.test(lowerQuery)) {
    return db.prepare(`
      SELECT r.id, r.total_amount, r.tax_amount, r.payment_method, r.status, v.name as vendor
      FROM receipts r LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.status = 'flagged'
      ORDER BY r.total_amount DESC LIMIT 10
    `).all();
  }
  
  if (QUERY_PATTERNS.high_value.test(lowerQuery) && threshold) {
    return db.prepare(`
      SELECT r.id, r.total_amount, r.tax_amount, r.payment_method, r.status, v.name as vendor
      FROM receipts r LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.total_amount > ?
      ORDER BY r.total_amount DESC LIMIT 15
    `).all(threshold);
  }
  
  if (QUERY_PATTERNS.low_value.test(lowerQuery) && threshold) {
    return db.prepare(`
      SELECT r.id, r.total_amount, r.tax_amount, r.payment_method, r.status, v.name as vendor
      FROM receipts r LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.total_amount < ?
      ORDER BY r.total_amount ASC LIMIT 15
    `).all(threshold);
  }
  
  if (QUERY_PATTERNS.payment_method.test(lowerQuery)) {
    let method = 'unknown';
    if (lowerQuery.includes('cash')) method = 'cash';
    else if (lowerQuery.includes('card')) method = 'card';
    else if (lowerQuery.includes('e-money')) method = 'e-money';
    
    if (method !== 'unknown') {
      return db.prepare(`
        SELECT r.id, r.total_amount, r.tax_amount, r.payment_method, r.status, v.name as vendor
        FROM receipts r LEFT JOIN vendors v ON r.vendor_id = v.id
        WHERE r.payment_method = ?
        ORDER BY r.total_amount DESC LIMIT 15
      `).all(method);
    }
  }
  
  if (QUERY_PATTERNS.tax.test(lowerQuery)) {
    return db.prepare(`
      SELECT r.id, r.total_amount, r.tax_amount, r.payment_method, r.status, v.name as vendor
      FROM receipts r LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.tax_amount > 0
      ORDER BY r.tax_amount DESC LIMIT 15
    `).all();
  }
  
  // Default: top receipts by amount
  return db.prepare(`
    SELECT r.id, r.total_amount, r.tax_amount, r.payment_method, r.status, v.name as vendor
    FROM receipts r LEFT JOIN vendors v ON r.vendor_id = v.id
    ORDER BY r.total_amount DESC LIMIT 10
  `).all();
}

// Call Ollama for intelligent response
async function callOllama(prompt: string, context: string): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${SYSTEM_PROMPT}\n\n${context}\n\nUser question: ${prompt}\n\nProvide a helpful, concise response:`,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 500,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'Unable to generate response.';
  } catch (error) {
    console.error('Ollama error:', error);
    return null as any; // Fall back to rule-based response
  }
}

// Generate rule-based response (fallback)
function generateFallbackResponse(query: string, receipts: any[], dbContext: string): string {
  const lowerQuery = query.toLowerCase();
  const formatAmount = (n: number) => n?.toLocaleString('en-US') ?? '0';
  
  if (QUERY_PATTERNS.summary.test(lowerQuery) || QUERY_PATTERNS.total_spending.test(lowerQuery)) {
    const stats = db.prepare(`
      SELECT COUNT(*) as count, SUM(total_amount) as total, SUM(tax_amount) as tax, AVG(total_amount) as avg
      FROM receipts
    `).get() as any;
    
    return `📊 **Spending Summary**\n\n` +
      `- Total receipts: **${stats.count}**\n` +
      `- Total spent: **${formatAmount(stats.total)}** IDR\n` +
      `- Total tax: **${formatAmount(stats.tax)}** IDR\n` +
      `- Average receipt: **${formatAmount(Math.round(stats.avg))}** IDR`;
  }
  
  if (QUERY_PATTERNS.flagged.test(lowerQuery)) {
    if (receipts.length === 0) {
      return "✅ No flagged receipts found. All receipts are verified!";
    }
    let response = `🚨 **Flagged Receipts** (${receipts.length} found)\n\n`;
    receipts.forEach(r => {
      response += `- **${r.id}**: ${formatAmount(r.total_amount)} IDR\n`;
    });
    return response;
  }
  
  if (QUERY_PATTERNS.high_value.test(lowerQuery)) {
    const threshold = extractNumber(query);
    let response = `💰 **High Value Receipts** (above ${formatAmount(threshold!)} IDR)\n\n`;
    if (receipts.length === 0) {
      return response + "No receipts found above this threshold.";
    }
    receipts.slice(0, 10).forEach(r => {
      response += `- **${r.id}**: ${formatAmount(r.total_amount)} IDR (${r.payment_method || 'unknown'})\n`;
    });
    return response;
  }
  
  // Default
  let response = `📋 **Receipt Results** (${receipts.length} found)\n\n`;
  receipts.slice(0, 10).forEach(r => {
    const status = r.status === 'flagged' ? '🚨' : '✅';
    response += `- ${status} **${r.id}**: ${formatAmount(r.total_amount)} IDR\n`;
  });
  return response;
}

// POST - Chat query
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId = uuidv4(), useOllama = true } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get database context and relevant receipts
    const dbContext = getDatabaseContext();
    const receipts = getRelevantReceipts(message);
    const receiptsContext = receipts.length > 0 
      ? `\n\nRelevant receipts:\n${JSON.stringify(receipts.slice(0, 10), null, 2)}`
      : '';

    let responseText: string;
    let usedOllama = false;

    // Try Ollama first if enabled
    if (useOllama) {
      const ollamaResponse = await callOllama(message, dbContext + receiptsContext);
      if (ollamaResponse) {
        responseText = ollamaResponse;
        usedOllama = true;
      } else {
        responseText = generateFallbackResponse(message, receipts, dbContext);
      }
    } else {
      responseText = generateFallbackResponse(message, receipts, dbContext);
    }

    // Extract referenced receipt IDs
    const referencedReceipts = receipts.map((r: any) => r.id).slice(0, 20);

    // Save to chat history
    const userMsgId = `msg_${uuidv4().slice(0, 8)}`;
    const assistantMsgId = `msg_${uuidv4().slice(0, 8)}`;

    statements.insertChatMessage.run(userMsgId, sessionId, 'user', message, null);
    statements.insertChatMessage.run(assistantMsgId, sessionId, 'assistant', responseText, JSON.stringify(referencedReceipts));

    return NextResponse.json({
      sessionId,
      message: responseText,
      referencedReceipts,
      resultCount: receipts.length,
      usedLLM: usedOllama,
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat', details: String(error) }, { status: 500 });
  }
}

// GET - Get chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const history = statements.getChatHistory.all(sessionId);
    return NextResponse.json({ sessionId, messages: history });

  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: 'Failed to get chat history', details: String(error) }, { status: 500 });
  }
}
