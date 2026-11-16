import { Controller, Patch, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, BadRequestException, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as path from 'path';
import { createReadStream } from 'fs';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsernameParamDto } from './dto/username.dto';


@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) { }

	@Get("test-users")
	createTestUser() {
		return this.usersService.createTestUsers();
	}

	@Post('update/:username')
	editUserData(
		@Body() updateUserDto: UpdateUserDto,
		@Param() username: UsernameParamDto)
	{
		return this.usersService.update(updateUserDto, username.username);
	}

	@Post("all")
	all(): Promise<any> {
		return this.usersService.getAllUsers();
	}

	@Post('following/all')
	getAllFollowings() {
		return this.usersService.getAllFollows();
	}

	@Post('follow/:username')
	followUser(@Param('username') username: string, @Body('fromUser') fromUser: string) {
		return this.usersService.followUser(fromUser, username);
	}

	@Post("create")
	create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
		return this.usersService.create(createUserDto);
	}

	@Get('id/:id')
	findOneByeId(@Param('id') id: string): Promise<UserResponseDto> {
		return this.usersService.findOneById(id);
	}

	@Get(':username')
	findOneByUsername(@Param('username') username: string): Promise<UserResponseDto> {
		return this.usersService.findOneByUsername(username);
	}

	@Post(':username/picture')
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
	async uploadProfilePicture(
		@Param('username') username: string,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
					new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
				],
			}),
		)
		file: Express.Multer.File,
	): Promise<UserResponseDto> {
		console.log(file);
		const filename = await this.usersService.saveImageToDisk(file);
		return this.usersService.updateProfilePicture(username, filename);
	}

	@Get(':username/picture')
	async getProfilePicture(
		@Param('username') username: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<StreamableFile> {
		const user = await this.usersService.findOneByUsername(username);

		if (!user.profilePicture) {
			throw new BadRequestException('User does not have a profile picture');
		}

		const filePath = path.join(process.cwd(), 'uploads', user.profilePicture);
		const file = createReadStream(filePath);
		const ext = path.extname(user.profilePicture).toLowerCase();

		const mimeTypes = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
		};

		res.set({
			'Content-Type': mimeTypes[ext] || 'application/octet-stream',
			'Content-Disposition': `inline; filename="${user.profilePicture}"`,
		});

		return new StreamableFile(file);
	}

	@Delete(':username/picture')
	deleteProfilePicture(@Param('username') username: string): Promise<UserResponseDto> {
		return this.usersService.updateProfilePicture(username, null);
	}
}