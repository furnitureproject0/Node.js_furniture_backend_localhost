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

    const formatLocation = (location) => {
        if (!location) return "---";
        let lines = []; 
        if (location.address) lines.push(`Adresse: ${location.address}`);
        if (location.city || location.zip_code) {
            const cityZip = `${location.zip_code || ''} ${location.city || ''}`.trim();
            if (cityZip) lines.push(`Stadt: ${cityZip}`);
        }
        if (location.floor != null) lines.push(`Etage: ${location.floor}. OG`);
        if (location.number_of_floors != null) lines.push(`Anzahl der Etagen: ${location.number_of_floors}`);
        if (location.rooms != null) lines.push(`Zimmer: ${location.rooms}`);

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
            if (otherQualities) lines.push(`Besonderheiten: ${otherQualities}`);
        }
        return lines.join('\n');
    };

    // 🌟 Helper: دالة لتحويل نوع التسعير للكلمة الألماني المناسبة في الفاتورة
    const getUnitString = (type) => {
        const units = {
            'per_hour': 'Std.',         // ساعة
            'per_square_meter': 'm²',   // متر مربع
            'per_cubic_meter': 'm³',    // متر مكعب
            'per_quantity': 'Stk.',     // بالقطعة / الكمية (Stück)
            'per_room': 'Zimmer',       // بالغرفة
        };
        return units[type] || ''; // لو flat_rate أو max_price هترجع فاضية
    };

    const items = [];
    
    dbOrder.orderServices?.forEach(srv => {
        // --- 1. هندلة الخدمة الأساسية ---
        const srvType = srv.pricing_type;
        const srvUnit = getUnitString(srvType);
        
        // حساب الكمية/الجهد بناءً على نوع التسعير
        let srvQtyStr = "1";
        if (srvType === 'flat_rate') {
            srvQtyStr = "Pauschal"; // (مقطوعية / ثابت)
        } else {
            const minU = srv.min_units || 0;
            const maxU = srv.max_units || 0;
            if (minU !== maxU && maxU > 0) {
                srvQtyStr = `${minU} - ${maxU} ${srvUnit}`.trim(); // رينج
            } else if (minU > 0) {
                srvQtyStr = `${minU} ${srvUnit}`.trim(); // رقم ثابت بوحدة
            } else {
                srvQtyStr = "---";
            }
        }

        const isSrvFlat = srvType === 'flat_rate';
        let srvMinTotal = isSrvFlat ? parseFloat(srv.fixed_price || 0) : parseFloat(srv.min_total_price || srv.fixed_price || 0);
        let srvMaxTotal = isSrvFlat ? parseFloat(srv.fixed_price || 0) : parseFloat(srv.max_total_price || srv.fixed_price || 0);
        const srvUnitPrice = isSrvFlat ? parseFloat(srv.fixed_price || 0) : parseFloat(srv.price_per_unit || 0);

        // --- 2. هندلة الإضافات ---
        let additionsMinTotal = 0;
        let additionsMaxTotal = 0;
        const additionItems = [];

        srv.additions?.forEach(add => {
            const addType = add.pricing_type;
            const addUnit = getUnitString(addType);
            
            let addQtyStr = "1";
            if (addType === 'flat_rate') {
                addQtyStr = "Pauschal";
            } else {
                const minU = add.min_units || 0;
                const maxU = add.max_units || 0;
                if (minU !== maxU && maxU > 0) {
                    addQtyStr = `${minU} - ${maxU} ${addUnit}`.trim();
                } else if (minU > 0) {
                    addQtyStr = `${minU} ${addUnit}`.trim();
                } else {
                    addQtyStr = "---";
                }
            }

            const isAddFlat = addType === 'flat_rate';
            const addMinTotal = isAddFlat ? parseFloat(add.fixed_price || 0) : parseFloat(add.min_total_price || add.fixed_price || 0);
            const addMaxTotal = isAddFlat ? parseFloat(add.fixed_price || 0) : parseFloat(add.max_total_price || add.fixed_price || 0);
            const addUnitPrice = isAddFlat ? parseFloat(add.fixed_price || 0) : parseFloat(add.price_per_unit || 0);

            additionsMinTotal += addMinTotal;
            additionsMaxTotal += addMaxTotal;

            const addTotalRange = (addMinTotal !== addMaxTotal)
                ? `${addMinTotal.toFixed(2)} - ${addMaxTotal.toFixed(2)} CHF`
                : `${addMaxTotal.toFixed(2)} CHF`;

            additionItems.push({
                desc: `+ ${add.Addition?.name || "Zusatzleistung"}`,
                qty: addQtyStr,
                price: `${addUnitPrice.toFixed(2)} CHF`,
                total: addTotalRange
            });
        });

        // --- 3. حساب السعر الصافي للخدمة ودمجهم ---
        const baseMinPrice = Math.max(0, srvMinTotal - additionsMinTotal);
        const baseMaxPrice = Math.max(0, srvMaxTotal - additionsMaxTotal);

        const srvTotalRange = (baseMinPrice !== baseMaxPrice)
            ? `${baseMinPrice.toFixed(2)} - ${baseMaxPrice.toFixed(2)} CHF`
            : `${baseMaxPrice.toFixed(2)} CHF`;

        items.push({
            desc: srv.service?.name || "Service",
            qty: srvQtyStr,
            price: `${srvUnitPrice.toFixed(2)} CHF`,
            total: srvTotalRange
        });

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
        totalRange: (parseFloat(dbOrder.min_total_price || 0) !== parseFloat(dbOrder.max_total_price || 0))
            ? `${parseFloat(dbOrder.min_total_price || 0).toFixed(2)} - ${parseFloat(dbOrder.max_total_price || 0).toFixed(2)} CHF`
            : `${parseFloat(dbOrder.max_total_price || dbOrder.fixed_price || 0).toFixed(2)} CHF`,
        maxPrice: `${parseFloat(dbOrder.max_total_price || dbOrder.fixed_price || 0).toFixed(2)} CHF`
    };
};