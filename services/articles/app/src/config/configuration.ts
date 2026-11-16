import { readFileSync } from "fs";
import { Config } from "./types/config.types";

export default () : Config => {
	return {
		app: {
			nodeEnv: process.env.NODE_ENV!,
			port: parseInt(process.env.SERVICE_PORT!)
		},
		database : {
			database: process.env.POSTGRES_DB!,
			port: parseInt(process.env.POSTGRES_PORT!),
			username: process.env.POSTGRES_USER!,
			host: process.env.POSTGRES_HOST!,
			password: readFileSync(process.env.POSTGRES_PASSWORD_FILE!, 'utf8')
		}
	}
}