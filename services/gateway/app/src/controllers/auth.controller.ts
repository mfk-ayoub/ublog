import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, ForbiddenException, Res, StreamableFile, MaxFileSizeValidator, FileTypeValidator, ParseFilePipe, UploadedFile, UseInterceptors, BadRequestException, Patch, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { ProxyService } from '../services/proxy.service';
import { AuthGuard } from 'src/guards/jwt.guard';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import FormData from 'form-data';
import { PasswordUpdateDTO } from 'src/dto/password-update.dto';
import type { Response as ExpressResponse, Request as ExpressRequest } from 'express';

@Controller('auth')
export class AuthController {
	constructor(private proxyService: ProxyService,
		private httpService: HttpService
	) { }

	// Public routes - no auth needed
	// @Post('signup')
	// async signup(@Body() body: any) {
	// 	return this.proxyService.forwardRequest('auth', '/auth/signup', 'POST', body);
	// }

	// @Post('login')
	// async login(@Body() body: any) {
	// 	return this.proxyService.forwardRequest('auth', '/auth/login', 'POST', body);
	// }

	// @Post('forgot-password')
	// async forgotPassword(@Body() body: any) {
	// 	return this.proxyService.forwardRequest('auth', '/auth/forgot-password', 'POST', body);
	// }

	// @Post('reset-password')
	// async resetPassword(@Body() body: any) {
	// 	return this.proxyService.forwardRequest('auth', '/auth/reset-password', 'POST', body);
	// }

	// @UseGuards(AuthGuard)
	// @Post('password/update')
	// async updatePassword(@Body() body: any, @Req() req: any) {
	// 	return this.proxyService.forwardRequest(
	// 		'auth',
	// 		'/auth/password/update',
	// 		'POST',
	// 		body,
	// 		{ 'x-user-id': req.user.id },
	// 	);
	// }


	@UseGuards(AuthGuard)
	@Post('password')
	async changePassword(
		@Body() passwordUpdateDTO: PasswordUpdateDTO,
		@Req() req: any
	) {
		return this.proxyService.forwardRequest(
			'auth',
			'/auth/password/update',
			'POST',
			{ ...passwordUpdateDTO, email: req.user.email }
		);
	}


	@Post("signup") // signup in both auth and users!!!!!!
	async signup(@Req() req: any) {
		const { email, password, username, firstName, lastName } = req.body;

		const authResponse = await this.proxyService.forwardRequest(
			'auth',
			req.originalUrl,
			'POST',
			{
				email,
				username,
				password
			}
		);

		if (!authResponse)
			throw new InternalServerErrorException('something went wrong when creating new account');

		const body = {
			username: authResponse.username,
			firstName,
			lastName,
			bio: "",
			authId: authResponse.id,
		}

		console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
		console.log('auth created');
		console.log("authResponse:", authResponse);
		console.log("body for users service:", body);
		console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

		const usersResponse = await this.proxyService.forwardRequest(
			'users',
			'/users/create',
			'POST',
			body

		)
		return authResponse;
	}


	@Post('login')
	async login(@Req() req: any, @Res({ passthrough: true }) res: any) {
		const authResponse = await this.proxyService.forwardRequest(
			'auth',
			req.originalUrl,
			'POST',
			{ ...req.body }
		);

		res.cookie('Authorization', `Bearer ${authResponse.accessToken}`, {
			// httpOnly: true,
			// secure: true, // TODO ???
			sameSite: 'lax',
			maxAge: 1000 * 60 * 60,
			path: '/',
		});

		return authResponse;
	}

	// @Get('google/login')
	// async google(@Req() req: any) {
	// 	const auth =  this.proxyService.forwardRequest(
	// 		'auth',
	// 		req.originalUrl,
	// 		'GET',
	// 		{ ...req.body }
	// 	);

	// 	console.log(auth);
	// 	return auth;
	// }
	// @Get('google/login')
	// async googleLogin(@Res() res: Response) {
	// 	try {
	// 		const response = await firstValueFrom(
	// 			this.httpService.get(
	// 				'http://auth-service:3001/auth/google/login',
	// 				{
	// 					maxRedirects: 0,
	// 					validateStatus: (status) => status === 302,
	// 				}
	// 			)
	// 		);

	// 		// Rewrite the redirect URL
	// 		let location = response.headers['location'];
	// 		// Change callback URL from auth-service to gateway
	// 		location = location.replace(
	// 			'http://auth-service:3001',
	// 			'http://gateway:8080'
	// 		);

	// 		// Forward cookies
	// 		const cookies = response.headers['set-cookie'];
	// 		if (cookies) {
	// 			res.setHeader('Set-Cookie', cookies);
	// 		}

	// 		// Redirect the browser
	// 		res.redirect(location);
	// 	} catch (error) {
	// 		throw error;
	// 	}
	// }

	// @Post('forgot-password')
	// async forgotPassword(@Req() req: any) {
	// 	return this.proxyService.forwardRequest(
	// 		'auth',
	// 		req.originalUrl,
	// 		'POST',
	// 		{ ...req.body }
	// 	);
	// }

	@Post('reset-password')
	async resetPassword(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'auth',
			req.originalUrl,
			'POST',
			{ ...req.body }
		);
	}




	@Get('google/login')
	async googleLogin(@Res() res: ExpressResponse) {
		try {
			const response = await firstValueFrom(
				this.httpService.get(
					`${this.proxyService.serviceUrls.auth}/auth/google/login`,
					{
						maxRedirects: 0,
						validateStatus: (status) => status >= 200 && status < 400,
					}
				)
			);

			let location = response.headers['location'];

			if (!location) {
				throw new InternalServerErrorException('No redirect location received');
			}

			const cookies = response.headers['set-cookie'];
			if (cookies) {
				cookies.forEach(cookie => {
					res.setHeader('Set-Cookie', cookie);
				});
			}

			return res.redirect(HttpStatus.FOUND, location);

		} catch (error: any) {
			console.error('Google login error:', error.message);
			throw new InternalServerErrorException('Failed to initiate Google login');
		}
	}

	@Get('google/redirect')
	async googleRedirect(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
		try {
			const queryString = new URLSearchParams(req.query as any).toString();
			const callbackUrl = `/auth/google/redirect?${queryString}`;

			const cookieHeader = req.headers.cookie || '';

			const response = await firstValueFrom(
				this.httpService.get(
					`${this.proxyService.serviceUrls.auth}${callbackUrl}`,
					{
						headers: {
							Cookie: cookieHeader,
						},
						maxRedirects: 0,
						validateStatus: (status) => status >= 200 && status < 400,
					}
				)
			);

			const cookies = response.headers['set-cookie'];
			if (cookies) {
				cookies.forEach(cookie => {
					res.setHeader('Set-Cookie', cookie);
				});
			}

			return res.json(response.data);

		} catch (error: any) {
			console.error('Google redirect error:', error.response?.data || error.message);

			if (error.response?.status === 401) {
				return res.status(401).json({
					message: 'Google authentication failed',
					error: error.response.data
				});
			}

			throw new InternalServerErrorException('Failed to complete Google authentication');
		}
	}

}