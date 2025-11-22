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
  
  // Create payment tracker with all required fields
  const payload = {
    client: SAFEPAY_CONFIG.apiKey,
    amount: Math.round(data.amount),
    currency: 'PKR',
    order_id: data.orderId,
    source: 'custom',
    environment: SAFEPAY_CONFIG.environment,
    cancel_url: data.cancelUrl,
    redirect_url: data.redirectUrl,
    webhook_url: data.webhookUrl,
  };

  console.log('SafePay payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${SAFEPAY_CONFIG.baseUrl}/order/v1/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log('SafePay response:', responseText);

  if (!response.ok) {
    throw new Error(`SafePay error: ${response.statusText} - ${responseText}`);
  }

  const result = JSON.parse(responseText);
  const tracker = result.data.token;
  
  // Build checkout URL with all required parameters
  const checkoutUrl = `${SAFEPAY_CONFIG.baseUrl}/checkout/pay?tracker=${tracker}&env=${SAFEPAY_CONFIG.environment}&source=custom`;
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
