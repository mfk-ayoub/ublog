import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { Auth } from "../entities/auth.entity";
import { getEnabledCategories } from "trace_events";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private authService: AuthService,
		@Inject(ConfigService) configService: ConfigService
	) {
		super({
			algorithms: [ "RS256" ],
			ignoreExpiration: false,
			secretOrKey: configService.getOrThrow("jwt.publicKey"),
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
		})
	}

	async validate(data) {
		const auth : Auth | null= await this.authService.findByEmail(data.email);
		if (!auth) {
			throw new UnauthorizedException('Invalid token');
		}
		const { id, email, is_active, created_at, updated_at } = auth;
		if (!is_active) {
			throw new UnauthorizedException('Account is disabled');
		}

		return {
			id,
			email,
			is_active,
			created_at,
			updated_at
		};
	}
}
