import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from 'src/config/types/config.types';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			inject: [ ConfigService ],
			useFactory: (configService: ConfigService) => {
				const dbConfig = configService.getOrThrow<DatabaseConfig>('database');
				const nodeEnv = configService.getOrThrow<string>('app.nodeEnv');

				return {
					type: "postgres",
					host: dbConfig.host,
					port: dbConfig.port,
					database: dbConfig.database,
					username: dbConfig.username,
					password: dbConfig.password,
					autoLoadEntities: true,
					synchronize: nodeEnv === "development",
					logging: nodeEnv === 'development',
				}
			} 
		}),
	]
})
export class DatabaseModule {}
