/**
 * Seed script - Run this to populate the database
 * Usage: node seed-db.mjs
 */

const response = await fetch('http://localhost:7272/api/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const data = await response.json();
console.log('Seed result:', JSON.stringify(data, null, 2));
