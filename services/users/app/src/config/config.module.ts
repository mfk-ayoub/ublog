import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import configuration from "./configuration";
import Joi from "joi";
import { dbValidationSchema } from "./validation/db.validation";
import { appValidationSchema } from "./validation/app.validation";

@Module({
	imports: [
		NestConfigModule.forRoot({
			isGlobal: true,
			load: [ configuration ],
			validationSchema: Joi.object({
				...dbValidationSchema,
				...appValidationSchema,
			}),
			validationOptions: {
				abortEarly: true
			}
		})
	]
})
export class ConfigModule {}