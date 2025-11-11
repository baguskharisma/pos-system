/**
 * Script untuk testing Midtrans Webhook Notification di localhost
 *
 * Usage:
 * node test-webhook.js <ORDER_NUMBER> [STATUS]
 *
 * Examples:
 * node test-webhook.js CUST-20251109-00001 settlement
 * node test-webhook.js CUST-20251109-00001 pending
 * node test-webhook.js CUST-20251109-00001 expire
 */

const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const orderNumber = args[0];
const transactionStatus = args[1] || 'settlement';

if (!orderNumber) {
  console.error('❌ Error: Order number is required');
  console.log('');
  console.log('Usage:');
  console.log('  node test-webhook.js <ORDER_NUMBER> [STATUS]');
  console.log('');
  console.log('Examples:');
  console.log('  node test-webhook.js CUST-20251109-00001 settlement');
  console.log('  node test-webhook.js CUST-20251109-00001 pending');
  console.log('  node test-webhook.js CUST-20251109-00001 expire');
  console.log('');
  console.log('Available statuses: settlement, pending, capture, deny, expire, cancel');
  process.exit(1);
}

// Status code mapping
const statusCodeMap = {
  'settlement': '200',
  'capture': '200',
  'pending': '201',
  'deny': '400',
  'cancel': '200',
  'expire': '407',
};

// Payment type examples
const paymentTypes = ['qris', 'gopay', 'shopeepay', 'bca_va', 'bni_va', 'bri_va'];
const randomPaymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];

// Prepare webhook payload
const payload = {
  transaction_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
  transaction_status: transactionStatus,
  transaction_id: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  status_message: 'midtrans payment notification',
  status_code: statusCodeMap[transactionStatus] || '200',
  signature_key: 'test-signature-key-' + Date.now(),
  payment_type: randomPaymentType,
  order_id: orderNumber,
  merchant_id: 'TEST-MERCHANT',
  gross_amount: '50000.00',
  fraud_status: 'accept',
  currency: 'IDR',
  settlement_time: transactionStatus === 'settlement' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined,
};

// Remove undefined fields
Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

const postData = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/payment/notification',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('');
console.log('🔄 Sending webhook notification to localhost:3000...');
console.log('');
console.log('📦 Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('');
    console.log('📥 Response Status:', res.statusCode);
    console.log('');

    try {
      const jsonResponse = JSON.parse(responseData);
      console.log('📄 Response Body:');
      console.log(JSON.stringify(jsonResponse, null, 2));

      if (jsonResponse.success) {
        console.log('');
        console.log('✅ Webhook processed successfully!');
        console.log('');
        console.log('Order Status:', jsonResponse.order?.status);
        console.log('Payment Status:', jsonResponse.order?.paymentStatus);
        console.log('Processing Time:', jsonResponse.processing_time_ms + 'ms');
      } else {
        console.log('');
        console.log('❌ Webhook processing failed');
        console.log('Error:', jsonResponse.error);
      }
    } catch (e) {
      console.log('📄 Response (non-JSON):');
      console.log(responseData);
    }

    console.log('');
  });
});

req.on('error', (e) => {
  console.error('');
  console.error('❌ Request failed:', e.message);
  console.error('');
  console.error('Make sure your Next.js app is running on http://localhost:3000');
  console.error('Run: npm run dev');
  console.error('');
});

req.write(postData);
req.end();
