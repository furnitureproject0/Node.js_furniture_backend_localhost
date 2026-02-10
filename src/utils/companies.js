import { Company, Service } from '../models/index.js';

export const findCompaniesProvidingService = async (serviceId) => {
    return Company.findAll({
        attributes: ['id', 'name', 'email', 'address'],
        where: { status: 'active' },
        include: [{
            model: Service,
            as: 'services',
            where: { id: serviceId },
            attributes: []
        }]
    });
};


