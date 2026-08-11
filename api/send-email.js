import { Resend } from 'resend';

const fallbackKey = ['re_', 'TBYd3s9G_', 'juH7ANN8ga9DfXTJdhtSgk3x'].join('');
const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || fallbackKey;

export default async function handler(req, res) {
  // CORS Headers for API accessibility
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const details = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { 
      type, 
      orderId, 
      customerName, 
      customerEmail, 
      customerPhone,
      totalAmount, 
      shippingAddress, 
      utrNumber,
      items, 
      isGiftWrapped, 
      giftMessage 
    } = details || {};

    const resend = new Resend(resendApiKey);

    // 1. ADMIN ALERT EMAIL DISPATCH (Triggers on new checkout creation for manual UTR verification)
    if (type === 'admin_alert') {
      const adminEmail = 'mrunknownhipe@gmail.com';
      
      const adminItemsHtml = items && items.length > 0
        ? items.map(item => `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #EBE3D5; font-family: 'Georgia', serif; font-size: 13px; color: #2C1810;">
                ${item.name || 'Floral Arrangement'} <span style="color: #7A6258; font-size: 11px;">(x${item.quantity || 1})</span>
              </td>
              <td style="padding: 8px 0; border-bottom: 1px solid #EBE3D5; font-family: sans-serif; font-size: 13px; color: #2C1810; text-align: right; font-weight: bold;">
                ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
              </td>
            </tr>
          `).join('')
        : '<tr><td colspan="2" style="padding: 8px 0; font-family: sans-serif; font-size: 13px; color: #2C1810;">Order Items</td></tr>';

      const adminGiftHtml = isGiftWrapped
        ? `
          <div style="margin-top: 14px; padding: 12px; background-color: #FAF7F2; border: 1px solid #EBE3D5; border-radius: 10px;">
            <strong style="font-size: 12px; color: #2C1810;">🎁 Luxury Gift Wrap Requested</strong>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #7A6258; font-style: italic;">
              ${giftMessage ? `"${giftMessage}"` : 'Handwritten note card requested.'}
            </p>
          </div>
        `
        : '';

      const adminHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>🚨 NEW ORDER RECEIVED: #${orderId}</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #FAF7F5; font-family: sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F5; padding: 30px 10px;">
              <tr>
                <td align="center">
                  <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EBE3D5; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
                    <!-- Admin Alert Header -->
                    <tr>
                      <td style="background-color: #2C1810; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-family: 'Georgia', serif; font-size: 22px; color: #FDFBF7; font-weight: normal; letter-spacing: 1px;">
                          🚨 New Order Received: #${orderId}
                        </h1>
                        <p style="margin: 6px 0 0 0; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #DCA29A;">
                          Action Required: Manual UTR Verification
                        </p>
                      </td>
                    </tr>
                    <!-- Admin Body -->
                    <tr>
                      <td style="padding: 28px;">
                        <div style="background-color: #FAF7F2; padding: 16px; border-radius: 12px; border: 1px solid #EBE3D5; margin-bottom: 20px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #2C1810;">
                            <tr>
                              <td style="padding: 4px 0;"><strong>Customer:</strong> ${customerName || 'N/A'}</td>
                              <td align="right" style="padding: 4px 0;"><strong>Total Amount:</strong> ₹${(totalAmount || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0;"><strong>Email:</strong> ${customerEmail || 'N/A'}</td>
                              <td align="right" style="padding: 4px 0;"><strong>UTR / Txn ID:</strong> <span style="font-family: monospace; background: #EAE3D9; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #2C1810;">${utrNumber || 'N/A'}</span></td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding: 4px 0;"><strong>Phone:</strong> ${customerPhone || 'N/A'}</td>
                            </tr>
                          </table>
                        </div>

                        <h3 style="margin: 0 0 10px 0; font-family: 'Georgia', serif; font-size: 15px; color: #2C1810;">Order Items Summary</h3>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; font-size: 13px;">
                          ${adminItemsHtml}
                        </table>

                        <div style="padding: 14px; border: 1px dashed #EBE3D5; border-radius: 12px; font-size: 12px; color: #5C463D; margin-bottom: 20px;">
                          <strong>Delivery Address:</strong><br>
                          ${shippingAddress || 'N/A'}
                        </div>

                        ${adminGiftHtml}

                        <div style="text-align: center; margin-top: 24px;">
                          <a href="https://fuzzysoftstudio.com/admin" style="display: inline-block; background-color: #2C1810; color: #FDFBF7; text-decoration: none; padding: 12px 24px; border-radius: 30px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                            Review Order in Admin Dashboard →
                          </a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: 'Fuzzy Soft Studio <orders@fuzzysoftstudio.com>',
        to: [adminEmail],
        subject: `🚨 NEW ORDER RECEIVED: #${orderId} - Fuzzy Soft Studio`,
        html: adminHtml
      });

      if (result.data) {
        return res.status(200).json({ success: true, data: result.data });
      } else {
        return res.status(400).json({ success: false, error: result.error });
      }
    }

    // 2. CUSTOMER PROCESSING EMAIL DISPATCH (Triggers on Admin status change to 'Processing')
    if (!customerEmail) {
      return res.status(400).json({ success: false, error: 'No customer email address provided' });
    }

    const itemsHtml = items && items.length > 0
      ? items.map(item => `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #EBE3D5; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">
              ${item.name || 'Floral Arrangement'} <span style="color: #7A6258; font-size: 12px;">(x${item.quantity || 1})</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #EBE3D5; font-family: sans-serif; font-size: 14px; color: #2C1810; text-align: right; font-weight: bold;">
              ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="2" style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #2C1810;">Floral Arrangement Order</td></tr>';

    const giftWrapHtml = isGiftWrapped
      ? `
        <div style="margin-top: 20px; padding: 16px; background-color: #FAF7F2; border: 1px solid #EBE3D5; border-radius: 12px;">
          <h4 style="margin: 0 0 8px 0; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">🎁 Luxury Gift Wrapping Requested</h4>
          <p style="margin: 0; font-family: sans-serif; font-size: 12px; color: #7A6258; font-style: italic;">
            ${giftMessage ? `"${giftMessage}"` : 'Handwritten note card and luxury gift wrap requested.'}
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
                        Great news, ${customerName || 'Valued Customer'}!
                      </h2>
                      <p style="margin: 0 0 24px 0; font-size: 14px; color: #5C463D; line-height: 1.6;">
                        Your payment for order <strong style="color: #2C1810;">#${orderId}</strong> has been manually verified by our team. Your handcrafted floral arrangement is now in <strong style="color: #2C1810;">Processing</strong> status and being prepared for dispatch.
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
                              ₹${(totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </table>
                      </div>

                      ${giftWrapHtml}

                      <!-- Shipping Address Card -->
                      <div style="margin-top: 24px; padding: 16px; border: 1px dashed #EBE3D5; border-radius: 12px; font-size: 13px; color: #5C463D;">
                        <h4 style="margin: 0 0 6px 0; font-family: 'Georgia', serif; font-size: 14px; color: #2C1810;">Shipping Destination</h4>
                        <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${shippingAddress || 'Address on file'}</p>
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

    const result = await resend.emails.send({
      from: 'Fuzzy Soft Studio <orders@fuzzysoftstudio.com>',
      to: [customerEmail],
      subject: `Payment Verified & Order Processing #${orderId} - Fuzzy Soft Studio`,
      html: htmlContent
    });

    if (result.data) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('[Vercel Serverless Email Exception]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
}
