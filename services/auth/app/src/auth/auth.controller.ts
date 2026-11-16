import { Body, ConflictException, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDTO } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponseDTO } from './dto/auth-response.dto';
import { GoogleAuthGuard } from './guards/google-oauth-guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordUpdateDTO } from './dto/password-update.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { ResetPasswordDTO } from './dto/reset-password.dto';
import { ValidateTokenDTO } from './dto/token.dto';

@Controller('auth')
export class AuthController {
	constructor (
		private authService: AuthService,
	) 
	{}

	@Get('test-users')
	async createTestUsers() {
		return this.authService.createTestUsers();
	}

	@Post("signup")
	async signup(@Body() authDTO: AuthDTO) {
		return this.authService.signup(authDTO);
	}
	
	@UseGuards(LocalAuthGuard)
	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(@CurrentUser() user): Promise<AuthResponseDTO> {
		return this.authService.generateToken(user);
	}

	@Get('refresh')
	

	@Get('google/login')
	@UseGuards(GoogleAuthGuard)
	googleLogin(){
		return {
			msg: "Google Authentication"
		};
	};

	@Get("google/redirect")
	@UseGuards(GoogleAuthGuard)
	googleRedirect(@CurrentUser() user) {
		if (user)
			return this.authService.generateToken(user)
		return {
			msg: "Sorry! The authentication did not succeed!"
		};
	};

	@Post("password/update")
	// @UseGuards(JwtAuthGuard)
	passwordReset(@Body() passwordUpdateDTO: PasswordUpdateDTO) {
		const { password, newPassword } = passwordUpdateDTO; 
		if (newPassword == password)
			throw new ConflictException("Password and new password should not match!");
		return this.authService.chanegPassword(passwordUpdateDTO);
	}

	@Post('forgot-password')
	@HttpCode(HttpStatus.OK)
	async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDTO ): Promise<{ message: string }> {
		const message = await this.authService.forgotPassword(forgotPasswordDto);
		return {
			message
		};
	};

	@Post('reset-password')
	@HttpCode(HttpStatus.OK)
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO): Promise<{ message: string }> {
		const message = await this.authService.resetPassword(resetPasswordDto);
		return {
			message
		};
	}

	@Get('validate-reset-token')
	async validateResetToken(@Query() validateTokenDto: ValidateTokenDTO): Promise<{ valid: boolean }> {
		return this.authService.validateResetToken(validateTokenDto);
	}
}
