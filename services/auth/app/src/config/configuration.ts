import { parse } from "path";
import { Config } from "./types/config.types";
import { readFileSync, readSync } from "fs";
import ms from "ms";

export default () : Config => {
	return {
		app: {
			nodeEnv: process.env.NODE_ENV!,
			port: parseInt(process.env.SERVICE_PORT!)
		},
		jwt: {
			privateKey: readFileSync(process.env.JWT_PRIVATE_KEY_PATH!, 'utf8'), 
			publicKey: readFileSync(process.env.JWT_PUBLIC_KEY_PATH!, 'utf8'),
			duration: process.env.EXPIRATION_DURATION as ms.StringValue
		},
		database : {
			database: process.env.POSTGRES_DB!,
			port: parseInt(process.env.POSTGRES_PORT!),
			username: process.env.POSTGRES_USER!,
			host: process.env.POSTGRES_HOST!,
			password: readFileSync(process.env.POSTGRES_PASSWORD_FILE!, 'utf8')
		},
		google: {
			clientId: process.env.CLIENT_ID!,
			clientSecret: readFileSync(process.env.CLIENT_SECRET_FILE!, 'utf8')!,
			callbackUrl: process.env.CALLBACK_URL!,
			scope: process.env.SCOPE?.trim().split(',')!
		},
		mailer: {
			host: process.env.MAILER_HOST!,
			port: parseInt(process.env.MAILER_PORT!),
			user: process.env.MAILER_USER!,
			pass: readFileSync(process.env.MAILER_PASS_FILE!, 'utf8')
		}
	}
}