/**
 * AI Auditor - Text-to-SQL with Local LLM
 * 
 * Flow: User Question → Ollama → SQL → Execute → Ollama → Answer
 * 
 * No RAG needed - just intelligent SQL generation!
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { statements } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

// Database schema for the LLM
const DB_SCHEMA = `
Tables:
1. receipts (id TEXT, vendor_id TEXT, total_amount REAL, tax_amount REAL, subtotal REAL, 
   payment_method TEXT ['cash','card','e-money','unknown'], status TEXT ['verified','flagged','pending'],
   receipt_date DATETIME, discount REAL, service_charge REAL)
   
2. line_items (id TEXT, receipt_id TEXT, name TEXT, quantity INTEGER, unit_price REAL, total_price REAL, category TEXT)

3. vendors (id TEXT, name TEXT, address TEXT, phone TEXT, category TEXT)

4. chat_history (id TEXT, session_id TEXT, role TEXT, content TEXT, referenced_receipts TEXT)

Notes:
- Amounts are in IDR (Indonesian Rupiah)
- 'flagged' status means receipt has errors/mismatches
- Use LEFT JOIN for vendors: LEFT JOIN vendors v ON r.vendor_id = v.id
`;

// Call Ollama to generate SQL
async function generateSQL(question: string): Promise<string | null> {
  const prompt = `You are a SQL expert. Given this database schema and a user question, generate ONLY a valid SQLite query. Return ONLY the SQL, no explanation.

${DB_SCHEMA}

User question: "${question}"

Rules:
- Use proper SQLite syntax
- Always alias tables (r for receipts, v for vendors, li for line_items)
- For aggregations use SUM, COUNT, AVG
- Limit results to 20 unless user asks for all
- Return ONLY the SQL query, nothing else

SQL:`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 200 }
      }),
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    let sql = data.response?.trim() || '';
    
    // Clean up the SQL
    sql = sql.replace(/```sql/gi, '').replace(/```/g, '').trim();
    
    // Basic validation
    if (!sql.toLowerCase().startsWith('select')) return null;
    
    return sql;
  } catch (error) {
    console.error('Ollama SQL generation error:', error);
    return null;
  }
}

// Call Ollama to format the answer
async function formatAnswer(question: string, sql: string, results: any[]): Promise<string> {
  const resultsJson = JSON.stringify(results.slice(0, 10), null, 2);
  
  const prompt = `You are a helpful bookkeeping assistant. Format this SQL query result as a clear, concise answer.

User question: "${question}"
SQL executed: ${sql}
Results (JSON): ${resultsJson}
Total rows: ${results.length}

Rules:
- Be concise and professional
- Format numbers with commas (e.g., 1,234,567)
- Use IDR for currency
- Reference specific receipt IDs when relevant
- Use markdown for formatting (bold, lists)
- If no results, say so clearly

Answer:`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 300 }
      }),
    });

    if (!response.ok) throw new Error('Ollama error');
    
    const data = await response.json();
    return data.response?.trim() || 'Unable to format response.';
  } catch (error) {
    // Fallback: simple formatting
    return formatFallback(results);
  }
}

// Fallback formatter (no LLM)
function formatFallback(results: any[]): string {
  if (results.length === 0) return 'No results found.';
  
  const first = results[0];
  const keys = Object.keys(first);
  
  // Single aggregate result
  if (results.length === 1 && (keys.includes('count') || keys.includes('total') || keys.includes('sum'))) {
    let response = '📊 **Results:**\n\n';
    for (const [key, value] of Object.entries(first)) {
      const formatted = typeof value === 'number' ? value.toLocaleString() : value;
      response += `- **${key}**: ${formatted}\n`;
    }
    return response;
  }
  
  // List of receipts
  let response = `📋 **Found ${results.length} results:**\n\n`;
  results.slice(0, 10).forEach((r: any) => {
    if (r.id) {
      const amount = r.total_amount ? ` - ${r.total_amount.toLocaleString()} IDR` : '';
      response += `- **${r.id}**${amount}\n`;
    } else {
      response += `- ${JSON.stringify(r)}\n`;
    }
  });
  
  if (results.length > 10) {
    response += `\n... and ${results.length - 10} more`;
  }
  
  return response;
}

// POST - Text-to-SQL Chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId = uuidv4() } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Step 1: Generate SQL from question
    const sql = await generateSQL(message);
    
    if (!sql) {
      // Fallback to simple response if LLM unavailable
      return NextResponse.json({
        sessionId,
        message: "I couldn't understand that question. Try asking about spending totals, flagged receipts, or payment methods.",
        sql: null,
        error: 'Could not generate SQL - is Ollama running?'
      });
    }

    // Step 2: Execute SQL
    let results: any[];
    try {
      const stmt = db.prepare(sql);
      results = stmt.all();
    } catch (sqlError) {
      return NextResponse.json({
        sessionId,
        message: `SQL error: ${sqlError}`,
        sql,
        error: 'SQL execution failed'
      }, { status: 400 });
    }

    // Step 3: Format answer with LLM
    const answer = await formatAnswer(message, sql, results);

    // Extract receipt IDs
    const referencedReceipts = results
      .filter((r: any) => r.id && r.id.startsWith('cord_'))
      .map((r: any) => r.id)
      .slice(0, 20);

    // Save to chat history
    statements.insertChatMessage.run(`msg_${uuidv4().slice(0, 8)}`, sessionId, 'user', message, null);
    statements.insertChatMessage.run(`msg_${uuidv4().slice(0, 8)}`, sessionId, 'assistant', answer, JSON.stringify(referencedReceipts));

    return NextResponse.json({
      sessionId,
      message: answer,
      sql,
      referencedReceipts,
      resultCount: results.length,
    });

  } catch (error) {
    console.error('Text-to-SQL error:', error);
    return NextResponse.json({ error: 'Failed to process', details: String(error) }, { status: 500 });
  }
}
