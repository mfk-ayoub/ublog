import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import { JwtConfig } from 'src/config/types/config.types';


export const jwtConfig: JwtModuleAsyncOptions = {
	inject: [ ConfigService ],
	global: true,
	useFactory: (configService: ConfigService) => {
		const jwtConfig = configService.getOrThrow<JwtConfig>('jwt');
		
		return {
			privateKey: jwtConfig.privateKey,
			publicKey: jwtConfig.publicKey,
			signOptions: {
				algorithm: 'RS256', 
				expiresIn: jwtConfig.duration
			},
			verifyOptions: {
				algorithms: [ "RS256" ]
			}
		}
	},
} 


