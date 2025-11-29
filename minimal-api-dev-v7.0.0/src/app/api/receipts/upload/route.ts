/**
 * Receipt Upload & Extraction API
 * POST /api/receipts/upload - Upload image and extract receipt data
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractReceiptFromBase64, extractReceiptMock } from '@/lib/extraction';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let imageBase64: string;
    let originalFilename = 'receipt.jpg';
    let useMock = false;

    if (contentType.includes('multipart/form-data')) {
      // Handle form data upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      useMock = formData.get('mock') === 'true';
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      originalFilename = file.name;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imageBase64 = buffer.toString('base64');
    } else {
      // Handle JSON with base64 image
      const body = await request.json();
      imageBase64 = body.image;
      originalFilename = body.filename || 'receipt.jpg';
      useMock = body.mock === true;
      
      if (!imageBase64) {
        return NextResponse.json(
          { error: 'No image provided' },
          { status: 400 }
        );
      }

      // Remove data URL prefix if present
      if (imageBase64.startsWith('data:')) {
        imageBase64 = imageBase64.split(',')[1];
      }
    }

    // Save the image to uploads folder
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    await mkdir(uploadsDir, { recursive: true });
    
    const fileId = uuidv4();
    const ext = path.extname(originalFilename) || '.jpg';
    const savedFilename = `${fileId}${ext}`;
    const savedPath = path.join(uploadsDir, savedFilename);
    
    await writeFile(savedPath, Buffer.from(imageBase64, 'base64'));
    
    const imagePath = `/uploads/receipts/${savedFilename}`;

    // Extract receipt data
    let extractionResult;
    if (useMock) {
      // Use mock extraction for testing without Ollama
      extractionResult = extractReceiptMock(savedPath);
    } else {
      // Use real Ollama extraction
      extractionResult = await extractReceiptFromBase64(imageBase64, {
        includeRawText: true,
      });
    }

    return NextResponse.json({
      success: extractionResult.success,
      imagePath,
      extraction: extractionResult,
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', details: String(error) },
      { status: 500 }
    );
  }
}
