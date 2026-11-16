import Joi from "joi";
import { fileExists } from "./helpers.validation";

export const jwtValidationSchema = {
	JWT_PRIVATE_KEY_PATH: fileExists().required(),
	JWT_PUBLIC_KEY_PATH: fileExists().required(),
	EXPIRATION_DURATION: Joi.string().required()
};