import nodemailer from 'nodemailer';

export interface OrderItemEmailData {
  name: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedFabric?: string;
  selectedColor?: string;
  selectedStorage?: string;
  selectedMattress?: string;
  image?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress?: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentMethod: string;
  status: string;
  total: number;
  shipping: number;
  items: OrderItemEmailData[];
}

export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const customerEmail = order.shippingEmail;
  if (!customerEmail) {
    console.warn('[Email Warning]: No customer email provided for order:', order.orderNumber);
    return;
  }

  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'comfortstudiouk@gmail.com';
  const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';

  const itemsHtml = order.items.map(item => {
    const variations = [];
    if (item.selectedSize) variations.push(`<li><strong>Size:</strong> ${item.selectedSize}</li>`);
    if (item.selectedFabric) variations.push(`<li><strong>Fabric:</strong> ${item.selectedFabric}</li>`);
    if (item.selectedColor) variations.push(`<li><strong>Colour:</strong> ${item.selectedColor}</li>`);
    if (item.selectedStorage) variations.push(`<li><strong>Storage:</strong> ${item.selectedStorage}</li>`);
    if (item.selectedMattress) variations.push(`<li><strong>Mattress:</strong> ${item.selectedMattress}</li>`);

    const variationsHtml = variations.length > 0
      ? `<ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 12px; color: #555555; list-style-type: disc;">${variations.join('')}</ul>`
      : '<span style="font-size: 12px; color: #888888; font-style: italic;">Standard Option</span>';

    return `
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 12px; vertical-align: top;">
          <div style="font-weight: bold; color: #333333; font-size: 14px;">${item.name}</div>
          ${variationsHtml}
        </td>
        <td style="padding: 12px; vertical-align: top; text-align: center; font-size: 14px; color: #333333;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; vertical-align: top; text-align: right; font-size: 14px; color: #333333;">
          £${Number(item.price).toFixed(2)}
        </td>
        <td style="padding: 12px; vertical-align: top; text-align: right; font-weight: bold; font-size: 14px; color: #5d4037;">
          £${(Number(item.price) * Number(item.quantity)).toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const subtotal = order.items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
  const shippingFee = Number(order.shipping) || 0;
  const grandTotal = Number(order.total) || (subtotal + shippingFee);
  const trackUrl = `https://comfortstudio.co.uk/orders?orderNumber=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(customerEmail)}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Order Confirmation - Comfort Studio</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f4f0; color: #333333; margin: 0; padding: 20px 0;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e8dfd8;">
      
      <!-- Header -->
      <div style="background-color: #5d4037; padding: 35px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase;">Comfort Studio</h1>
        <p style="margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1px; color: #c8956c;">LUXURY FURNITURE & DECOR</p>
      </div>

      <!-- Main Body -->
      <div style="padding: 30px 25px;">
        <div style="background-color: #fdfaf7; border-left: 4px solid #c8956c; padding: 15px 20px; margin-bottom: 25px; border-radius: 4px;">
          <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #5d4037;">Order Confirmed!</h2>
          <p style="margin: 0; font-size: 14px; color: #666666;">Thank you for shopping with Comfort Studio. Here are the complete details of your purchase.</p>
        </div>

        <!-- Customer & Contact Details Card -->
        <div style="background-color: #faf7f4; border: 1px solid #ebdcd0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 14px 0; font-size: 15px; color: #5d4037; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5d3c5; padding-bottom: 8px;">
            Customer & Delivery Information
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #777777; width: 140px;">Customer Name:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #333333;">${order.shippingName || 'Customer'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777777;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #333333;">${order.shippingEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777777;">Contact Phone:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #333333;">${order.shippingPhone || 'Not provided'}</td>
            </tr>
            ${order.shippingAddress ? `
            <tr>
              <td style="padding: 6px 0; color: #777777;">Address:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #333333;">${order.shippingAddress}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 6px 0; color: #777777;">City:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #333333;">${order.shippingCity || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777777;">Postal Code:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #333333;">${order.shippingPostalCode || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777777;">Payment Method:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #c8956c;">${order.paymentMethod || 'Standard'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777777;">Order Number:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #5d4037;">${order.orderNumber}</td>
            </tr>
          </table>
        </div>

        <!-- Ordered Products Table -->
        <h3 style="margin: 0 0 14px 0; font-size: 15px; color: #5d4037; text-transform: uppercase; letter-spacing: 1px;">
          Order Items & Options
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #ebdcd0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #5d4037; color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px 12px; text-align: left;">Product & Details</th>
              <th style="padding: 10px 12px; text-align: center;">Qty</th>
              <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
              <th style="padding: 10px 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Pricing Summary Card -->
        <div style="background-color: #faf7f4; border: 1px solid #ebdcd0; border-radius: 8px; padding: 18px 20px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #777777;">Items Subtotal:</td>
              <td style="padding: 4px 0; text-align: right; color: #333333;">£${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;">Shipping:</td>
              <td style="padding: 4px 0; text-align: right; color: #333333;">${shippingFee === 0 ? 'Free Shipping' : `£${shippingFee.toFixed(2)}`}</td>
            </tr>
            <tr style="border-top: 1px solid #e5d3c5;">
              <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #5d4037;">Grand Total:</td>
              <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold; text-align: right; color: #c8956c;">£${grandTotal.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Track Order CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackUrl}" style="display: inline-block; background-color: #c8956c; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: bold; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(200, 149, 108, 0.3);">Track Your Order</a>
        </div>

        <p style="font-size: 13px; color: #777777; line-height: 1.5; text-align: center; margin-top: 15px;">
          You can track your order status anytime at <a href="https://comfortstudio.co.uk/orders" style="color: #c8956c; font-weight: bold; text-decoration: underline;">comfortstudio.co.uk/orders</a> by entering your Order ID (<strong>${order.orderNumber}</strong>).
        </p>

        <p style="font-size: 13px; color: #777777; line-height: 1.5; text-align: center; margin-top: 15px;">
          Need assistance with your order? Reply to this email or contact us at <a href="mailto:comfortstudiouk@gmail.com" style="color: #c8956c; text-decoration: underline;">comfortstudiouk@gmail.com</a>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #faf7f4; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #ebdcd0;">
        &copy; ${new Date().getFullYear()} Comfort Studio. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;

  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Comfort Studio" <${smtpUser}>`,
        to: customerEmail,
        subject: `Comfort Studio Order Confirmation: ${order.orderNumber}`,
        html: htmlContent,
      });

      console.log(`[Email Sent]: Order confirmation sent to ${customerEmail} for order ${order.orderNumber}`);
    } catch (err: any) {
      console.error('[Email SMTP Error]:', err.message || err);
    }
  } else {
    console.log(`[Email Dispatch]: GMAIL_APP_PASSWORD not configured in env. Order confirmation details prepared for ${customerEmail} (${order.orderNumber}).`);
  }
}

export interface ContactFormEmailData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function sendContactFormEmail(contactData: ContactFormEmailData) {
  const adminRecipient = 'comfortstudiouk@gmail.com';
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'comfortstudiouk@gmail.com';
  const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>New Contact Message - Comfort Studio</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f4f0; color: #333333; margin: 0; padding: 20px 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e8dfd8;">
      <div style="background-color: #5d4037; padding: 30px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">Comfort Studio</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #c8956c; letter-spacing: 1px;">NEW CONTACT FORM SUBMISSION</p>
      </div>

      <div style="padding: 30px 25px;">
        <div style="background-color: #faf7f4; border-left: 4px solid #c8956c; padding: 15px 20px; margin-bottom: 20px; border-radius: 4px;">
          <h2 style="margin: 0 0 6px 0; font-size: 16px; color: #5d4037;">You have received a new contact message!</h2>
          <p style="margin: 0; font-size: 13px; color: #666666;">A customer has submitted a message on comfortstudio.co.uk.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 25px;">
          <tr>
            <td style="padding: 8px 0; color: #777777; width: 130px;">Sender Name:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #333333;">${contactData.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777777;">Sender Email:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #333333;"><a href="mailto:${contactData.email}" style="color: #c8956c;">${contactData.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777777;">Subject:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #333333;">${contactData.subject || 'General Inquiry'}</td>
          </tr>
        </table>

        <div style="background-color: #faf7f4; border: 1px solid #ebdcd0; border-radius: 8px; padding: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #5d4037; text-transform: uppercase; letter-spacing: 1px;">Message Content:</h4>
          <p style="margin: 0; font-size: 14px; color: #333333; line-height: 1.6; white-space: pre-wrap;">${contactData.message}</p>
        </div>

        <div style="margin-top: 25px; text-align: center;">
          <a href="mailto:${contactData.email}?subject=Re: ${encodeURIComponent(contactData.subject || 'Inquiry from Comfort Studio')}" style="display: inline-block; background-color: #5d4037; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: bold; letter-spacing: 1px;">Reply to Customer</a>
        </div>
      </div>

      <div style="background-color: #faf7f4; padding: 18px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #ebdcd0;">
        &copy; ${new Date().getFullYear()} Comfort Studio Contact System
      </div>
    </div>
  </body>
  </html>
  `;

  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Comfort Studio Website" <${smtpUser}>`,
        to: adminRecipient,
        replyTo: contactData.email,
        subject: `[Contact Form] ${contactData.subject || 'New Message'} from ${contactData.name}`,
        html: htmlContent,
      });

      console.log(`[Contact Email Sent]: Message from ${contactData.email} delivered to ${adminRecipient}`);
    } catch (err: any) {
      console.error('[Contact Email SMTP Error]:', err.message || err);
    }
  } else {
    console.log(`[Contact Email Prepared]: GMAIL_APP_PASSWORD not set. Message from ${contactData.name} (${contactData.email}) logged for ${adminRecipient}.`);
  }
}

