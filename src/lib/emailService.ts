export interface OrderEmailDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  isGiftWrapped?: boolean;
  giftMessage?: string;
}

export async function sendOrderConfirmationEmail(details: OrderEmailDetails): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!details.customerEmail) {
    console.warn('[Email Automation] No customer email provided for order confirmation.');
    return { success: false, error: 'No email address provided' };
  }

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...details, type: 'confirmation' })
    });

    const resData = await res.json();
    if (res.ok && resData.success) {
      console.log('[Vercel Serverless Email Success]', resData);
      return { success: true, data: resData.data };
    } else {
      console.warn('[Vercel Serverless Email Error Response]', resData);
      return { success: false, error: resData.error || resData };
    }
  } catch (err: any) {
    console.error('[Vercel Serverless Email Fetch Exception]', err);
    return { success: false, error: err.message || err };
  }
}

export async function sendOrderProcessingEmail(details: OrderEmailDetails): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!details.customerEmail) {
    console.warn('[Email Automation] No customer email provided for order processing notification.');
    return { success: false, error: 'No email address provided' };
  }

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...details, type: 'processing' })
    });

    const resData = await res.json();
    if (res.ok && resData.success) {
      console.log('[Vercel Serverless Email Success]', resData);
      return { success: true, data: resData.data };
    } else {
      console.warn('[Vercel Serverless Email Error Response]', resData);
      return { success: false, error: resData.error || resData };
    }
  } catch (err: any) {
    console.error('[Vercel Serverless Email Fetch Exception]', err);
    return { success: false, error: err.message || err };
  }
}
