import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser'

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// app.enableCors(); // TODO check wach ana m7tajha
	app.use(cookieParser());

	app.useGlobalPipes(new ValidationPipe({
		transform: true,
		whitelist: true,
		forbidNonWhitelisted: true,
		disableErrorMessages: process.env.NODE_ENV !== "development"
	}));

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
