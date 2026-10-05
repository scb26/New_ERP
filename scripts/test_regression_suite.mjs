import http from 'http';

const BASE_URL = 'http://localhost:3000';
let adminToken = '';

const state = {
  productId: '',
  partyId: '',
  invoiceId: '',
};

function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch(e) {}
        resolve({
          status: res.statusCode,
          body: parsed
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  };

  console.log('====================================================');
  console.log('🧪 UNIDEX ERP - E2E REGRESSION TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Health check
    let res = await req('GET', '/api/health');
    assert(res.status === 200 && res.body.status === 'ok', 'Server Health Check');

    // 2. Authentication
    res = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
    assert(res.status === 200 && res.body.token, 'Admin Authentication');
    adminToken = res.body.token;

    // 3. Create Product
    const testBarcode = `REG-${Date.now()}`;
    res = await req('POST', '/api/products', {
      name: 'Regression Test Product',
      barcode: testBarcode,
      category: 'Test',
      hsn_code: '1234',
      gst_rate: 18,
      cost_price: 100,
      sell_price: 150,
      mrp: 200,
      current_stock: 50,
      min_stock: 5
    }, adminToken);
    
    if (res.status !== 201) { console.error("Product creation failed:", res.body); }
    assert(res.status === 201 && res.body.id, 'Create Product');
    state.productId = res.body.id;

    // 4. Create Party
    res = await req('POST', '/api/parties', {
      name: 'Regression Test Party',
      type: 'customer',
      contact_person: 'John Doe',
      phone: '9999999999',
      address: 'Test City',
      opening_balance: 0
    }, adminToken);
    if (res.status !== 201) { console.error("Party creation failed:", res.body); }
    assert(res.status === 201 && res.body.id, 'Create Party (Customer)');
    state.partyId = res.body.id;

    // 5. Create Invoice
    res = await req('POST', '/api/invoices', {
      party_id: state.partyId,
      items: [
        {
          product_id: state.productId,
          quantity: 2,
          unit_price: 150,
          discount_percent: 0,
          gst_rate: 18
        }
      ],
      payment_status: 'paid',
      payment_method: 'cash',
      amount_paid: 354 // (2 * 150 = 300) + 18% GST (54) = 354
    }, adminToken);
    
    if (res.status !== 201) { console.error("Invoice creation failed:", res.body); }
    assert(res.status === 201 && res.body.id, 'Create Invoice');
    state.invoiceId = res.body.id;

    // 6. Fetch Dashboard Stats
    res = await req('GET', '/api/dashboard/stats', null, adminToken);
    if (res.status !== 200) { console.error("Dashboard stats failed:", res.body); }
    assert(res.status === 200 && res.body.totalSales !== undefined, 'Fetch Dashboard Stats');

    // 7. Verify audit trail is working
    res = await req('GET', '/api/audit-trail?limit=5', null, adminToken);
    if (res.status !== 200) { console.error("Audit trail failed:", res.body); }
    assert(res.status === 200 && Array.isArray(res.body) && res.body.length > 0, 'Fetch Audit Trail');

  } catch (error) {
    console.error('Test script crashed:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 QA RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');
}

runTests();
