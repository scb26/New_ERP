// QA Automated Barcode Verification Test Suite
// Tests 3-tier lookup, auto-caching, quick-add endpoint, and data integrity

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 UNIDEX ERP - BARCODE SUBSYSTEM QA TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // 1. Health check
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    assert(health.status === 'ok', 'Server Health Check', `WAL Journal: ${health.database.journal_mode}`);
  } catch (e) {
    assert(false, 'Server Health Check', e.message);
  }

  // 2. Active Inventory Barcode Lookup
  try {
    const res = await fetch(`${BASE_URL}/api/barcode/lookup/6901234567890`);
    const data = await res.json();
    assert(
      data.found === true && data.status === 'in_inventory' && data.product.name.includes('iPhone'),
      'Tier 1: Active Store Inventory Barcode Lookup',
      `Product: ${data.product?.name}`
    );
  } catch (e) {
    assert(false, 'Tier 1: Active Store Inventory Barcode Lookup', e.message);
  }

  // 3. Pre-Seeded Offline Master Catalog Lookup (Parle-G)
  try {
    const res = await fetch(`${BASE_URL}/api/barcode/lookup/8901719101037`);
    const data = await res.json();
    assert(
      data.found === true && data.status === 'in_master' && data.product.name.includes('Parle-G'),
      'Tier 2: Pre-Seeded Offline Master Catalog (Parle-G 250g)',
      `HSN: ${data.product?.hsnCode}, GST: ${data.product?.gstRate}%, MRP: ₹${data.product?.mrp}`
    );
  } catch (e) {
    assert(false, 'Tier 2: Pre-Seeded Offline Master Catalog', e.message);
  }

  // 4. Pre-Seeded Offline Master Catalog Lookup (Britannia Good Day)
  try {
    const res = await fetch(`${BASE_URL}/api/barcode/lookup/8901063012232`);
    const data = await res.json();
    assert(
      data.found === true && data.status === 'in_master' && data.product.name.includes('Good Day'),
      'Tier 2: Pre-Seeded Offline Master Catalog (Good Day Cookies 200g)',
      `HSN: ${data.product?.hsnCode}, GST: ${data.product?.gstRate}%, MRP: ₹${data.product?.mrp}`
    );
  } catch (e) {
    assert(false, 'Tier 2: Pre-Seeded Offline Master Catalog (Good Day)', e.message);
  }

  // 5. Open Food Facts API & SQLite Auto-Caching (Nutella)
  try {
    const res = await fetch(`${BASE_URL}/api/barcode/lookup/3017620422003`);
    const data = await res.json();
    assert(
      data.found === true && (data.source === 'open_food_facts' || data.status === 'in_master') && data.product.name.toLowerCase().includes('nutella'),
      'Tier 3: Open Food Facts API & Auto-Caching',
      `Product: ${data.product?.name}, Brand: ${data.product?.brand}`
    );
  } catch (e) {
    assert(false, 'Tier 3: Open Food Facts API & Auto-Caching', e.message);
  }

  // 6. Test Cashier Quick-Add Counter Endpoint
  const testBarcode = `8909999${Date.now().toString().slice(-6)}`;
  try {
    // Login as cashier to test RBAC permission
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cashier', password: 'cashier123' })
    });
    const { token } = await loginRes.json();

    const quickAddRes = await fetch(`${BASE_URL}/api/products/quick-add`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'QA Test Organic Biscuit 100g',
        barcode: testBarcode,
        brand: 'QA Brand',
        sellPrice: 45,
        mrp: 50,
        gstRate: 18,
        hsnCode: '1905',
        category: 'Biscuits & Snacks',
        stock: 25
      })
    });
    const created = await quickAddRes.json();
    assert(
      quickAddRes.status === 201 && created.name === 'QA Test Organic Biscuit 100g',
      'Counter Quick-Add Endpoint (/api/products/quick-add)',
      `Created ID: ${created.id}, Barcode: ${created.barcode}`
    );

    // 7. Verify subsequent lookup immediately finds it in inventory
    const verifyLookup = await fetch(`${BASE_URL}/api/barcode/lookup/${testBarcode}`);
    const verifyData = await verifyLookup.json();
    assert(
      verifyData.status === 'in_inventory' && verifyData.product.sellPrice === 45,
      'Persistence: Instant In-Inventory Detection after Quick-Add',
      `SellPrice: ₹${verifyData.product?.sellPrice}`
    );
  } catch (e) {
    assert(false, 'Counter Quick-Add & Persistence Test', e.message);
  }

  // 8. Negative test: Unknown Barcode returns not_found
  try {
    const unknownRes = await fetch(`${BASE_URL}/api/barcode/lookup/0000000000000`);
    const unknownData = await unknownRes.json();
    assert(
      unknownData.found === false && unknownData.status === 'not_found',
      'Negative Test: Non-existent Barcode Handling',
      `Status: ${unknownData.status}`
    );
  } catch (e) {
    assert(false, 'Negative Test: Non-existent Barcode Handling', e.message);
  }

  console.log('\n====================================================');
  console.log(`📊 QA RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
