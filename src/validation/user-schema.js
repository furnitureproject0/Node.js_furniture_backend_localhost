import Joi from "joi";
import { name, birthdate, password, email, phones } from "./global-schemas.js";

export const userBaseSchema = Joi.object({
    email,
    phones,
    name,
    password,
    birthdate,
})