import nodemailer from "npm:nodemailer";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const order = payload.record;
    
    if (!order) {
      return new Response(JSON.stringify({ error: "No order record found" }), { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      });
    }

    const customerEmail = order.shipping_email;
    const customerName = order.shipping_name || "Customer";
    const orderNumber = order.order_number;
    const total = Number(order.total || 0).toFixed(2);

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
      const isPaymentConfirmed = order.status === 'processing' || order.status === 'payment_verified' || order.status === 'awaiting_approval';
      if (!(wasPendingProof && isPaymentConfirmed)) {
        return new Response(JSON.stringify({ success: true, message: "Email skipped for non-verification UPDATE event" }), { 
          headers: { "Content-Type": "application/json" },
          status: 200 
        });
      }
    }
    
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "No email address on order record" }), { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      });
    }

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

    const trackingUrl = "https://comfort-studio.vercel.app/orders";

    // HTML Email Template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #faf8f6; color: #333333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f0e6df; }
        .header { background-color: #5d4037; padding: 40px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; color: #5d4037; font-weight: 600; }
        .details-box { background-color: #faf7f4; border: 1px solid #eae1d9; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .details-row:last-child { margin-bottom: 0; padding-top: 12px; border-top: 1px dashed #eae1d9; font-weight: bold; font-size: 16px; color: #c8956c; }
        .label { color: #8d6e63; }
        .value { color: #333333; }
        .button { display: inline-block; background-color: #c8956c; color: #ffffff !important; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-size: 14px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 1px; }
        .footer { background-color: #faf7f4; padding: 25px; text-align: center; font-size: 12px; color: #8d6e63; border-top: 1px solid #f0e6df; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Comfort Studio</h1>
        </div>
        <div class="content">
          <div class="greeting">Hi ${customerName},</div>
          <p>Thank you for shopping with Comfort Studio! We have received your order and are getting it ready for processing.</p>
          <p>Please note that since we accept manual payments, your order status will be updated as soon as we verify your payment screenshot/proof.</p>
          
          <div class="details-box">
            <div class="details-row">
              <span class="label">Order Number:</span>
              <span class="value" style="font-family: monospace; font-weight: bold;">${orderNumber}</span>
            </div>
            <div class="details-row">
              <span class="label">Shipping Name:</span>
              <span class="value">${customerName}</span>
            </div>
            <div class="details-row">
              <span class="label">Shipping Destination:</span>
              <span class="value">${order.shipping_city}, ${order.shipping_zip}</span>
            </div>
            <div class="details-row">
              <span class="label">Total Amount:</span>
              <span class="value">$${total}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${trackingUrl}" class="button">Track Order Status</a>
          </div>

          <p style="font-size: 13px; color: #8d6e63; line-height: 1.5; margin-top: 30px;">
            To track this order, simply go to our website's tracking page and enter your Order Number (<strong>${orderNumber}</strong>) along with your email (<strong>${customerEmail}</strong>).
          </p>
        </div>
        <div class="footer">
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

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
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
