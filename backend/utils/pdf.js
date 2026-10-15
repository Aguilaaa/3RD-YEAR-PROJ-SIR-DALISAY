const PDFDocument = require('pdfkit');
const { peso, formatWhen } = require('./format');

function buildReceiptPdf(order, items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, doc.page.width, 92).fill('#12151a');
    doc.fillColor('#ff5a1f').font('Helvetica-Bold').fontSize(26).text('MOTOTECH', 48, 28);
    doc.fillColor('#f6f3ee').font('Helvetica').fontSize(11).text('Motorcycle Parts & Accessories', 48, 58);
    doc.fillColor('#12151a');

    doc.font('Helvetica-Bold').fontSize(16).text('Official Receipt', 48, 116);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Order number: ${order.orderNumber}`, 48, 142);
    doc.text(`Date: ${formatWhen(order.createdAt)}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment: ${order.paymentMethod}`);

    doc.moveDown();
    doc.font('Helvetica-Bold').text('Customer');
    doc.font('Helvetica').text(order.shippingName);
    doc.text(order.customerEmail);
    doc.text(order.contactNumber);
    doc.text(order.address, { width: 480 });

    const tableTop = doc.y + 18;
    doc.rect(48, tableTop, 500, 22).fill('#1c212b');
    doc.fillColor('#f6f3ee').font('Helvetica-Bold').fontSize(10);
    doc.text('Item', 56, tableTop + 6, { width: 210 });
    doc.text('Qty', 270, tableTop + 6, { width: 40 });
    doc.text('Unit price', 320, tableTop + 6, { width: 90 });
    doc.text('Subtotal', 430, tableTop + 6, { width: 100, align: 'right' });

    let y = tableTop + 30;
    doc.fillColor('#12151a').font('Helvetica').fontSize(10);
    items.forEach((item) => {
      if (y > 720) {
        doc.addPage();
        y = 48;
      }
      doc.text(`${item.productName} (${item.itemCode})`, 56, y, { width: 210 });
      doc.text(String(item.quantity), 270, y, { width: 40 });
      doc.text(peso(item.unitPrice), 320, y, { width: 90 });
      doc.text(peso(item.subtotal), 430, y, { width: 100, align: 'right' });
      y += 28;
    });

    doc.moveTo(48, y).lineTo(548, y).strokeColor('#d9d3c8').stroke();
    y += 12;
    doc.font('Helvetica-Bold').fontSize(13).text(`Grand total: ${peso(order.grandTotal)}`, 300, y, {
      width: 230,
      align: 'right',
    });

    doc.font('Helvetica').fontSize(9).fillColor('#667085').text(
      'Thank you for riding with MotoTech. Keep this receipt for your records.',
      48,
      760,
      { width: 500, align: 'center' }
    );

    doc.end();
  });
}

module.exports = { buildReceiptPdf };
