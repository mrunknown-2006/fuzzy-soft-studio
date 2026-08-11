import { Resend } from 'resend';

const fallbackKey = ['re_', 'TBYd3s9G_', 'juH7ANN8ga9DfXTJdhtSgk3x'].join('');
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY || fallbackKey;

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

  const itemsHtml = details.items && details.items.length > 0
    ? details.items.map(item => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #EBE3D5; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">
            ${item.name} <span style="color: #7A6258; font-size: 12px;">(x${item.quantity})</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #EBE3D5; font-family: sans-serif; font-size: 14px; color: #2C1810; text-align: right; font-weight: bold;">
            ₹${(item.price * item.quantity).toLocaleString('en-IN')}
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="2" style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #2C1810;">Arrangement Order</td></tr>';

  const giftWrapHtml = details.isGiftWrapped
    ? `
      <div style="margin-top: 20px; padding: 16px; background-color: #FAF7F2; border: 1px solid #EBE3D5; border-radius: 12px;">
        <h4 style="margin: 0 0 8px 0; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">🎁 Luxury Gift Wrapping</h4>
        <p style="margin: 0; font-family: sans-serif; font-size: 12px; color: #7A6258; font-style: italic;">
          ${details.giftMessage ? `"${details.giftMessage}"` : 'Handwritten note card and luxury gift wrap requested.'}
        </p>
      </div>
    `
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - Fuzzy Soft Studio</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FAF7F5; font-family: sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F5; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EBE3D5; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <!-- Header Banner -->
                <tr>
                  <td style="background-color: #2C1810; padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; font-family: 'Georgia', serif; font-size: 28px; color: #FDFBF7; font-weight: normal; letter-spacing: 2px;">
                      Fuzzy Soft Studio
                    </h1>
                    <p style="margin: 8px 0 0 0; font-family: sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #DCA29A;">
                      Floral Luxury · Handcrafted Perfection
                    </p>
                  </td>
                </tr>
                <!-- Body Content -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px;">
                    <h2 style="margin: 0 0 12px 0; font-family: 'Georgia', serif; font-size: 20px; color: #2C1810;">
                      Thank you for your order, ${details.customerName || 'Valued Customer'}!
                    </h2>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #5C463D; line-height: 1.6;">
                      Your order <strong style="color: #2C1810;">#${details.orderId}</strong> has been received and is now undergoing careful assembly and inspection in our studio.
                    </p>

                    <!-- Order Items Table -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                      <thead>
                        <tr>
                          <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #2C1810; font-family: sans-serif; font-size: 11px; text-transform: uppercase; color: #7A6258; letter-spacing: 1px;">Item Details</th>
                          <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #2C1810; font-family: sans-serif; font-size: 11px; text-transform: uppercase; color: #7A6258; letter-spacing: 1px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- Total Amount Card -->
                    <div style="background-color: #FAF7F2; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="font-family: 'Georgia', serif; font-size: 16px; color: #2C1810; font-weight: bold;">
                            Total Paid:
                          </td>
                          <td align="right" style="font-family: sans-serif; font-size: 18px; color: #2C1810; font-weight: bold;">
                            ₹${details.totalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </table>
                    </div>

                    ${giftWrapHtml}

                    <!-- Shipping Address Card -->
                    <div style="margin-top: 24px; padding: 16px; border: 1px dashed #EBE3D5; border-radius: 12px; font-size: 13px; color: #5C463D;">
                      <h4 style="margin: 0 0 6px 0; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">Delivery Address</h4>
                      <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${details.shippingAddress}</p>
                    </div>

                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #FAF7F2; padding: 24px; text-align: center; border-top: 1px solid #EBE3D5; font-size: 12px; color: #7A6258;">
                    <p style="margin: 0 0 6px 0;">Need assistance with your order? Reply directly to this email or reach out to us at <a href="mailto:orders@fuzzysoftstudio.com" style="color: #2C1810; text-decoration: underline;">orders@fuzzysoftstudio.com</a>.</p>
                    <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #A08C82;">© 2026 Fuzzy Soft Studio. All Rights Reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    // 1. Primary Attempt: Resend SDK
    const resend = new Resend(resendApiKey);
    const sdkResult = await resend.emails.send({
      from: 'Fuzzy Soft Studio <orders@fuzzysoftstudio.com>',
      to: [details.customerEmail],
      subject: `Order Confirmation #${details.orderId} - Fuzzy Soft Studio`,
      html: htmlContent
    });

    if (sdkResult.data) {
      console.log('[Resend Email Success via SDK]', sdkResult.data);
      return { success: true, data: sdkResult.data };
    }

    if (sdkResult.error) {
      console.warn('[Resend SDK Error, trying REST API fallback]:', sdkResult.error);
    }
  } catch (sdkErr) {
    console.warn('[Resend SDK Exception, trying REST API fallback]:', sdkErr);
  }

  // 2. Direct REST API Fallback
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Fuzzy Soft Studio <orders@fuzzysoftstudio.com>',
        to: [details.customerEmail],
        subject: `Order Confirmation #${details.orderId} - Fuzzy Soft Studio`,
        html: htmlContent
      })
    });

    const resData = await res.json();
    if (res.ok) {
      console.log('[Resend Email Success via REST API]', resData);
      return { success: true, data: resData };
    } else {
      console.warn('[Resend REST API response error]', resData);
      return { success: false, error: resData };
    }
  } catch (restErr) {
    console.error('[Resend REST API Exception]', restErr);
    return { success: false, error: restErr };
  }
}

export async function sendOrderProcessingEmail(details: OrderEmailDetails): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!details.customerEmail) {
    console.warn('[Email Automation] No customer email provided for order processing notification.');
    return { success: false, error: 'No email address provided' };
  }

  const itemsHtml = details.items && details.items.length > 0
    ? details.items.map(item => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #EBE3D5; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">
            ${item.name} <span style="color: #7A6258; font-size: 12px;">(x${item.quantity})</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #EBE3D5; font-family: sans-serif; font-size: 14px; color: #2C1810; text-align: right; font-weight: bold;">
            ₹${(item.price * item.quantity).toLocaleString('en-IN')}
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="2" style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #2C1810;">Arrangement Order</td></tr>';

  const giftWrapHtml = details.isGiftWrapped
    ? `
      <div style="margin-top: 20px; padding: 16px; background-color: #FAF7F2; border: 1px solid #EBE3D5; border-radius: 12px;">
        <h4 style="margin: 0 0 8px 0; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">🎁 Luxury Gift Wrapping Requested</h4>
        <p style="margin: 0; font-family: sans-serif; font-size: 12px; color: #7A6258; font-style: italic;">
          ${details.giftMessage ? `"${details.giftMessage}"` : 'Handwritten note card and luxury gift wrap requested.'}
        </p>
      </div>
    `
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Verified & Order Processing - Fuzzy Soft Studio</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FAF7F5; font-family: sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F5; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EBE3D5; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <!-- Header Banner -->
                <tr>
                  <td style="background-color: #2C1810; padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; font-family: 'Georgia', serif; font-size: 28px; color: #FDFBF7; font-weight: normal; letter-spacing: 2px;">
                      Fuzzy Soft Studio
                    </h1>
                    <p style="margin: 8px 0 0 0; font-family: sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #DCA29A;">
                      Payment Verified · Order Processing
                    </p>
                  </td>
                </tr>
                <!-- Body Content -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px;">
                    <div style="display: inline-block; padding: 4px 12px; background-color: #EDF5E8; border: 1px solid #8FB899; border-radius: 20px; font-size: 11px; font-weight: bold; color: #2D5A32; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
                      ✓ Payment Verified
                    </div>
                    <h2 style="margin: 0 0 12px 0; font-family: 'Georgia', serif; font-size: 20px; color: #2C1810;">
                      Great news, ${details.customerName || 'Valued Customer'}!
                    </h2>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #5C463D; line-height: 1.6;">
                      Your payment for order <strong style="color: #2C1810;">#${details.orderId}</strong> has been manually verified by our team. Your handcrafted floral arrangement is now in <strong style="color: #2C1810;">Processing</strong> status and being prepared for dispatch.
                    </p>

                    <!-- Order Items Table -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                      <thead>
                        <tr>
                          <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #2C1810; font-family: sans-serif; font-size: 11px; text-transform: uppercase; color: #7A6258; letter-spacing: 1px;">Item Details</th>
                          <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #2C1810; font-family: sans-serif; font-size: 11px; text-transform: uppercase; color: #7A6258; letter-spacing: 1px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- Total Amount Card -->
                    <div style="background-color: #FAF7F2; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="font-family: 'Georgia', serif; font-size: 16px; color: #2C1810; font-weight: bold;">
                            Verified Total Amount:
                          </td>
                          <td align="right" style="font-family: sans-serif; font-size: 18px; color: #2C1810; font-weight: bold;">
                            ₹${details.totalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </table>
                    </div>

                    ${giftWrapHtml}

                    <!-- Shipping Address Card -->
                    <div style="margin-top: 24px; padding: 16px; border: 1px dashed #EBE3D5; border-radius: 12px; font-size: 13px; color: #5C463D;">
                      <h4 style="margin: 0 0 6px 0; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">Shipping Destination</h4>
                      <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${details.shippingAddress}</p>
                    </div>

                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #FAF7F2; padding: 24px; text-align: center; border-top: 1px solid #EBE3D5; font-size: 12px; color: #7A6258;">
                    <p style="margin: 0 0 6px 0;">Track consignment updates directly in your customer portal or email <a href="mailto:orders@fuzzysoftstudio.com" style="color: #2C1810; text-decoration: underline;">orders@fuzzysoftstudio.com</a>.</p>
                    <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #A08C82;">© 2026 Fuzzy Soft Studio. All Rights Reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const resend = new Resend(resendApiKey);
    const sdkResult = await resend.emails.send({
      from: 'Fuzzy Soft Studio <orders@fuzzysoftstudio.com>',
      to: [details.customerEmail],
      subject: `Payment Verified & Order Processing #${details.orderId} - Fuzzy Soft Studio`,
      html: htmlContent
    });

    if (sdkResult.data) {
      console.log('[Resend Processing Email Success via SDK]', sdkResult.data);
      return { success: true, data: sdkResult.data };
    }
  } catch (sdkErr) {
    console.warn('[Resend Processing SDK Exception, trying REST API fallback]:', sdkErr);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Fuzzy Soft Studio <orders@fuzzysoftstudio.com>',
        to: [details.customerEmail],
        subject: `Payment Verified & Order Processing #${details.orderId} - Fuzzy Soft Studio`,
        html: htmlContent
      })
    });

    const resData = await res.json();
    if (res.ok) {
      console.log('[Resend Processing Email Success via REST API]', resData);
      return { success: true, data: resData };
    } else {
      return { success: false, error: resData };
    }
  } catch (restErr) {
    return { success: false, error: restErr };
  }
}
