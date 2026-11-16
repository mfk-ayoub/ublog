import { existsSync } from "fs";
import Joi from "joi"
import { fileExists } from "./helpers.validation";

export const dbValidationSchema = {
	POSTGRES_DB: Joi.string().required(),
	POSTGRES_USER: Joi.string().required(),
	POSTGRES_PORT: Joi.number().required(),
	POSTGRES_PASSWORD_FILE: fileExists().required(),
	POSTGRES_HOST: Joi.string().required()
};