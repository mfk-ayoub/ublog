import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private jwtService: JwtService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('No token provided. GATEWAY');
		}

		try {
			const payload = await this.jwtService.verifyAsync(token, {
				publicKey: process.env.JWT_PUBLIC_KEY,
			});

			request['user'] = payload;
			// console.log("Payload: [", payload ,"]")
		} catch (error) {
			throw new UnauthorizedException('Invalid token. GATEWAY');
		}

		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		// 1. Try the Authorization header first
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		if (type === 'Bearer' && token) return token;

		// 2. Fall back to the Authorization cookie (for browser-initiated
		//    requests like <img src="..."> that carry cookies but no header)
		const cookie = request.headers.cookie;
		if (cookie) {
			const match = cookie.split('; ').find((c) => c.startsWith('Authorization='));
			if (match) {
				try {
					const value = decodeURIComponent(match.substring('Authorization='.length));
					const [cType, cToken] = value.split(' ');
					if (cType === 'Bearer' && cToken) return cToken;
				} catch { /* malformed cookie – ignore */ }
			}
		}

		return undefined;
	}
}