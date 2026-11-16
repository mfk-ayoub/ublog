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

export interface Config {
	database: DatabaseConfig;
	app: AppConfig;
}