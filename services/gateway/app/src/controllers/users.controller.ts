import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, ForbiddenException, Res, StreamableFile, MaxFileSizeValidator, FileTypeValidator, ParseFilePipe, UploadedFile, UseInterceptors, BadRequestException, Patch } from '@nestjs/common';
import { ProxyService } from '../services/proxy.service';
import { AuthGuard } from 'src/guards/jwt.guard';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import FormData from 'form-data';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
	constructor(
		private proxyService: ProxyService,
		private httpService: HttpService,
	) { }


	@Post('following/all')
	async getAllFollows(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'users',
			req.originalUrl,
			'POST'
		)
	}

	@Post("all")
	async getAllUsers(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'users',
			req.originalUrl,
			'POST'
		)
	}

	// @Get(':username')
	@Get(':username')
	async getUser(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'users',
			req.originalUrl,
			'GET',
		);
	}


	// @Get(':username')
	@Delete('picture')
	async deleteUserPic(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'users',
			`/users/${req.user.username}/picture`,
			'DELETE',
		);
	}

	@Post('update')
	async updateUser(@Req() req: any) {
		const userResponse = await this.proxyService.forwardRequest(
			'users',
			req.originalUrl + '/' + req.user.username,
			'POST',
			req.body
		);

		// get new token for this user
		

		return userResponse;
	}



	// @Get(':slug/picture')
	// @Public()
	@Get(':user/picture')
	async getArticlePicture(
		@Req() req: any,
		@Param('user') username: string,
		@Res({ passthrough: true }) res: any
	) {

		const user = await this.proxyService.forwardRequest(
			'users',
			'/users/' + username,
			'GET'
		);

		if (!user.profilePicture)
			return {
				message: 'User has default profile picture'
			}

		const { stream, contentType, contentLength } = await this.proxyService.forwardBinaryRequest(
			'users',
			req.originalUrl,
			'GET'
		);
		res.set({
			'Content-Type': contentType,
			...(contentLength && { 'Content-Length': contentLength }),
		});

		return new StreamableFile(stream);
	};

	// @Post(':username/profile-picture')
	@UseGuards(AuthGuard)
	@Post('/picture')
	@UseInterceptors(
		FileInterceptor('file', {
			storage: memoryStorage(),
			limits: {
				fileSize: 5 * 1024 * 1024,
				fieldNameSize: 75
			},
			fileFilter: (req, file, callback) => {
				if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
					return callback(
						new BadRequestException('Only image files are allowed'),
						false,
					);
				}
				callback(null, true);
			},
		}),
	)
	async uploadArticlePicture(
		@Req() req: any,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
					new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
				],
			}),
		)
		file: Express.Multer.File,
	) {

		const articlesServiceUrl = this.proxyService.serviceUrls.users;

		const formData = new FormData();
		formData.append('file', file.buffer, {
			filename: file.originalname,
			contentType: file.mimetype,
		});

		try {
			const response = await firstValueFrom(
				this.httpService.post(
					`${articlesServiceUrl}/users/${req.user.username}/picture`,
					formData,
					{
						headers: formData.getHeaders(),
					}
				)
			);

			return response.data;
		} catch (error: any) {
			throw error.response.data || error;
		}
	}

}
