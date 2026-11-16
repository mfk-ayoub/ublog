import { Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { AuthService } from "../auth.service";

export class GoogleStrategy extends PassportStrategy(Strategy) {
	constructor (
		@Inject(ConfigService)
		configService: ConfigService,
		@Inject(AuthService)
		private authService: AuthService
	) {
		super({
			clientID: configService.getOrThrow("google.clientId"),
			clientSecret: configService.getOrThrow("google.clientSecret"),
			callbackURL: configService.getOrThrow("google.callbackUrl"),
			scope: configService.getOrThrow("google.scope")
		});
	};

	async validate(accessToken: string, refreshToken: string, profile: any) {
		const email  = profile.emails[0].value;
		console.log(profile.emails[0]);
		console.log(profile);
		return this.authService.validateGoogleUser(email);
	}
}
