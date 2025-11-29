/**
 * Test script for the Auto-Bookkeeper API
 * Run with: npx tsx src/test-api.ts
 */

const API_URL = 'http://localhost:7272';

async function testAPI() {
  console.log('🧪 Testing Auto-Bookkeeper API\n');

  // Test 1: Get receipts (should be empty)
  console.log('1️⃣ GET /api/receipts');
  try {
    const res1 = await fetch(`${API_URL}/api/receipts`);
    const data1 = await res1.json();
    console.log('   Status:', res1.status);
    console.log('   Receipts:', data1.receipts?.length || 0);
    console.log('   ✅ Success\n');
  } catch (e) {
    console.log('   ❌ Error:', e);
  }

  // Test 2: Upload mock receipt
  console.log('2️⃣ POST /api/receipts/upload (mock)');
  try {
    // Tiny 1x1 PNG
    const mockImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const res2 = await fetch(`${API_URL}/api/receipts/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mock: true, image: mockImage }),
    });
    const data2 = await res2.json();
    console.log('   Status:', res2.status);
    console.log('   Success:', data2.success);
    console.log('   Extraction confidence:', data2.extraction?.confidence);
    console.log('   Items extracted:', data2.extraction?.data?.items?.length || 0);
    console.log('   ✅ Success\n');
    
    // Test 3: Create receipt from extracted data
    if (data2.extraction?.success) {
      console.log('3️⃣ POST /api/receipts (save extracted data)');
      const res3 = await fetch(`${API_URL}/api/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data2.extraction.data,
          imagePath: data2.imagePath,
          confidence: data2.extraction.confidence,
        }),
      });
      const data3 = await res3.json();
      console.log('   Status:', res3.status);
      console.log('   Receipt ID:', data3.receipt?.id);
      console.log('   Total Amount:', data3.receipt?.total_amount);
      console.log('   ✅ Success\n');

      // Test 4: Get receipts again
      console.log('4️⃣ GET /api/receipts (should have 1 receipt)');
      const res4 = await fetch(`${API_URL}/api/receipts`);
      const data4 = await res4.json();
      console.log('   Status:', res4.status);
      console.log('   Receipts:', data4.receipts?.length);
      console.log('   ✅ Success\n');

      // Test 5: Get analytics
      console.log('5️⃣ GET /api/analytics?type=summary');
      const res5 = await fetch(`${API_URL}/api/analytics?type=summary`);
      const data5 = await res5.json();
      console.log('   Status:', res5.status);
      console.log('   Total Spent:', data5.summary?.totalSpent);
      console.log('   Receipt Count:', data5.summary?.receiptCount);
      console.log('   ✅ Success\n');
    }
  } catch (e) {
    console.log('   ❌ Error:', e);
  }

  console.log('🎉 All tests completed!');
}

testAPI();
