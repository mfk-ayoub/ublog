import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthDTO } from './dto/auth.dto';
import { Auth } from './entities/auth.entity';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthResponseDTO } from './dto/auth-response.dto';
import * as argon2 from 'argon2';
import { PasswordUpdateDTO } from './dto/password-update.dto';
import { NotFoundError } from 'rxjs';
import { MailerService } from '@nestjs-modules/mailer';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { randomBytes } from 'crypto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { ValidateTokenDTO } from './dto/token.dto';
var generator = require('generate-password');


@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		@InjectRepository(Auth)
		private authRepository: Repository<Auth>,
		private mailerService: MailerService
	) { }


	async createTestUsers() {
		const email = "example@mail.ma";

		const check = await this.authRepository.findOne({
			where: {
				email
			},
		});

		console.log(check);

		if (check)
			throw new ConflictException("Test user already exists");

		const auth = this.authRepository.create({
			email,
			password_hash: await argon2.hash("Wifi@1337++@"),
			username: 'example'
		});
		return await this.authRepository.save(auth);

	}


	async validateGoogleUser(email: string): Promise<any> {

		console.log("email:", email);
		const auth = await this.authRepository.findOne({
			where: {
				email
			}
		});
		if (auth) {
			const { password_hash, ...result } = auth;
			return result;
		}

		const randomPassword = generator.generate({
			length: 24,
			numbers: true,
			symbols: true,
			lowercase: true,
			uppercase: true,
			strict: true
		});
		console.log("GOOOOOGLE!");
		console.log("GOOOOOGLE!");
		console.log("GOOOOOGLE!");
		const hashedPassword = await argon2.hash(randomPassword);
		const [username] = email.split('@');
		const newAuth = this.authRepository.create({
			email,
			password_hash: hashedPassword,
			username
		});
		const response = await this.authRepository.save(newAuth);
		const { password_hash, ...res } = response;
		return res; // TODO is this really whats should be returned?
	}

	async validateUser(authDTO: AuthDTO): Promise<any> {
		const { email, password } = authDTO;

		const auth = await this.authRepository.findOne({
			where: {
				email
			},
		});

		if (!auth)
			return null;

		const isPasswordValid = await argon2.verify(auth.password_hash, password)
		if (!isPasswordValid)
			return null;

		if (auth.is_active == false)
			throw new UnauthorizedException('Account is disabled');

		const { password_hash, ...result } = auth;
		return result;
	}

	async login(auth: Auth): Promise<AuthResponseDTO> {
		return this.generateToken(auth);
	}

	async signup(authDTO: AuthDTO): Promise<AuthResponseDTO> {
		const { email, password, username } = authDTO;

		const alreadyExist = await this.authRepository.findOne({
			where: [
				{ email },
				{ username: username }
			]
		})
		if (alreadyExist !== null)
			throw new ConflictException("Email already registered");

		const hashedPassword = await argon2.hash(password);

		const auth = this.authRepository.create({
			email,
			password_hash: hashedPassword,
			username
		});

		await this.authRepository.save(auth);
		console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
		console.log("Created new account:", auth);
		console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");

		await this.mailerService.sendMail({
			to: auth.email,
			subject: 'Welcome!',
			html: "Thank you for choosing us!",
		});

		return this.generateToken(auth);
	}

	async getNewToken() {
		
	}

	async generateToken(auth: Auth): Promise<AuthResponseDTO> {
		const payload = {
			id: auth.id,
			email: auth.email,
			username: auth.username,
		};

		const accessToken = await this.jwtService.signAsync(payload);

		return {
			id: auth.id,
			username: auth.username,
			accessToken
		}
	}

	async findByEmail(email: string): Promise<Auth | null> {
		const auth: Auth = await this.authRepository.findOne({
			where: {
				email
			},
			select: ["id", "created_at", "updated_at", 'is_active']
		}) as Auth;

		if (!auth)
			return null;

		return auth;
	}

	async chanegPassword(passwordUpdateDTO: PasswordUpdateDTO) {
		const { password, newPassword, email } = passwordUpdateDTO;

		const auth: Auth = await this.authRepository.findOne({
			where: {
				email
			}
		}) as Auth;

		if (!auth)
			throw new NotFoundException("User not found");

		const passwordsMatch: boolean = await argon2.verify(auth.password_hash, password);
		if (!passwordsMatch)
			throw new UnauthorizedException("Password does not match the one stored!");

		const passwordHash = await argon2.hash(newPassword);
		auth.password_hash = passwordHash;

		await this.authRepository.save(auth);
		return "Updated!"
	}

	async forgotPassword(forgotPasswordDTO: ForgotPasswordDTO): Promise<string> {
		const { email } = forgotPasswordDTO;
		const user = await this.authRepository.findOne({
			where: {
				email
			}
		});

		if (!user)
			return "A password reset link has been sent.!";

		const token = randomBytes(128).toString('hex');
		const expiry = new Date(Date.now() + 10 * 60 * 1000);

		user.password_reset_token_expiration_date = expiry;
		user.password_reset_token = token;
		await this.authRepository.save(user);

		await this.mailerService.sendMail({
			to: user.email,
			subject: 'Password Reset Request',
			html: token,
		});
		// <a href="${resetUrl}">Reset Password</a>

		return "A password reset link has been sent.!";
	}

	async resetPassword(resetPasswordDTO: ResetPasswordDTO): Promise<string> {
		const { token, newPassword } = resetPasswordDTO;
		const auth = await this.authRepository.findOne({
			where: {
				password_reset_token: token,
				password_reset_token_expiration_date: MoreThan(new Date()),
			}
		});

		if (!auth)
			return "Invalid or expired password reset token.";

		const passwordHash = await argon2.hash(newPassword);
		auth.password_hash = passwordHash;
		auth.password_reset_token = null;
		auth.password_reset_token_expiration_date = null;

		this.authRepository.save(auth);

		await this.mailerService.sendMail({
			to: auth.email,
			subject: 'Password has been reset',
			html: "We would like to inform you that a the password associated with your account has been successfully reset.",
		});

		return "Password Updated";
	}

	async validateResetToken(validateTokenDto: ValidateTokenDTO): Promise<{ valid: boolean }> {
		const { token } = validateTokenDto;

		const auth = await this.authRepository.findOne({
			where: {
				password_reset_token: token,
				password_reset_token_expiration_date: MoreThan(new Date()),
			},
		});

		return { valid: !!auth };
	}
}
