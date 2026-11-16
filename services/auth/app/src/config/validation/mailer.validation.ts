import Joi from "joi";
import { fileExists } from "./helpers.validation";

export const mailerValidationSchema = {
	MAILER_HOST: Joi.string().required(),
	MAILER_PORT: Joi.number().required(),
	MAILER_USER: Joi.string().required(),
	MAILER_PASS_FILE: fileExists().required()
};