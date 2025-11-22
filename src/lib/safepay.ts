import crypto from 'crypto';

const SAFEPAY_CONFIG = {
  apiKey: process.env.SAFEPAY_API_KEY || '',
  apiSecret: process.env.SAFEPAY_API_SECRET || '',
  baseUrl: process.env.SAFEPAY_ENVIRONMENT === 'production' 
    ? 'https://api.getsafepay.com' 
    : 'https://sandbox.api.getsafepay.com',
  environment: process.env.SAFEPAY_ENVIRONMENT || 'sandbox',
};

function validateConfig() {
  if (!SAFEPAY_CONFIG.apiKey || !SAFEPAY_CONFIG.apiSecret) {
    throw new Error('SafePay configuration is missing. Please set SAFEPAY_API_KEY and SAFEPAY_API_SECRET in environment variables.');
  }
}

interface SafePayOrderData {
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
  webhookUrl: string;
  cancelUrl: string;
  redirectUrl: string;
}

interface SafePayResponse {
  token: string;
  checkout_url: string;
}





// Create payment order with SafePay Order API v1
export async function createSafePayOrder(data: SafePayOrderData): Promise<SafePayResponse> {
  validateConfig();
  
  const authToken = Buffer.from(`${SAFEPAY_CONFIG.apiKey}:${SAFEPAY_CONFIG.apiSecret}`).toString('base64');
  
  // Step 1: Create tracker
  const trackerPayload = {
    client: SAFEPAY_CONFIG.apiKey,
    amount: Math.round(data.amount),
    currency: 'PKR',
    order_id: data.orderId,
    source: 'custom',
    environment: SAFEPAY_CONFIG.environment,
  };

  console.log('SafePay tracker payload:', JSON.stringify(trackerPayload, null, 2));

  const trackerResponse = await fetch(`${SAFEPAY_CONFIG.baseUrl}/order/v1/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authToken}`,
    },
    body: JSON.stringify(trackerPayload),
  });

  const trackerText = await trackerResponse.text();
  console.log('SafePay tracker response:', trackerText);

  if (!trackerResponse.ok) {
    throw new Error(`SafePay tracker error: ${trackerResponse.statusText} - ${trackerText}`);
  }

  const trackerResult = JSON.parse(trackerText);
  const tracker = trackerResult.data.token;
  
  // Step 2: Create payment intent
  const paymentPayload = {
    token: tracker,
    amount: Math.round(data.amount),
    currency: 'PKR',
    customer: {
      name: data.customerName,
      email: data.customerEmail,
      phone: data.customerPhone.replace(/[\s\-\+]/g, '').replace(/^92/, '0'),
    },
    redirect_url: data.redirectUrl,
    cancel_url: data.cancelUrl,
    webhook_url: data.webhookUrl,
  };

  console.log('SafePay payment payload:', JSON.stringify(paymentPayload, null, 2));

  const paymentResponse = await fetch(`${SAFEPAY_CONFIG.baseUrl}/payments/v1/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authToken}`,
    },
    body: JSON.stringify(paymentPayload),
  });

  const paymentText = await paymentResponse.text();
  console.log('SafePay payment response:', paymentText);

  if (!paymentResponse.ok) {
    throw new Error(`SafePay payment error: ${paymentResponse.statusText} - ${paymentText}`);
  }
  
  // Build checkout URL
  const checkoutUrl = `${SAFEPAY_CONFIG.baseUrl}/checkout/pay?tracker=${tracker}&env=${SAFEPAY_CONFIG.environment}`;
  console.log('Checkout URL:', checkoutUrl);
  
  return {
    token: tracker,
    checkout_url: checkoutUrl,
  };
}

// Create subscription payment
export async function createSafePaySubscription(data: SafePayOrderData): Promise<SafePayResponse> {
  return createSafePayOrder(data);
}

// Cancel subscription (just mark as cancelled in our DB)
export async function cancelSafePaySubscription(subscriptionId: string): Promise<{ success: boolean }> {
  // SafePay doesn't have subscription cancellation API
  // We handle this in our database
  return { success: true };
}

// Verify SafePay webhook signature
export function verifySafePayWebhook(payload: string, signature: string): boolean {
  validateConfig();
  const hmac = crypto.createHmac('sha256', SAFEPAY_CONFIG.apiSecret);
  hmac.update(payload);
  const generatedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(signature)
  );
}

// Check payment status
export async function checkSafePayStatus(token: string): Promise<any> {
  validateConfig();
  
  const authToken = Buffer.from(`${SAFEPAY_CONFIG.apiKey}:${SAFEPAY_CONFIG.apiSecret}`).toString('base64');
  
  const response = await fetch(`${SAFEPAY_CONFIG.baseUrl}/order/v1/status/${token}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`SafePay API error: ${response.statusText}`);
  }

  return response.json();
}
