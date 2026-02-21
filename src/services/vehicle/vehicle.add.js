'use strict';

// services/vehicleService.js
import Vehicle from '../models/Vehicle.js';
import AppError from '../utils/AppError.js'; // لو عندك middleware للأخطاء

/**
 * Add a new vehicle
 * @param {Object} data - Vehicle data from request body
 * @returns {Object} Created vehicle
 */
async function addVehicle(data) {
    // تحقق من بعض البيانات الأساسية
    if (!data.name) {
        throw new AppError('Vehicle name is required', 400);
    }

    if (!data.license_plate) {
        throw new AppError('License plate is required', 400);
    }

    // تحقق لو الرقم موجود بالفعل
    const existingVehicle = await Vehicle.findOne({
        where: { license_plate: data.license_plate }
    });
    if (existingVehicle) {
        throw new AppError('License plate already exists', 409);
    }

    // يمكن هنا تضيف أي logic إضافي حسب الـ business
    // مثال: تعديل default values أو تحويل البيانات
    const vehicleData = {
        name: data.name,
        type: data.type || 'truck',
        license_plate: data.license_plate,
        company_id: data.company_id || null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        passenger_seats: data.passenger_seats || 2,
        volume_capacity: data.volume_capacity || null,
        weight_capacity: data.weight_capacity || null,
        height: data.height || null,
        width: data.width || null,
        length: data.length || null,
        status: data.status || 'active',
        image_url: data.image_url || null,
        notes: data.notes || null,
    };

    // إنشاء المركبة
    const vehicle = await Vehicle.create(vehicleData);
    return vehicle;
}

export default { addVehicle };
