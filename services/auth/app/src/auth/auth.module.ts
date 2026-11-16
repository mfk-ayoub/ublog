import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google-oauth.strategy';

@Module({
  imports: [ TypeOrmModule.forFeature([Auth]) ],
  controllers: [ AuthController],
  providers: [ AuthService, LocalStrategy, JwtStrategy, GoogleStrategy,],
  exports: [ AuthService ]
})
export class AuthModule {}
