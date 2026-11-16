import Joi from "joi";
import { fileExists } from "./helpers.validation";

export const googleOAuth2ValidationSchema = {
	CLIENT_ID: Joi.string().required(),
	CLIENT_SECRET_FILE: fileExists().required(),
	CALLBACK_URL: Joi.string().required(),
	SCOPE: Joi.string().required(),
};