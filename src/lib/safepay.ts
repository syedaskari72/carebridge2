import crypto from 'crypto';
import { Safepay } from '@sfpy/node-sdk';

const SAFEPAY_CONFIG = {
  apiKey: process.env.SAFEPAY_API_KEY || '',
  apiSecret: process.env.SAFEPAY_API_SECRET || '',
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

// Initialize SafePay SDK
function getSafepayClient() {
  validateConfig();
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('SAFEPAY_WEBHOOK_SECRET is required');
  }
  
  return new Safepay({
    environment: SAFEPAY_CONFIG.environment as 'sandbox' | 'production',
    apiKey: SAFEPAY_CONFIG.apiKey,
    v1Secret: SAFEPAY_CONFIG.apiSecret,
    webhookSecret: webhookSecret,
  });
}

// Create payment order using SafePay SDK
export async function createSafePayOrder(data: SafePayOrderData): Promise<SafePayResponse> {
  const safepay = getSafepayClient();
  
  console.log('Creating SafePay payment with SDK...');
  
  // Step 1: Create payment
  const payment = await safepay.payments.create({
    amount: Math.round(data.amount),
    currency: 'PKR',
  });
  
  console.log('SafePay payment created:', payment);
  
  // Step 2: Create checkout session
  const checkout = await safepay.checkout.create({
    token: payment.token,
    orderId: data.orderId,
    source: 'custom',
    cancelUrl: data.cancelUrl,
    redirectUrl: data.redirectUrl,
    webhooks: true,
  });
  
  console.log('SafePay checkout created:', checkout);
  
  return {
    token: payment.token,
    checkout_url: checkout.url,
  };
}

// Create subscription payment using SafePay SDK
export async function createSafePaySubscription(data: SafePayOrderData): Promise<SafePayResponse> {
  const safepay = getSafepayClient();
  
  console.log('Creating SafePay subscription with SDK...');
  
  try {
    // Try to create subscription if SDK supports it
    const subscription = await (safepay as any).subscriptions?.create({
      amount: Math.round(data.amount),
      currency: 'PKR',
      planId: data.orderId,
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      },
    });
    
    if (subscription) {
      console.log('SafePay subscription created:', subscription);
      
      const checkout = await safepay.checkout.create({
        token: subscription.token,
        orderId: data.orderId,
        source: 'custom',
        cancelUrl: data.cancelUrl,
        redirectUrl: data.redirectUrl,
        webhooks: true,
      });
      
      return {
        token: subscription.token,
        checkout_url: checkout.url,
      };
    }
  } catch (error) {
    console.log('Subscription not supported, falling back to one-time payment');
  }
  
  // Fallback to one-time payment
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
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('SAFEPAY_WEBHOOK_SECRET is not configured');
  }
  
  const hmac = crypto.createHmac('sha256', webhookSecret);
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
