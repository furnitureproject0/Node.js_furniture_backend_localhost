import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Company from "./company.js";
import Service from "./service.js";

const CompanyService = sequelize.define(
    "CompanyService",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Company,
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Service,
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
    },
    {
        tableName: "company_services",
        timestamps: true,
        underscored: true
    }
);

export default CompanyService;
