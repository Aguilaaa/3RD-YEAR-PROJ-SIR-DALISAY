const nodemailer = require('nodemailer');
const { peso, formatWhen } = require('./format');
const { buildReceiptPdf } = require('./pdf');

function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  if (!emailConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function itemRows(items) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ece7df;">${item.productName}<br><span style="color:#667085;">${item.itemCode}</span></td>
          <td style="padding:8px;border-bottom:1px solid #ece7df;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #ece7df;text-align:right;">${peso(item.unitPrice)}</td>
          <td style="padding:8px;border-bottom:1px solid #ece7df;text-align:right;">${peso(item.subtotal)}</td>
        </tr>`
    )
    .join('');
}

async function sendOrderEmail(order, items, kind) {
  const transport = createTransport();
  if (!transport) {
    const reason = 'Email is not configured. Add SMTP settings to the server environment.';
    console.error('Order email skipped:', reason);
    return { sent: false, error: reason };
  }

  const placed = kind === 'placed';
  const heading = placed ? 'Thank you for your order' : `Your order is now ${order.status}`;
  const intro = placed
    ? `We received order <strong>${order.orderNumber}</strong> on ${formatWhen(order.createdAt || new Date())}. It is currently ${order.status}.`
    : `Order <strong>${order.orderNumber}</strong> was updated on ${formatWhen(new Date())}.`;
  const subject = placed
    ? `MotoTech order ${order.orderNumber} receipt`
    : `MotoTech order ${order.orderNumber} is ${order.status}`;

  try {
    const pdf = await buildReceiptPdf(order, items);
    const html = `
      <div style="font-family:Arial,sans-serif;color:#12151a;max-width:640px;">
        <div style="background:#12151a;color:#f6f3ee;padding:20px 24px;">
          <div style="color:#ff5a1f;font-size:22px;font-weight:700;letter-spacing:1px;">MOTOTECH</div>
          <div>Motorcycle Parts &amp; Accessories</div>
        </div>
        <div style="padding:24px;">
          <h2 style="margin:0 0 8px;">${heading}</h2>
          <p>${intro}</p>
          <p>
            <strong>${order.shippingName}</strong><br>
            ${order.contactNumber}<br>
            ${order.address}<br>
            Payment: ${order.paymentMethod}
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f6f3ee;">
                <th style="text-align:left;padding:8px;">Product</th>
                <th style="padding:8px;">Qty</th>
                <th style="text-align:right;padding:8px;">Unit price</th>
                <th style="text-align:right;padding:8px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemRows(items)}</tbody>
          </table>
          <p style="text-align:right;font-size:18px;"><strong>Grand total: ${peso(order.grandTotal)}</strong></p>
          <p>A PDF receipt is attached to this email.</p>
        </div>
      </div>`;

    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: order.customerEmail,
      subject,
      html,
      attachments: [
        {
          filename: `${order.orderNumber}-receipt.pdf`,
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
    });

    return { sent: true, error: '' };
  } catch (error) {
    console.error('Order email failed:', error.message);
    return { sent: false, error: error.message };
  }
}

function sendOrderStatusEmail(order, items) {
  return sendOrderEmail(order, items, 'status');
}

function sendOrderPlacedEmail(order, items) {
  return sendOrderEmail(order, items, 'placed');
}

module.exports = { emailConfigured, sendOrderStatusEmail, sendOrderPlacedEmail };
