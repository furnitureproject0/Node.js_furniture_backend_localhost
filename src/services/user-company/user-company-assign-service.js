'use strict';

import { UserCompany, User, Company } from '../../models/index.js';
import AppError from '../../utils/AppError.js';

export const assignCompaniesToUserService = async (userId, assignments, options = {}) => {
    const { transaction } = options;

    const user = await User.findByPk(userId, { transaction });
    if (!user) throw new AppError('User not found', 404);

    if (!Array.isArray(assignments) || assignments.length === 0) return [];

    const uniqueAssignmentsMap = new Map();
    for (const assignment of assignments) {
        if (assignment.company_id) {
            const type = assignment.type || 'external';
            const uniqueKey = `${assignment.company_id}-${type}`; 
            uniqueAssignmentsMap.set(uniqueKey, { company_id: assignment.company_id, type });
        }
    }
    const cleanAssignments = Array.from(uniqueAssignmentsMap.values());
    if (cleanAssignments.length === 0) return [];

    const existingUserCompanies = await UserCompany.findAll({
        where: { user_id: userId },
        transaction
    });

    const assignmentsToCreate = cleanAssignments.filter(newAssign => {
        const alreadyExists = existingUserCompanies.some(
            existing => existing.company_id === newAssign.company_id && existing.type === newAssign.type
        );
        return !alreadyExists; 
    });

    if (assignmentsToCreate.length === 0) return [];

    const companyIdsToCreate = [...new Set(assignmentsToCreate.map(a => a.company_id))];
    const verifiedCompanies = await Company.findAll({
        where: { id: companyIdsToCreate },
        transaction
    });

    if (verifiedCompanies.length !== companyIdsToCreate.length) {
        throw new AppError('One or more company IDs do not exist', 404);
    }

    const recordsToCreate = assignmentsToCreate.map(assignment => ({
        user_id: userId,
        company_id: assignment.company_id,
        type: assignment.type
    }));

    const newAssignments = await UserCompany.bulkCreate(recordsToCreate, { transaction });

    return newAssignments;
};