'use strict';

import { UserCompany, User, Company } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { Op } from 'sequelize'; 

export const updateUserCompanyAssignmentsService = async (userId, assignments, options = {}) => {
    const { transaction } = options;

    const user = await User.findByPk(userId, { transaction });
    if (!user) throw new AppError('User not found', 404);

    if (!Array.isArray(assignments)) {
        throw new AppError('Assignments must be an array', 400);
    }

    const uniqueAssignmentsMap = new Map();
    for (const assignment of assignments) {
        if (assignment.company_id) {
            const type = assignment.type || 'external';
            const uniqueKey = `${assignment.company_id}-${type}`; 
            uniqueAssignmentsMap.set(uniqueKey, { company_id: assignment.company_id, type });
        }
    }
    const incomingAssignments = Array.from(uniqueAssignmentsMap.values());
    const incomingKeys = Array.from(uniqueAssignmentsMap.keys()); // مثال: ['1-internal', '2-external']

    const existingUserCompanies = await UserCompany.findAll({
        where: { user_id: userId },
        transaction
    });
    const existingKeys = existingUserCompanies.map(ec => `${ec.company_id}-${ec.type}`);

    const recordsToRemove = existingUserCompanies.filter(
        ec => !incomingKeys.includes(`${ec.company_id}-${ec.type}`)
    );

    const assignmentsToAdd = incomingAssignments.filter(
        ia => !existingKeys.includes(`${ia.company_id}-${ia.type}`)
    );

    if (recordsToRemove.length > 0) {
        const removeConditions = recordsToRemove.map(record => ({
            company_id: record.company_id,
            type: record.type
        }));

        await UserCompany.destroy({
            where: {
                user_id: userId,
                [Op.or]: removeConditions
            },
            transaction
        });
    }

    if (assignmentsToAdd.length > 0) {
        const companyIdsToCreate = [...new Set(assignmentsToAdd.map(a => a.company_id))];
        
        const verifiedCompanies = await Company.findAll({
            where: { id: companyIdsToCreate },
            transaction
        });

        if (verifiedCompanies.length !== companyIdsToCreate.length) {
            throw new AppError('One or more company IDs do not exist', 404);
        }

        const recordsToCreate = assignmentsToAdd.map(assignment => ({
            user_id: userId,
            company_id: assignment.company_id,
            type: assignment.type
        }));

        await UserCompany.bulkCreate(recordsToCreate, { transaction });
    }

    const updatedUserCompanies = await UserCompany.findAll({
        where: { user_id: userId },
        transaction
    });

    return updatedUserCompanies;
};