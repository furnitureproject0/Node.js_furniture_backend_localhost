import { Vehicle, Service, ServiceAddition } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize';

/**
 * Validate that all provided vehicles exist and return their instances
 * @param {*} vehicles - Array of vehicle objects with at least an id property (e.g., [{ id: 1 }, { id: 2 }])
 * @param {*} transaction - Sequelize transaction object for consistent reads
 * @returns Found vehicles
 */
export const validateAndGetVehicles = async (vehicles, transaction) => {
    if (!vehicles || vehicles.length === 0) {
        throw new AppError('Vehicles array is required and cannot be empty', 400);
    }
    
    const vehicleIds = vehicles.map(v => v.id);
    if (vehicleIds.some(id => !id || typeof id !== 'number')) {
        throw new AppError('Each vehicle must have an id', 400);
    }
    
    const foundVehicles = await Vehicle.findAll({
        where: {id: vehicleIds},
        attributes: ['id'],
        transaction
    });

    const foundVehicleIds = foundVehicles.map(v => v.id);
    const missingVehicleIds = vehicleIds.filter(id => !foundVehicleIds.includes(id));
    
    if (missingVehicleIds.length > 0) {
        throw new AppError(`The following vehicles were not found: ${missingVehicleIds.join(', ')}`, 404);
    }
    
    return foundVehicles;
};


/**
 * Validate that all provided services & its additions exist and return their instances
 * @param {*} services - Array of service objects with service_id and additions [
 *  {
 *      "service_id": 1,
 *      "additions": [
 *          {
 *              "addition_id": 1 
 *          }
 *      ]
 *  }
 * ]
 * @param {*} transaction - Sequelize transaction object for consistent reads
 * @throws {AppError} If validation fails
 */

export const validateServicesAndAdditions = async (services, transaction) => {
    if (!services || services.length === 0) {
        throw new AppError('Services array is required and cannot be empty', 400);
    };
    
    const serviceIds = services.map(s => s.service_id);
    if (serviceIds.some(id => !id || typeof id !== 'number')) {
        throw new AppError('All service IDs must be valid numbers', 400);
    }

    const validServices = await Service.findAll({
        where: { id: serviceIds },
        attributes: ['id'],
        transaction
    });

    if (validServices.length !== serviceIds.length) {
        const foundIds = validServices.map(s => s.id);
        const invalidIds = serviceIds.filter(id => !foundIds.includes(id));
        throw new AppError(`Invalid service IDs: ${invalidIds.join(', ')}`, 400);
    }

    for (const { service_id, additions } of services) {
        if (!additions?.length) continue;

        const invalidStructure = additions.some(add => !add.addition_id || typeof add.addition_id !== 'number');
        if (invalidStructure) {
            throw new AppError(`Invalid addition structure for service ${service_id}. Each addition must have an addition_id`, 400);
        }

        const additionIds = additions.map(add => add.addition_id);

        const validLinks = await ServiceAddition.findAll({
            where: {
                service_Id: service_id,
                addition_id: {
                    [Op.in]: additionIds
                }
            },
            attributes: ['addition_Id'],
            transaction
        });

        if (validLinks.length > 0) {
            console.log("Actual Keys in Row:", Object.keys(validLinks[0]));
        }

        const validAdditionIds = validLinks.map(link => {
            const plainObject = link.get ? link.get({ plain: true }) : link;
            return plainObject.addition_id || plainObject.addition_Id;
        });
        const invalidAdditionIds = additionIds.filter(id => !validAdditionIds.includes(id));

        if (invalidAdditionIds.length > 0) {
            throw new AppError(`Invalid addition IDs for service ${service_id}: ${invalidAdditionIds.join(', ')}`, 400);
        }
    }

    // Validate that custom additions have notes
    // const customAdditions = additions.filter(add => add.addition_id === CUSTOM_ADDITION_ID);
    // const customAdditionsWithoutNotes = customAdditions.some(add => !add.note);
    // if (customAdditionsWithoutNotes) {
    //     throw new AppError(
    //         `Custom additions for service ${service_id} must include a note`,
    //         400
    //     );
    // }
};