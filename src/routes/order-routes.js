import express from 'express';
import { getOrders, adminCreateOrderForClient, adminUpdateOrderForClient, cancelOrderByAdmin } from '../controllers/order-controller.js';
import validate from '../middleware/validatin-mw.js';
import { createOrderForClientSchema, updateOrderForClientSchema } from '../validation/order-schema.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), getOrders);
router.post('/admin-create-order', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), validate(createOrderForClientSchema), adminCreateOrderForClient);
router.patch('/admin-update-order/:id', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), validate(updateOrderForClientSchema), adminUpdateOrderForClient);
router.patch('/:id/cancel', authorize('super_admin', 'site_admin', 'company_admin', 'company_secretary'), cancelOrderByAdmin);


import PDFDocument from 'pdfkit';

// ==========================================
// 1. دالة لتجهيز وتنسيق بيانات الأوردر
// ==========================================
const formatOrderData = (dbOrder) => {
  // دالة صغيرة لتنسيق التاريخ (مثال: 2026-03-10 إلى 10.03.2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return "---";
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  };

  // استخراج الخدمة الأساسية والإضافات لعمل جدول الأسعار
  const items = [];
  let pricePerHour = "---";
  let estimatedTime = "---";

  dbOrder.orderServices?.forEach(srv => {
    // تجهيز السطر بتاع الخدمة (مثلاً Moving)
    const isHourly = srv.pricing_type === 'per_hour';
    const qty = isHourly ? `${srv.min_units}-${srv.max_units}` : "1";
    
    if (isHourly) {
        pricePerHour = `${srv.price_per_unit} CHF`;
        estimatedTime = `${srv.min_units}-${srv.max_units} Stunden`;
    }

    items.push({
      desc: srv.service?.name || "Service",
      qty: qty,
      price: `${srv.price_per_unit} CHF`,
      total: `${srv.max_total_price} CHF` // استخدمنا الحد الأقصى أو الثابت
    });

    // تجهيز السطور بتاعة الإضافات (مثلاً Extra boxes)
    srv.additions?.forEach(add => {
      items.push({
        desc: add.Addition?.name || "Addition",
        qty: "---",
        price: add.fixed_price > 0 ? `${add.fixed_price} CHF` : `${add.price_per_unit} CHF`,
        total: `${add.max_total_price} CHF`
      });
    });
  });

  // استخراج بيانات العربيات المربوطة
  const vehicles = dbOrder.assigned_vehicles?.map(v => v.name).join(', ') || "Standard";

  return {
    orderNo: dbOrder.id.toString(),
    date: formatDate(dbOrder.createdAt),
    companyName: dbOrder.company?.name || "Rebo Transport GmbH",
    companyEmail: dbOrder.company?.email || "rebotransport.info@gmail.com",
    client: {
      salutation: "Herr/Frau", // مش موجودة في الداتا فبنحط قيمة افتراضية
      name: dbOrder.client?.name || "---",
      address: dbOrder.primary_location?.address?.split(',')[0] || "---", // ناخد أول جزء من العنوان كشارع
      city: dbOrder.primary_location?.address?.split(',')[1]?.trim() || "---", // الجزء التاني كمدينة
      phone: dbOrder.client?.phones?.length ? dbOrder.client.phones[0] : "---",
      email: dbOrder.client?.email || "---"
    },
    moveDetails: {
      moveOut: dbOrder.primary_location?.address || "---",
      moveIn: dbOrder.secondary_location?.address || "---",
      tariff: `${vehicles}`,
      date: formatDate(dbOrder.execution_date),
      startTime: dbOrder.execution_time?.substring(0, 5) + " Uhr" || "---",
      estimatedTime: estimatedTime,
      rooms: dbOrder.details?.rooms || "---", // لو فيه تفاصيل غرف في الأوردر
      pricePerHour: pricePerHour,
      disposalPrice: "---", // ممكن تربطها بإضافة مخصصة للـ Entsorgung
      disposalMeters: "---",
      contactPerson: "Admin"
    },
    items: items,
    total: `${dbOrder.min_total_price} - ${dbOrder.max_total_price} CHF`
  };
};

// ==========================================
// 2. الكنترولر الأساسي لطباعة الـ PDF
// ==========================================
export const generateOrderPDF = async (req, res) => {
  try {
    // ⚠️ هنا هتعمل استعلام للداتابيز عشان تجيب الأوردر بالـ ID، مثلاً:
    // const dbOrder = await Order.findByPk(req.params.id, { include: [...] });
    
    // للتجربة، أنا هحط الداتا (JSON) بتاعتك هنا مباشرة كـ Mock Data:
    const dbOrder = {
        "id": 2,
        "client_id": 3,
        "company_id": 1,
        "execution_date": "2026-03-10",
        "execution_time": "09:00:00",
        "status": "pending",
        "min_total_price": "350.00",
        "max_total_price": "450.00",
        "createdAt": "2026-02-28T21:09:11.000Z",
        "client": { "id": 3, "name": "John", "email": "client@gmail.com", "phones": [] },
        "company": { "id": 1, "name": "Umzugskönig AG", "email": "info@umzugskoenig.ch" },
        "primary_location": { "address": "123 Port Said St, Egypt" },
        "secondary_location": { "address": "456 Damietta Resort, Egypt" },
        "assigned_vehicles": [
            { "id": 2, "license_plate": "ABC-1237", "name": "Truck 123" },
            { "id": 3, "license_plate": "ABC-1236", "name": "Truck 123" }
        ],
        "orderServices": [
            {
                "pricing_type": "per_hour", "price_per_unit": "50.00", "min_units": 3, "max_units": 5, "max_total_price": "450.00",
                "service": { "name": "Moving" },
                "additions": [
                    { "pricing_type": "flat_rate", "fixed_price": "200.00", "max_total_price": "200.00", "Addition": { "name": "Extra boxes" } }
                ]
            }
        ]
    };

    // تجهيز الداتا المنسقة
    const order = formatOrderData(dbOrder);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Offerte_${order.orderNo}.pdf`);
    doc.pipe(res);

    // ==========================================
    // 3. Helper Functions للرسم (مع دمج ديناميكية الداتا)
    // ==========================================
    const generateHeader = (doc) => {
      // خليت اسم الشركة ديناميكي من الأوردر
      doc.font('Helvetica-Bold').fontSize(26).fillColor('#333333').text(order.companyName.substring(0, 4), 50, 45);
      doc.circle(60, 52, 3.5).fill('#cc0000'); 
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#cc0000').text("TRANSPORT & UMZÜGE", 50, 75);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(order.companyName, 50, 95);
      doc.font('Helvetica').text("Mettlenbachstrasse 11, Mönchaltorf", 50, 110);
      doc.text("CH-8617 Mönchaltorf", 50, 125);
    };

    const generateHr = (doc, y) => {
      doc.strokeColor("#cccccc").lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
    };

    const generateFooter = (doc) => {
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 80;

      generateHr(doc, footerY - 15);

      const drawCenteredMixedText = (y, segments) => {
        let totalWidth = 0;
        segments.forEach(seg => {
          doc.font(seg.font || 'Helvetica').fontSize(seg.size || 9);
          seg.width = doc.widthOfString(seg.text);
          totalWidth += seg.width;
        });

        let currentX = (doc.page.width - totalWidth) / 2;

        segments.forEach(seg => {
          doc.font(seg.font || 'Helvetica').fontSize(seg.size || 9).fillColor(seg.color || 'black')
             .text(seg.text, currentX, y, { lineBreak: false });
          currentX += seg.width; 
        });
      };

      drawCenteredMixedText(footerY, [
        { text: `${order.companyName} `, font: 'Helvetica-Bold' },
        { text: "| Mettlenbachstrasse 11, Mönchaltorf | CH-8617 Mönchaltorf | ", font: 'Helvetica' },
        { text: "Telefon: 044 810 33 33", font: 'Helvetica-Bold' }
      ]);

      drawCenteredMixedText(footerY + 15, [
        { text: "E-Mail: ", font: 'Helvetica' },
        { text: `${order.companyEmail} `, font: 'Helvetica-Bold', color: '#cc0000' },
        { text: "| Webseite: ", font: 'Helvetica' },
        { text: "https://www.transport-rebo.ch/", font: 'Helvetica-Bold', color: '#cc0000' }
      ]);
    };

    const drawInfoBox = (doc, title, text, y) => {
      const padding = 10;
      const boxX = 50;
      const boxWidth = 495;

      doc.font('Helvetica-Bold').fontSize(10);
      const titleHeight = doc.heightOfString(title, { width: boxWidth - 2 * padding });

      doc.font('Helvetica').fontSize(9);
      const bodyHeight = doc.heightOfString(text, { width: boxWidth - 2 * padding, align: 'left' });

      const boxHeight = padding + titleHeight + 5 + bodyHeight + padding;

      doc.roundedRect(boxX, y, boxWidth, boxHeight, 3)
         .lineWidth(0.5)
         .fillAndStroke('#f0f8fa', '#bce0eb'); 

      doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
      doc.text(title, boxX + padding, y + padding);

      doc.font('Helvetica').fontSize(9);
      doc.text(text, boxX + padding, y + padding + titleHeight + 5, { width: boxWidth - 2 * padding, align: 'left' });

      return y + boxHeight + 15; 
    };

    // ==========================================
    // 4. الصفحة الأولى
    // ==========================================
    generateHeader(doc);
    
    let clientY = 130;
    const rightX = 380;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
    doc.text(order.client.salutation, rightX, clientY);
    doc.text(order.client.name, rightX, clientY + 15);
    doc.text(order.client.address, rightX, clientY + 30);
    doc.text(order.client.city, rightX, clientY + 45);
    doc.text(order.client.phone, rightX, clientY + 60);
    doc.text(order.client.email, rightX, clientY + 75);
    doc.font('Helvetica').text(`Ansprechperson: ${order.moveDetails.contactPerson}`, rightX, clientY + 110);

    let offerY = 280;
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#cc0000').text(`Offerte Nr:     ${order.orderNo}`, 50, offerY);
    doc.font('Helvetica').fontSize(10).fillColor('black').text(`Mönchaltorf, ${order.date}`, rightX, offerY + 4);

    let detailsY = 320;
    const labelX = 50;
    doc.font('Helvetica-Bold').text("Auszugsadresse: ", labelX, detailsY, { continued: true }).font('Helvetica').text(order.moveDetails.moveOut);
    doc.font('Helvetica-Bold').text("Einzugsadresse: ", labelX, detailsY + 20, { continued: true }).font('Helvetica').text(order.moveDetails.moveIn);
    doc.font('Helvetica-Bold').text("Tarif:", labelX, detailsY + 40);
    doc.text(order.moveDetails.tariff, 150, detailsY + 40); 

    let tableY = detailsY + 60;
    const tableLabelX = 150;
    const tableValueX = 290;
    const rowGap = 15;
    doc.font('Helvetica-Bold').text("Umzugsdatum:", tableLabelX, tableY);
    doc.font('Helvetica').text(order.moveDetails.date, tableValueX, tableY);
    doc.font('Helvetica-Bold').text("Arbeitsbeginn:", tableLabelX, tableY + rowGap);
    doc.font('Helvetica').text(order.moveDetails.startTime, tableValueX, tableY + rowGap);
    doc.font('Helvetica-Bold').text("Geschätzter Aufwand :", tableLabelX, tableY + rowGap * 2);
    doc.font('Helvetica').text(order.moveDetails.estimatedTime, tableValueX, tableY + rowGap * 2);
    doc.font('Helvetica-Bold').text("Zimmer :", tableLabelX, tableY + rowGap * 3);
    doc.font('Helvetica').text(order.moveDetails.rooms, tableValueX, tableY + rowGap * 3);
    doc.font('Helvetica-Bold').text("Preis pro Stunde :", tableLabelX, tableY + rowGap * 4);
    doc.font('Helvetica').text(order.moveDetails.pricePerHour, tableValueX, tableY + rowGap * 4);

    let entsorgungY = tableY + rowGap * 4 + 40;
    doc.font('Helvetica').fontSize(14).text("Entsorgung :", labelX, entsorgungY);
    doc.fontSize(10).font('Helvetica-Bold').text("Entsorgung Preis pro M : ", labelX, entsorgungY + 25, { continued: true }).font('Helvetica').text(order.moveDetails.disposalPrice);
    doc.font('Helvetica-Bold').text("Meters Anzahl : ", labelX, entsorgungY + 40, { continued: true }).font('Helvetica').text(order.moveDetails.disposalMeters);

    generateFooter(doc);

    // ==========================================
    // 5. الصفحة الثانية
    // ==========================================
    doc.addPage();
    generateHeader(doc);
    
    doc.fontSize(14).font('Helvetica-Bold').fillColor('black').text("Preisbericht", 50, 160); 
    
    let invoiceTop = 190;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text("Dienstleistungen", 50, invoiceTop);
    doc.text("Anzahl", 330, invoiceTop);
    doc.text("Preis", 400, invoiceTop);
    doc.text("Total", 480, invoiceTop);
    generateHr(doc, invoiceTop + 15);

    let position = invoiceTop + 25;
    doc.font('Helvetica').fontSize(9);
    
    // 👈 هنا بنلف على العناصر الديناميكية (الخدمات والإضافات)
    order.items.forEach(item => {
      doc.text(item.desc, 50, position, { width: 260 });
      doc.text(item.qty, 330, position);
      doc.text(item.price, 400, position);
      doc.text(item.total, 480, position);
      position += 25; 
    });

    generateHr(doc, position - 5); 
    
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#cc0000').text("Total", 50, position + 5);
    doc.fillColor('black').text(order.total, 480, position + 5);
    
    generateHr(doc, position + 20); 

    let textY = position + 35;
    const note1 = "* Der Aufwand ist geschätzt. Nur die effektive Arbeitszeit wird verrechnet. Die Offerte hat einen Kostendach von 1800.- CHF, welcher nur für den Umzug gedacht ist und nicht für alle anderen Dienstleistungen.";
    doc.font('Helvetica').fontSize(8).fillColor('#666666')
       .text(note1, 50, textY, { width: 495, lineGap: 2 }); 

    textY += doc.heightOfString(note1, { width: 495 }) + 10;
    doc.text("* Die angegebenen Preise verstehen sich exklusive Mehrwertsteuer, welche am Schluss zusätzlich berechnet wird.", 50, textY, { width: 495 }); 

    let boxY = textY + 25;
    
    boxY = drawInfoBox(doc, "Zusatzleistungen:", 
      "Zum Schutz empfindlicher Bodenbeläge stellen wir Bodenvlies zur Verfügung. Falls erforderlich, verwenden wir auch Stretch Folie, um eine optimale Sicherheit für empfindliche Möbel während des Umzugs zu gewährleisten. Bilder und Glas werden mit Luftpolsterfolie geschützt, um sie während des Transports zu sichern. Zusätzlich stellen wir Ihnen leihweise zwei Matratzenhüllen und zwei Kleiderboxen mit Stangen zur Verfügung.", 
      boxY);

    boxY = drawInfoBox(doc, "Versicherungen", 
      "Die Transport- und Betriebshaftpflichtversicherung ist im Preis inbegriffen. Bei Beschädigung Ihrer Güter haftet Rebo Transport GmbH gemäss schweizerischem Obligationenrecht. Basis einer Leistung ist der Zeitwert.\nTransportversicherung: Police Nr. 19.433.857 (Deckung CHF 100'000.-)\nBetriebshaftpflichtversicherung: Police Nr. 19.656.471", 
      boxY);

    boxY = drawInfoBox(doc, "Kosten- und Zeitberechnung", 
      "Wir möchten Sie darauf hinweisen, dass wir die Transport- und Materialkosten gemäss des effektiven Zeit- und Materialaufwands gemäss des Arbeitsrapports in Rechnung stellen.\nDie Mindestverrechnungszeit liegt bei 3 Stunden und die Mittagspause wird nicht berechnet.\nDie Preise verstehen sich exklusive MwSt.", 
      boxY);

    boxY = drawInfoBox(doc, "Pausen:", 
      "Die Pausen für unsere Mitarbeiter betragen jeweils 15 Minuten am Vormittag und am Nachmittag.", 
      boxY);

    generateFooter(doc);

    // ==========================================
    // 6. الصفحة الثالثة
    // ==========================================
    doc.addPage();
    generateHeader(doc);

    let page3Y = 160;

    page3Y = drawInfoBox(doc, "Im Preis inbegriffen:", 
      "Spesen, Versicherungen, Fahrkilometer, Baumwollendecken, Stretch Folien, Matratzenhüllen, Sämtliches Hilfsmaterial wie Werkzeug, Packdecken, Rollis etc. ,Übernachtungen (falls erforderlich), Autobahnkosten inkl. Treibstoff", 
      page3Y);

    page3Y = drawInfoBox(doc, "Umzugskarton:", 
      "Wir stellen Ihnen kostenlose Umzugskartons zur Verfügung, sowie Weinkarton, Bücherkarton und Kühlboxen. Pro Transport berechnen wir pauschal 30.-, jedoch ist die Selbstabholung kostenlos.", 
      page3Y);

    page3Y = drawInfoBox(doc, "Unsere Leistungen :", 
      "Zum Schutz empfindlicher Bodenbeläge stellen wir Bodenvlies zur Verfügung. Falls erforderlich, verwenden wir auch Stretch Folie, um eine optimale Sicherheit für empfindliche Möbel während des Umzugs zu gewährleisten. Bilder und Glas werden mit Luftpolsterfolie geschützt, um sie während des Transports zu sichern. Zusätzlich stellen wir Ihnen leihweise zwei Matratzenhüllen und zwei Kleiderboxen mit Stangen zur Verfügung.", 
      page3Y);

    page3Y = drawInfoBox(doc, "Zahlung", 
      "Die Bezahlung erfolgt bar oder per TWINT, sofern nichts anderes vereinbart wurde.\nBei TWINT-Zahlungen wird aufgrund der TWINT-Abgaben ein Mehraufwand von 2% zum Gesamtbetrag hinzugerechnet.", 
      page3Y);

    generateFooter(doc);

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
router.get("/:id/pdf", generateOrderPDF);
export default router;