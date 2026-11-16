import Joi from "joi";

export const appValidationSchema = {
	SERVICE_PORT: Joi.number().required(),
	NODE_ENV: Joi.string().required().default("production") // "development" ?
}