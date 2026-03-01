// ==========================================
// 1. Data Formatting (تنسيق البيانات)
// ==========================================
export const formatOrderData = (dbOrder) => {
    if (!dbOrder) return {};

    const formatDate = (dateStr) => {
        if (!dateStr) return "---";
        const date = new Date(dateStr);
        return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    };

    // تنسيق العناوين الجديد (سطور منفصلة لكل معلومة)
    const formatLocation = (location) => {
        if (!location) return "---";

        let lines = []; 

        if (location.address) {
            lines.push(`Adresse: ${location.address}`);
        }

        if (location.city || location.zip_code) {
            const cityZip = `${location.zip_code || ''} ${location.city || ''}`.trim();
            if (cityZip) lines.push(`Stadt: ${cityZip}`);
        }

        if (location.floor != null) {
            lines.push(`Etage: ${location.floor}. OG`);
        }

        if (location.number_of_floors != null) {
            lines.push(`Anzahl der Etagen: ${location.number_of_floors}`);
        }

        if (location.rooms != null) {
            lines.push(`Zimmer: ${location.rooms}`);
        }

        if (location.qualities && typeof location.qualities === 'object') {
            const otherQualities = Object.entries(location.qualities)
                .filter(([key]) => key.toLowerCase() !== 'rooms' && key.toLowerCase() !== 'zimmer')
                .map(([key, val]) => {
                    if (val === true) return key;
                    if (val === false) return null;
                    return `${key}: ${val}`;
                })
                .filter(Boolean)
                .join(', ');

            if (otherQualities) {
                lines.push(`Besonderheiten: ${otherQualities}`);
            }
        }

        return lines.join('\n');
    };

    const items = [];
    
    dbOrder.orderServices?.forEach(srv => {
        const isHourly = srv.pricing_type === 'per_hour';
        const qty = isHourly ? `${srv.min_units || 0} - ${srv.max_units || 0} Std.` : "1";
        
        let additionsMinTotal = 0;
        let additionsMaxTotal = 0;

        // 🌟 هندلة الإضافات (الكمية، سعر الوحدة، والرينج)
        const additionItems = [];

        srv.additions?.forEach(add => {
            const addMinTotal = parseFloat(add.min_total_price || add.fixed_price || 0);
            const addMaxTotal = parseFloat(add.max_total_price || add.fixed_price || 0);

            additionsMinTotal += addMinTotal;
            additionsMaxTotal += addMaxTotal;

            // تحديد هل الإضافة بالساعة ولها رينج؟
            const isAddHourly = add.pricing_type === 'per_hour';
            const addQty = isAddHourly ? `${add.min_units || 0} - ${add.max_units || 0} Std.` : "---";

            // تحديد سعر الإضافة كرينج أو ثابت
            const addTotalRange = isAddHourly && addMinTotal !== addMaxTotal
                ? `${addMinTotal.toFixed(2)} - ${addMaxTotal.toFixed(2)} CHF`
                : `${addMaxTotal.toFixed(2)} CHF`;

            const addPriceUnit = add.fixed_price > 0 
                ? parseFloat(add.fixed_price).toFixed(2) 
                : parseFloat(add.price_per_unit || 0).toFixed(2);

            additionItems.push({
                desc: `+ ${add.Addition?.name || "Zusatzleistung"}`, // غيرتها لـ Zusatzleistung ككلمة افتراضية لو الداتا مجاتش
                qty: addQty,
                price: `${addPriceUnit} CHF`,
                total: addTotalRange
            });
        });

        // السعر الصافي للخدمة الأساسية (بعد طرح الإضافات)
        const baseMinPrice = Math.max(0, parseFloat(srv.min_total_price || 0) - additionsMinTotal);
        const baseMaxPrice = Math.max(0, parseFloat(srv.max_total_price || 0) - additionsMaxTotal);

        const totalRange = isHourly && baseMinPrice !== baseMaxPrice
            ? `${baseMinPrice.toFixed(2)} - ${baseMaxPrice.toFixed(2)} CHF`
            : `${baseMaxPrice.toFixed(2)} CHF`;

        // 1. إضافة الخدمة الأساسية للجدول
        items.push({
            desc: srv.service?.name || "Service",
            qty: qty,
            price: `${parseFloat(srv.price_per_unit || 0).toFixed(2)} CHF`,
            total: totalRange
        });

        // 2. دمج الإضافات ورا الخدمة الأساسية مباشرة
        items.push(...additionItems);
    });

    let contactPerson = "Administration";
    if (dbOrder.companyAdmins && dbOrder.companyAdmins.length > 0) {
        contactPerson = dbOrder.companyAdmins[0].name;
    }

    const companyPhone = dbOrder.companyPhones?.length > 0 ? dbOrder.companyPhones[0].phone : "044 810 33 33";
    const clientPhone = dbOrder.clientPhones?.length > 0 ? dbOrder.clientPhones[0].phone : "---";

    const vehicles = dbOrder.assigned_vehicles?.map(v => v.name).join(', ') || "Standard";

    return {
        orderNo: dbOrder?.id ? dbOrder.id.toString() : "---",
        date: formatDate(dbOrder.createdAt),
        companyName: dbOrder.company?.name || "Partner Company",
        companyEmail: dbOrder.company?.email || "info@firma.ch",
        companyWebsite: dbOrder.company?.website || "www.firma.ch",
        companyLogo: dbOrder.company?.logo || null,
        companyPhone: companyPhone,
        contactPerson: contactPerson,
        client: {
            salutation: "Herr/Frau",
            name: dbOrder.client?.name || "---",
            address: dbOrder.primary_location?.address?.split(',')[0] || "---",
            city: dbOrder.primary_location?.address?.split(',').slice(1).join(',').trim() || "---",
            phone: clientPhone,
            email: dbOrder.client?.email || "---"
        },
        moveDetails: {
            moveOut: formatLocation(dbOrder.primary_location),
            moveIn: formatLocation(dbOrder.secondary_location),
            tariff: vehicles,
            date: formatDate(dbOrder.execution_date),
            startTime: dbOrder.execution_time ? dbOrder.execution_time.substring(0, 5) + " Uhr" : "---",
        },
        items: items,
        totalRange: `${parseFloat(dbOrder.min_total_price || 0).toFixed(2)} - ${parseFloat(dbOrder.max_total_price || 0).toFixed(2)} CHF`,
        maxPrice: `${parseFloat(dbOrder.max_total_price || 0).toFixed(2)} CHF`
    };
};