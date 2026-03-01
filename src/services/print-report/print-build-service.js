import PDFDocument from 'pdfkit';
import fetch from 'node-fetch';

export const buildAndStreamPDF = async (orderData, res) => {
    let logoBuffer = null;
    
    if (orderData.companyLogo) {
        try {
            let logoUrl = orderData.companyLogo;
            
            if (!logoUrl.startsWith('http')) {
                const baseUrl = process.env.BASE_URL || 'http://localhost:5000'; 
                logoUrl = `${baseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
            }

            const response = await fetch(logoUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            logoBuffer = Buffer.from(arrayBuffer);
        } catch (err) {
            console.error("Failed to fetch logo image:", err.message);
        }
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Offerte_${orderData.orderNo}.pdf`);
    doc.pipe(res);

    // Helper Functions
    const generateHeader = (doc) => {
        if (logoBuffer) {
            doc.image(logoBuffer, 50, 45, { height: 40 });
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(orderData.companyName, 50, 95);
        } else {
            doc.font('Helvetica-Bold').fontSize(22).fillColor('#333333').text(orderData.companyName, 50, 45);
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text("Partner Company", 50, 95); 
        }
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
            { text: `${orderData.companyName} `, font: 'Helvetica-Bold' },
            { text: "| Mettlenbachstrasse 11, Mönchaltorf | CH-8617 Mönchaltorf | ", font: 'Helvetica' },
            { text: `Telefon: ${orderData.companyPhone}`, font: 'Helvetica-Bold' }
        ]);

        drawCenteredMixedText(footerY + 15, [
            { text: "E-Mail: ", font: 'Helvetica' },
            { text: `${orderData.companyEmail} `, font: 'Helvetica-Bold', color: '#cc0000' },
            { text: "| Webseite: ", font: 'Helvetica' },
            { text: `${orderData.companyWebsite}`, font: 'Helvetica-Bold', color: '#cc0000' }
        ]);
    };

    const drawInfoBox = (doc, title, text, y) => {
        const padding = 10; const boxX = 50; const boxWidth = 495;
        doc.font('Helvetica-Bold').fontSize(10);
        const titleHeight = doc.heightOfString(title, { width: boxWidth - 2 * padding });
        doc.font('Helvetica').fontSize(9);
        const bodyHeight = doc.heightOfString(text, { width: boxWidth - 2 * padding, align: 'left' });
        const boxHeight = padding + titleHeight + 5 + bodyHeight + padding;

        doc.roundedRect(boxX, y, boxWidth, boxHeight, 3).lineWidth(0.5).fillAndStroke('#f0f8fa', '#bce0eb'); 
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text(title, boxX + padding, y + padding);
        doc.font('Helvetica').fontSize(9).text(text, boxX + padding, y + padding + titleHeight + 5, { width: boxWidth - 2 * padding, align: 'left' });
        return y + boxHeight + 15; 
    };

    // --- الصفحة الأولى ---
    generateHeader(doc);
    let clientY = 130;
    const rightX = 380;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('black').text(orderData.client.salutation, rightX, clientY);
    doc.text(orderData.client.name, rightX, clientY + 15);
    doc.text(orderData.client.address, rightX, clientY + 30);
    doc.text(orderData.client.city, rightX, clientY + 45);
    doc.text(orderData.client.phone, rightX, clientY + 60);
    doc.text(orderData.client.email, rightX, clientY + 75);
    // doc.font('Helvetica').text(`Ansprechperson: ${orderData.contactPerson}`, rightX, clientY + 110);

    let offerY = 280;
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#cc0000').text(`Offerte Nr:     ${orderData.orderNo}`, 50, offerY);
    doc.font('Helvetica').fontSize(10).fillColor('black').text(`Mönchaltorf, ${orderData.date}`, rightX, offerY + 4);

    let detailsY = 320;
    const labelX = 50;
    const valueX = 160; 
    const valueWidth = 340;

    // --- رسم عنوان التحرك (Move Out) بالمسافات الديناميكية ---
    doc.font('Helvetica-Bold').text("Auszugsadresse: ", labelX, detailsY);
    const moveOutHeight = doc.font('Helvetica').heightOfString(orderData.moveDetails.moveOut, { width: valueWidth });
    doc.text(orderData.moveDetails.moveOut, valueX, detailsY, { width: valueWidth });
    detailsY += moveOutHeight + 15; 

    // --- رسم عنوان الوصول (Move In) بالمسافات الديناميكية ---
    doc.font('Helvetica-Bold').text("Einzugsadresse: ", labelX, detailsY);
    const moveInHeight = doc.font('Helvetica').heightOfString(orderData.moveDetails.moveIn, { width: valueWidth });
    doc.text(orderData.moveDetails.moveIn, valueX, detailsY, { width: valueWidth });
    detailsY += moveInHeight + 15;

    // --- رسم التاريف / السيارات ---
    doc.font('Helvetica-Bold').text("Fahrzeuge / Tarif:", labelX, detailsY);
    const tariffHeight = doc.font('Helvetica').heightOfString(orderData.moveDetails.tariff, { width: valueWidth });
    doc.text(orderData.moveDetails.tariff, valueX, detailsY, { width: valueWidth }); 
    detailsY += tariffHeight + 25;

    // --- رسم جدول المواعيد ---
    let tableY = detailsY;
    const tableLabelX = 160;
    const tableValueX = 300;
    const rowGap = 15;
    
    doc.font('Helvetica-Bold').text("Datum:", tableLabelX, tableY);
    doc.font('Helvetica').text(orderData.moveDetails.date, tableValueX, tableY);
    doc.font('Helvetica-Bold').text("Arbeitsbeginn:", tableLabelX, tableY + rowGap);
    doc.font('Helvetica').text(orderData.moveDetails.startTime, tableValueX, tableY + rowGap);

    generateFooter(doc);

    // --- الصفحة الثانية ---
    doc.addPage();
    generateHeader(doc);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('black').text("Preisbericht", 50, 160); 
    
    let invoiceTop = 190;
    
    // 🌟 التعديل هنا: توزيع جديد للإحداثيات عشان عمود التوتال ياخد مساحته
    const colDescX = 50;
    const colQtyX = 280;   // رحلناها شوية للشمال
    const colPriceX = 370; // رحلناها شوية للشمال
    const colTotalX = 440; // 👈 التريكة كلها هنا: كبرنا مساحة التوتال جداً
    
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text("Dienstleistungen", colDescX, invoiceTop);
    doc.text("Aufwand / Menge", colQtyX, invoiceTop);
    doc.text("Preis", colPriceX, invoiceTop);
    doc.text("Total", colTotalX, invoiceTop);
    generateHr(doc, invoiceTop + 15);

    let position = invoiceTop + 25;
    doc.font('Helvetica').fontSize(9);
    
    orderData.items.forEach(item => {
        // 🌟 التعديل هنا: حساب ارتفاع السطر ديناميكياً عشان لو الكلام كتير
        const descHeight = doc.heightOfString(item.desc, { width: 220 });
        const totalHeight = doc.heightOfString(item.total, { width: 100 });
        const rowHeight = Math.max(descHeight, totalHeight) + 10; // 10 بيكسل مسافة أمان

        doc.text(item.desc, colDescX, position, { width: 220 });
        doc.text(item.qty, colQtyX, position); 
        doc.text(item.price, colPriceX, position); 
        doc.text(item.total, colTotalX, position, { width: 100 }); 
        
        position += rowHeight; // النزول بناءً على الارتفاع الفعلي للسطر
    });

    generateHr(doc, position - 5); 
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#cc0000').text("Total (Schätzung)", colDescX, position + 5);
    // طباعة إجمالي الأوردر في المساحة الجديدة
    doc.fillColor('black').text(orderData.totalRange, colTotalX, position + 5, { width: 100 });
    
    // تحديث مكان الخط اللي تحت التوتال
    const totalRowHeight = doc.heightOfString(orderData.totalRange, { width: 100 });
    generateHr(doc, position + totalRowHeight + 10); 

    let textY = position + totalRowHeight + 25;
    const note1 = `* Der Aufwand ist geschätzt. Nur die effektive Arbeitszeit wird verrechnet. Die Offerte hat einen Kostendach von ${orderData.maxPrice}, welcher als absolute Obergrenze gilt.`;
    doc.font('Helvetica').fontSize(8).fillColor('#666666').text(note1, 50, textY, { width: 495, lineGap: 2 }); 
    textY += doc.heightOfString(note1, { width: 495 }) + 10;
    doc.text("* Die angegebenen Preise verstehen sich exklusive Mehrwertsteuer.", 50, textY, { width: 495 }); 

    let boxY = textY + 25;
    boxY = drawInfoBox(doc, "Allgemeine Hinweise:", "Diese Offerte ist unverbindlich und gilt als Schätzung basierend auf den angegebenen Daten. Zusätzliche Dienstleistungen, die nicht aufgeführt sind, werden separat berechnet.", boxY);
    generateFooter(doc);

    // --- الصفحة الثالثة ---
    doc.addPage();
    generateHeader(doc);
    let page3Y = 160;
    
    page3Y = drawInfoBox(doc, "Warum unsere Plattform wählen? (Multi-Service)", "Wir sind nicht nur ein Umzugsunternehmen, sondern eine umfassende Multi-Service-Plattform! Egal ob Reinigung, Handwerker, Möbelmontage oder Transport – wir bieten Ihnen alle Dienstleistungen aus einer Hand. Schnell, professionell und absolut zuverlässig. Entdecken Sie unser volles Angebot auf unserer Webseite.", page3Y);
    page3Y = drawInfoBox(doc, "Im Preis inbegriffen:", "Spesen, Versicherungen, Fahrkilometer, Baumwollendecken, Stretch Folien, Matratzenhüllen, Sämtliches Hilfsmaterial wie Werkzeug, Packdecken, Rollis etc. ,Übernachtungen (falls erforderlich), Autobahnkosten inkl. Treibstoff", page3Y);
    page3Y = drawInfoBox(doc, "Unsere Leistungen :", "Zum Schutz empfindlicher Bodenbeläge stellen wir Bodenvlies zur Verfügung. Falls erforderlich, verwenden wir auch Stretch Folie, um eine optimale Sicherheit für empfindliche Möbel während des Umzugs zu gewährleisten. Bilder und Glas werden mit Luftpolsterfolie geschützt, um sie während des Transports zu sichern.", page3Y);
    page3Y = drawInfoBox(doc, "Zahlung", "Die Bezahlung erfolgt bar oder per TWINT, sofern nichts anderes vereinbart wurde.\nBei TWINT-Zahlungen wird aufgrund der TWINT-Abgaben ein Mehraufwand von 2% zum Gesamtbetrag hinzugerechnet.", page3Y);
    
    generateFooter(doc);

    doc.end();
};