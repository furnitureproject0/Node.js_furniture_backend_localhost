// services/VehicleSearchService.js
import { Vehicle, Company } from '../../models/index.js';
import { Op } from 'sequelize';
import AppError from '../../utils/AppError.js';

/**
 * Search vehicles by a single field (name, model, plate_number, company name)
 * @param {string} search - search text
 * @param {Object} pagination - { page, limit }
 * @param {Object} options - { transaction }
 * @returns {Object} vehicles + pagination info
 */
export const getSearchedVehicles = async (search, pagination = {}, options = {}) => {
    const { transaction } = options;

    // if (!search || search.trim() === '') {
    //     throw new AppError('Search query cannot be empty', 400);
    // }

    const pageNumber = parseInt(pagination.page) || 1;
    const limitNumber = parseInt(pagination.limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    // Build where clause for all fields
    const whereClause = {};

    if (search && search.trim() !== '') {
        whereClause[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { model: { [Op.like]: `%${search}%` } },
            { license_plate: { [Op.like]: `%${search}%` } },
            { '$company.name$': { [Op.like]: `%${search}%` } },
        ];
    }

    const vehicles = await Vehicle.findAndCountAll({
        where: whereClause,
        include: [
            {
                association: 'company',
                attributes: ['id', 'name'],
            }
        ],
        limit: limitNumber,
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true,
        ...(transaction && { transaction }),
    });

    return {
        vehicles: vehicles.rows,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(vehicles.count / limitNumber),
            totalItems: vehicles.count
        }
    };
};