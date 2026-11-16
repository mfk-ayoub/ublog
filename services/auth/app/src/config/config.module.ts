import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import configuration from "./configuration";
import Joi from "joi";
import { dbValidationSchema } from "./validation/db.validation";
import { jwtValidationSchema } from "./validation/jwt.validation";
import { appValidationSchema } from "./validation/app.validation";
import { googleOAuth2ValidationSchema } from "./validation/google-oauth.validation";
import { mailerValidationSchema } from "./validation/mailer.validation";

@Module({
	imports: [
		NestConfigModule.forRoot({
			isGlobal: true,
			load: [ configuration ],
			validationSchema: Joi.object({
				...dbValidationSchema,
				...jwtValidationSchema,
				...appValidationSchema,
				...googleOAuth2ValidationSchema,
				...mailerValidationSchema
			}),
			validationOptions: {
				abortEarly: true
			}
		})
	]
})
export class ConfigModule {}