import { MailerModule as NestMailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";

@Module({
	imports: [
		// ConfigModule,
		NestMailerModule.forRootAsync({
			inject: [ ConfigService ],
			useFactory: (configService: ConfigService) => {
				return {
					transport: {
						host: configService.getOrThrow<string>("mailer.host"),
						port: configService.getOrThrow<number>("mailer.port"),
						// service: "gmail",
						auth: {
							user: configService.getOrThrow<string>("mailer.user"),
							pass: configService.getOrThrow<string>("mailer.pass")
						},
						secure: false
					}, 
					defaults: {
						from: '"My App" <no-reply@myapp.com>',
					},
				}
			}
		})
	]
})
export class MailerModule {}