import nodemailer from "npm:nodemailer";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    let order = payload.record || payload.order;
    
    if (!order) {
      return new Response(JSON.stringify({ error: "No order record found" }), { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      });
    }

    const type = payload.type || 'INSERT';
    const oldRecord = payload.old_record;

    if (type === 'INSERT') {
      if (order.status === 'pending_proof') {
        return new Response(JSON.stringify({ success: true, message: "Email skipped for pending_proof on INSERT" }), { 
          headers: { "Content-Type": "application/json" },
          status: 200 
        });
      }
    } else if (type === 'UPDATE') {
      const wasPendingProof = oldRecord?.status === 'pending_proof';
      const isPaymentConfirmed = order.status === 'processing' || order.status === 'payment_verified' || order.status === 'awaiting_approval' || order.status === 'completed';
      if (!(wasPendingProof && isPaymentConfirmed)) {
        return new Response(JSON.stringify({ success: true, message: "Email skipped for non-verification UPDATE event" }), { 
          headers: { "Content-Type": "application/json" },
          status: 200 
        });
      }
    }

    const customerEmail = order.shipping_email || order.shippingEmail;
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "No email address on order record" }), { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      });
    }

    // Fetch full nested order_items & products if not present in payload
    let items = order.order_items || order.items || [];
    if (items.length === 0 && order.id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: dbOrder } = await supabase
          .from('orders')
          .select('*, order_items(*, products(*))')
          .eq('id', order.id)
          .maybeSingle();

        if (dbOrder) {
          order = { ...order, ...dbOrder };
          items = dbOrder.order_items || [];
        }
      }
    }

    const customerName = order.shipping_name || order.shippingName || "Customer";
    const customerPhone = order.shipping_phone || order.shippingPhone || "Not provided";
    const city = order.shipping_city || order.shippingCity || "N/A";
    const zip = order.shipping_zip || order.shippingPostalCode || "N/A";
    const orderNumber = order.order_number || order.orderNumber;
    const total = Number(order.total || 0).toFixed(2);
    const shipping = Number(order.shipping || 0).toFixed(2);
    const paymentMethod = order.payment_screenshot ? 'Bank Pay' : 'Cash on Delivery';

    const itemsHtml = items.map((item: any) => {
      const pName = item.products?.name || item.name || item.productName || 'Product';
      const qty = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const itemTotal = (price * qty).toFixed(2);

      const size = item.selected_size || item.selectedSize;
      const color = item.selected_color || item.selectedColor;
      const storage = item.selected_storage || item.selectedStorage;
      const mattress = item.selected_mattress || item.selectedMattress;

      const vars = [];
      if (size) vars.push(`<li><strong>Size:</strong> ${size}</li>`);
      if (color) vars.push(`<li><strong>Colour:</strong> ${color}</li>`);
      if (storage) vars.push(`<li><strong>Storage:</strong> ${storage}</li>`);
      if (mattress) vars.push(`<li><strong>Mattress:</strong> ${mattress}</li>`);

      const varsHtml = vars.length > 0
        ? `<ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 12px; color: #555; list-style-type: disc;">${vars.join('')}</ul>`
        : '<span style="font-size: 12px; color: #888;">Standard Option</span>';

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; vertical-align: top;">
            <strong style="color: #333; font-size: 14px;">${pName}</strong>
            ${varsHtml}
          </td>
          <td style="padding: 12px; text-align: center; vertical-align: top; font-size: 14px;">${qty}</td>
          <td style="padding: 12px; text-align: right; vertical-align: top; font-size: 14px;">£${price.toFixed(2)}</td>
          <td style="padding: 12px; text-align: right; vertical-align: top; font-weight: bold; color: #5d4037; font-size: 14px;">£${itemTotal}</td>
        </tr>
      `;
    }).join('');

    const smtpUser = Deno.env.get("SMTP_USER") || "comfortstudiouk@gmail.com";

    // Connect to Gmail SMTP via Nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: Deno.env.get("GMAIL_APP_PASSWORD") || "",
      },
    });

    const trackingUrl = `https://comfortstudio.co.uk/orders?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}`;

    // HTML Email Template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - Comfort Studio</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #faf8f6; color: #333333; margin: 0; padding: 20px 0;">
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f0e6df;">
        <div style="background-color: #5d4037; padding: 35px 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">Comfort Studio</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #c8956c; letter-spacing: 1px;">LUXURY FURNITURE & DECOR</p>
        </div>
        <div style="padding: 30px 25px;">
          <div style="background-color: #fdfaf7; border-left: 4px solid #c8956c; padding: 15px 20px; margin-bottom: 25px; border-radius: 4px;">
            <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #5d4037;">Order Confirmed!</h2>
            <p style="margin: 0; font-size: 14px; color: #666;">Hi <strong>${customerName}</strong>, thank you for your purchase. Below are your complete order details.</p>
          </div>
          
          <!-- Customer Details Card -->
          <div style="background-color: #faf7f4; border: 1px solid #eae1d9; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #5d4037; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5d3c5; padding-bottom: 6px;">
              Customer & Delivery Details
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 4px 0; color: #8d6e63; width: 140px;">Customer Name:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${customerName}</td></tr>
              <tr><td style="padding: 4px 0; color: #8d6e63;">Email Address:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${customerEmail}</td></tr>
              <tr><td style="padding: 4px 0; color: #8d6e63;">Contact Phone:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${customerPhone}</td></tr>
              <tr><td style="padding: 4px 0; color: #8d6e63;">City:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${city}</td></tr>
              <tr><td style="padding: 4px 0; color: #8d6e63;">Postal Code:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">${zip}</td></tr>
              <tr><td style="padding: 4px 0; color: #8d6e63;">Payment Method:</td><td style="padding: 4px 0; font-weight: bold; color: #c8956c;">${paymentMethod}</td></tr>
              <tr><td style="padding: 4px 0; color: #8d6e63;">Order Number:</td><td style="padding: 4px 0; font-family: monospace; font-weight: bold; color: #5d4037;">${orderNumber}</td></tr>
            </table>
          </div>

          <!-- Items Table -->
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #5d4037; text-transform: uppercase; letter-spacing: 1px;">Order Items & Specifications</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #eae1d9; border-radius: 8px; overflow: hidden; font-size: 14px;">
            <thead>
              <tr style="background-color: #5d4037; color: #ffffff; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 10px 12px; text-align: left;">Item Details</th>
                <th style="padding: 10px 12px; text-align: center;">Qty</th>
                <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
                <th style="padding: 10px 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Summary -->
          <div style="background-color: #faf7f4; border: 1px solid #eae1d9; border-radius: 12px; padding: 18px 20px; margin-bottom: 25px; font-size: 14px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #8d6e63;">Shipping:</td><td style="padding: 4px 0; text-align: right; color: #333;">${Number(shipping) === 0 ? 'Free' : `£${shipping}`}</td></tr>
              <tr style="border-top: 1px solid #eae1d9;"><td style="padding: 10px 0 0 0; font-weight: bold; font-size: 16px; color: #5d4037;">Grand Total:</td><td style="padding: 10px 0 0 0; text-align: right; font-weight: bold; font-size: 18px; color: #c8956c;">£${total}</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="display: inline-block; background-color: #c8956c; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: bold; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(200, 149, 108, 0.3);">Track Your Order</a>
          </div>

          <p style="font-size: 13px; color: #8d6e63; line-height: 1.5; text-align: center; margin-top: 15px;">
            You can track your order status anytime at <a href="https://comfortstudio.co.uk/orders" style="color: #c8956c; font-weight: bold; text-decoration: underline;">comfortstudio.co.uk/orders</a> simply by entering your Order ID (<strong>${orderNumber}</strong>).
          </p>
        </div>
        <div style="background-color: #faf7f4; padding: 20px; text-align: center; font-size: 12px; color: #8d6e63; border-top: 1px solid #f0e6df;">
          &copy; ${new Date().getFullYear()} Comfort Studio. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"Comfort Studio" <${smtpUser}>`,
      to: customerEmail,
      subject: `Comfort Studio Order Confirmation: ${orderNumber}`,
      html: htmlContent,
    });

    return new Response(JSON.stringify({ success: true, message: "Order email sent successfully with complete details" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error dispatching email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
