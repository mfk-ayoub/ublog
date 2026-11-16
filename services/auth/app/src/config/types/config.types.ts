import ms from "ms";

export interface AppConfig {
	nodeEnv: string;
	port: number;
}

export interface DatabaseConfig {
	database: string;
	username: string;
	port: number;
	host: string;
	password: string;
}

export interface JwtConfig {
	publicKey: string;
	privateKey: string;
	duration: ms.StringValue;
}

export interface GoogleOAuth2Config {
	clientId: string,
	clientSecret: string,
	callbackUrl: string,
	scope: string[],
}

export interface MailerConfig {
	host: string;
	port: number;
	user: string;
	pass: string;
}

export interface Config {
	app: AppConfig;
	jwt: JwtConfig;
	database: DatabaseConfig;
	google: GoogleOAuth2Config;
	mailer: MailerConfig
}