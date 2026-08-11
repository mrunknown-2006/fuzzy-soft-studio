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

export interface AdminAlertDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number;
  utrNumber: string;
  shippingAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
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

export async function sendAdminNewOrderAlert(details: AdminAlertDetails): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...details, type: 'admin_alert' })
    });

    const resData = await res.json();
    if (res.ok && resData.success) {
      console.log('[Admin Order Alert Dispatched via Resend Backend]', resData);
      return { success: true, data: resData.data };
    } else {
      console.warn('[Admin Order Alert Resend Response Error]', resData);
      return { success: false, error: resData.error || resData };
    }
  } catch (err: any) {
    console.error('[Admin Order Alert Fetch Exception]', err);
    return { success: false, error: err.message || err };
  }
}
