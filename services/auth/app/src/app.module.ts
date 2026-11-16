import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './auth/database.module';
import { ConfigModule } from './config/config.module';
import { JwtModule } from './auth/jwt.module';
import { MailerModule } from './auth/mailer.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    DatabaseModule,
    MailerModule,
    AuthModule,
  ],
})
export class AppModule {}
