import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import path from 'path';
import * as fs from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';
import { Following } from './entities/following.entity';
import { UpdateUserDto } from './dto/update-user.dto';


@Injectable()
export class UsersService {
	private readonly uploadDir = path.join(process.cwd(), 'uploads');

	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,


		@InjectRepository(Following)
		private followingRepository: Repository<Following>,
	) { }

	async createTestUsers() {
		const username = "example";

		const check = await this.usersRepository.findOne({
			where: {
				username
			},
		});

		console.log(check);

		if (check)
			throw new ConflictException("Test user already exists");

		const auth = this.usersRepository.create({
			bio: "Dummy bio",
			firstName: "Example",
			lastName: "Test",
			authId: "e5bd04ad-244b-4cd5-bade-2ee056baee13",
			username: 'example'
		});
		return await this.usersRepository.save(auth);
	}



	async followUser(fromUser: string, username: string): Promise<any> {
		const users = await this.usersRepository.find({
			where: {
				username: In([fromUser, username])
			}
		})

		if (!users || users.length != 2)
			throw new NotFoundException('either the follower or the followee does not exist');

		const follow = this.followingRepository.create({
			followedUsername: username,
			username: fromUser
		})
		return this.followingRepository.save(follow);
	}

	async getAllFollows(): Promise<any> {
		return this.followingRepository.find();
	}

	async getAllUsers(): Promise<any> {
		return this.usersRepository.find();
	}

	async update(updateUserDto: UpdateUserDto, username: string): Promise<UserResponseDto> {

		console.log(username)
		console.log(updateUserDto)
		const user = await this.usersRepository.findOne({
			where: {
				username
			}
		});

		if (!user)
			throw new NotFoundException('User not found');

		// if (username != updateUserDto.username) {
		// 	const checkNewUsername = await this.usersRepository.findOne({
		// 		where: {
		// 			username: updateUserDto.username
		// 		}
		// 	});
		// 	if (checkNewUsername)
		// 		throw new ConflictException('new username is already taken');
		// 	user.username = updateUserDto.username;
		// }

		user.bio = updateUserDto.bio;
		user.firstName = updateUserDto.firstName;
		user.lastName = updateUserDto.lastName;
		
		const savedUser = await this.usersRepository.save(user);
		return new UserResponseDto(savedUser);
	}

	async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {

		const user = this.usersRepository.create(createUserDto);

		const savedUser = await this.usersRepository.save(user);
		return new UserResponseDto(savedUser);
	}

	async findOneById(id: string): Promise<UserResponseDto> {
		const user = await this.usersRepository.findOne({ where: { authId: id } });

		if (!user) {
			throw new NotFoundException(`User with ID '${id}' not found`);
		}

		return new UserResponseDto(user);
	}

	async findOneByUsername(username: string): Promise<UserResponseDto> {
		const user = await this.usersRepository.findOne({ where: { username } });

		if (!user) {
			throw new NotFoundException(`User with username '${username}' not found`);
		}

		return new UserResponseDto(user);
	}

	//   async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
	//     const user = await this.usersRepository.findOne({ where: { id } });

	//     if (!user) {
	//       throw new NotFoundException(`User with ID ${id} not found`);
	//     }

	//     Object.assign(user, updateUserDto);
	//     const updatedUser = await this.usersRepository.save(user);

	//     return new UserResponseDto(updatedUser);
	//   }

	async updateProfilePicture(username: string, filename: string | null): Promise<UserResponseDto> {
		const user = await this.usersRepository.findOne({ where: { username } });

		if (!user) {
			throw new NotFoundException(`User with ID ${username} not found`);
		}

		if (user.profilePicture) {
			const oldFilePath = path.join(process.cwd(), 'uploads', user.username);
			try {
				await fs.unlink(oldFilePath);
			} catch (error) { }
		}

		user.profilePicture = filename;
		const updatedUser = await this.usersRepository.save(user);

		return new UserResponseDto(updatedUser);
	}


	// async remove(id: string): Promise<void> {
	// 	const user = await this.usersRepository.findOne({ where: { id } });

	// 	if (!user) {
	// 		throw new NotFoundException(`User with ID ${id} not found`);
	// 	}

	// 	// Delete profile picture if exists
	// 	if (user.profilePicture) {
	// 		const filePath = path.join(process.cwd(), 'uploads', user.profilePicture);
	// 		try {
	// 			await fs.unlink(filePath);
	// 		} catch (error) {
	// 			// Ignore error if file doesn't exist
	// 		}
	// 	}

	// 	await this.usersRepository.remove(user);
	// }

	async saveImageToDisk(file: Express.Multer.File): Promise<string> {
		if (!file || !file.buffer) {
			throw new InternalServerErrorException('File buffer is missing');
		}

		const detected = await fileTypeFromBuffer(file.buffer);

		if (!detected)
			throw new BadRequestException('Weird file extention');

		const ext = detected.ext ? `.${detected.ext}` : path.extname(file.originalname) || '.jpg';
		const filename = `${uuidv4()}${ext}`;
		const filePath = path.join(this.uploadDir, filename);

		try {
			await fs.mkdir(this.uploadDir, { recursive: true });
			await fs.writeFile(filePath, file.buffer);
		} catch (err) {
			throw new InternalServerErrorException('Failed to save image to disk');
		}

		return filename;
	}

}