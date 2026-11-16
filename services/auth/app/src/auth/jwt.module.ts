import { Module } from "@nestjs/common";
import { JwtModule as NestJwtModule } from "@nestjs/jwt";
import { jwtConfig } from "src/config/jwt.config";

@Module({
	imports: [NestJwtModule.registerAsync(jwtConfig)],
	exports: [NestJwtModule]
})
export class JwtModule {};