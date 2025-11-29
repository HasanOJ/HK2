/**
 * Receipt Extraction using Ollama Vision Model
 * Extracts structured data from receipt images
 */

import fs from 'fs';
import path from 'path';

// ============================================
// TYPES (copied from extraction.types.ts)
// ============================================

export interface VendorInfo {
  name: string;
  address?: string;
  phone?: string;
  businessNumber?: string;
}

export interface LineItem {
  name: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  subItems?: LineItem[];
}

export interface ReceiptData {
  date?: string;
  time?: string;
  subtotal?: number;
  taxAmount?: number;
  serviceCharge?: number;
  discount?: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mixed' | 'other';
  cashPaid?: number;
  cardPaid?: number;
  changeAmount?: number;
}

export interface ExtractionResult {
  success: boolean;
  confidence: number;
  errors?: string[];
  data: {
    vendor: VendorInfo | null;
    receipt: ReceiptData;
    items: LineItem[];
  };
  rawOcrText?: string;
  processingTimeMs?: number;
  modelUsed?: string;
}

// ============================================
// OLLAMA INTEGRATION
// ============================================

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const EXTRACTION_PROMPT = `You are a receipt data extraction assistant. Analyze this receipt image and extract all information into a structured JSON format.

Extract the following fields:
1. vendor: Store/business name, address, phone number
2. items: List of purchased items with name, quantity, unit price, and total price
3. receipt: Date, subtotal, tax, service charge, discount, total amount, payment method, cash paid, change

IMPORTANT:
- All prices should be numbers (remove currency symbols and commas)
- Quantity should be a number (default to 1 if not shown)
- Date should be in YYYY-MM-DD format if possible
- Payment method should be: "cash", "card", "mixed", or "other"

Respond ONLY with valid JSON in this exact format:
{
  "vendor": {
    "name": "Store Name",
    "address": "Store Address",
    "phone": "Phone Number"
  },
  "items": [
    {
      "name": "Item Name",
      "quantity": 1,
      "unitPrice": 10.00,
      "totalPrice": 10.00
    }
  ],
  "receipt": {
    "date": "2024-01-15",
    "subtotal": 100.00,
    "taxAmount": 10.00,
    "totalAmount": 110.00,
    "paymentMethod": "cash",
    "cashPaid": 120.00,
    "changeAmount": 10.00
  }
}

If a field is not visible or unclear, omit it from the response.`;

/**
 * Convert image file to base64
 */
function imageToBase64(imagePath: string): string {
  const absolutePath = path.resolve(imagePath);
  const imageBuffer = fs.readFileSync(absolutePath);
  return imageBuffer.toString('base64');
}

/**
 * Call Ollama API with vision model
 */
async function callOllamaVision(
  imageBase64: string,
  model: string = 'llava'
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: EXTRACTION_PROMPT,
      images: [imageBase64],
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for more consistent extraction
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Parse Ollama response into structured data
 */
function parseExtractionResponse(response: string): ExtractionResult['data'] {
  // Try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate and normalize the data
  const vendor: VendorInfo | null = parsed.vendor?.name
    ? {
        name: parsed.vendor.name,
        address: parsed.vendor.address,
        phone: parsed.vendor.phone,
        businessNumber: parsed.vendor.businessNumber,
      }
    : null;

  const items: LineItem[] = (parsed.items || []).map((item: any) => ({
    name: item.name || 'Unknown Item',
    quantity: Number(item.quantity) || 1,
    unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
    totalPrice: Number(item.totalPrice) || 0,
    subItems: item.subItems?.map((sub: any) => ({
      name: sub.name || 'Sub-item',
      quantity: Number(sub.quantity) || 1,
      unitPrice: sub.unitPrice ? Number(sub.unitPrice) : undefined,
      totalPrice: Number(sub.totalPrice) || 0,
    })),
  }));

  const receipt: ReceiptData = {
    date: parsed.receipt?.date,
    time: parsed.receipt?.time,
    subtotal: parsed.receipt?.subtotal ? Number(parsed.receipt.subtotal) : undefined,
    taxAmount: parsed.receipt?.taxAmount ? Number(parsed.receipt.taxAmount) : undefined,
    serviceCharge: parsed.receipt?.serviceCharge ? Number(parsed.receipt.serviceCharge) : undefined,
    discount: parsed.receipt?.discount ? Number(parsed.receipt.discount) : undefined,
    totalAmount: Number(parsed.receipt?.totalAmount) || 0,
    paymentMethod: parsed.receipt?.paymentMethod || 'other',
    cashPaid: parsed.receipt?.cashPaid ? Number(parsed.receipt.cashPaid) : undefined,
    cardPaid: parsed.receipt?.cardPaid ? Number(parsed.receipt.cardPaid) : undefined,
    changeAmount: parsed.receipt?.changeAmount ? Number(parsed.receipt.changeAmount) : undefined,
  };

  return { vendor, receipt, items };
}

/**
 * Main extraction function
 * Takes an image path and returns structured receipt data
 */
export async function extractReceipt(
  imagePath: string,
  options: {
    model?: string;
    includeRawText?: boolean;
  } = {}
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const model = options.model || 'llava';

  try {
    // Check if Ollama is available
    const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`).catch(() => null);
    if (!healthCheck?.ok) {
      throw new Error(`Ollama not available at ${OLLAMA_BASE_URL}. Make sure Ollama is running.`);
    }

    // Convert image to base64
    const imageBase64 = imageToBase64(imagePath);

    // Call Ollama vision API
    const rawResponse = await callOllamaVision(imageBase64, model);

    // Parse the response
    const data = parseExtractionResponse(rawResponse);

    const processingTimeMs = Date.now() - startTime;

    // Calculate confidence based on extracted fields
    let confidence = 0.5; // Base confidence
    if (data.vendor?.name) confidence += 0.1;
    if (data.items.length > 0) confidence += 0.2;
    if (data.receipt.totalAmount > 0) confidence += 0.2;

    return {
      success: true,
      confidence: Math.min(confidence, 1),
      data,
      rawOcrText: options.includeRawText ? rawResponse : undefined,
      processingTimeMs,
      modelUsed: model,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    return {
      success: false,
      confidence: 0,
      errors: [error instanceof Error ? error.message : String(error)],
      data: {
        vendor: null,
        receipt: {
          totalAmount: 0,
          paymentMethod: 'other',
        },
        items: [],
      },
      processingTimeMs,
      modelUsed: model,
    };
  }
}

/**
 * Extract from base64 image directly (for API uploads)
 */
export async function extractReceiptFromBase64(
  imageBase64: string,
  options: {
    model?: string;
    includeRawText?: boolean;
  } = {}
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const model = options.model || 'llava';

  try {
    // Check if Ollama is available
    const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`).catch(() => null);
    if (!healthCheck?.ok) {
      throw new Error(`Ollama not available at ${OLLAMA_BASE_URL}. Make sure Ollama is running.`);
    }

    // Call Ollama vision API
    const rawResponse = await callOllamaVision(imageBase64, model);

    // Parse the response
    const data = parseExtractionResponse(rawResponse);

    const processingTimeMs = Date.now() - startTime;

    // Calculate confidence
    let confidence = 0.5;
    if (data.vendor?.name) confidence += 0.1;
    if (data.items.length > 0) confidence += 0.2;
    if (data.receipt.totalAmount > 0) confidence += 0.2;

    return {
      success: true,
      confidence: Math.min(confidence, 1),
      data,
      rawOcrText: options.includeRawText ? rawResponse : undefined,
      processingTimeMs,
      modelUsed: model,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    return {
      success: false,
      confidence: 0,
      errors: [error instanceof Error ? error.message : String(error)],
      data: {
        vendor: null,
        receipt: {
          totalAmount: 0,
          paymentMethod: 'other',
        },
        items: [],
      },
      processingTimeMs,
      modelUsed: model,
    };
  }
}

/**
 * Mock extraction for testing without Ollama
 */
export function extractReceiptMock(imagePath: string): ExtractionResult {
  return {
    success: true,
    confidence: 0.92,
    data: {
      vendor: {
        name: 'Sample Coffee Shop',
        address: '123 Main Street',
        phone: '555-1234',
      },
      receipt: {
        date: new Date().toISOString().split('T')[0],
        subtotal: 45.5,
        taxAmount: 4.55,
        totalAmount: 50.05,
        paymentMethod: 'cash',
        cashPaid: 60,
        changeAmount: 9.95,
      },
      items: [
        { name: 'Latte', quantity: 2, unitPrice: 5.5, totalPrice: 11 },
        { name: 'Croissant', quantity: 1, unitPrice: 4.5, totalPrice: 4.5 },
        { name: 'Sandwich', quantity: 2, unitPrice: 15, totalPrice: 30 },
      ],
    },
    processingTimeMs: 150,
    modelUsed: 'mock',
  };
}
