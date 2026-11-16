import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { readFileSync } from 'fs';
import { UsersController } from './controllers/users.controller';
import { AuthController } from './controllers/auth.controller';
import { ArticlesController } from './controllers/articles.controller';
import { AuthGuard } from './guards/jwt.guard';
import { ProxyService } from './services/proxy.service';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		HttpModule,
		JwtModule.register({
			secret: readFileSync(process.env.JWT_PUBLIC_KEY_PATH!, 'utf8'),
			signOptions: { expiresIn: '7d' },
		}),
	],
	controllers: [AppController, UsersController, AuthController, ArticlesController],
	providers: [AppService, ProxyService, AuthGuard, HttpModule],
})
export class AppModule { }
