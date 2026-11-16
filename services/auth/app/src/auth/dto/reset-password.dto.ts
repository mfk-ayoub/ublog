import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDTO {
	@IsString()
	@IsNotEmpty()
	token: string;

	@IsString()
	@IsNotEmpty()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()-_+=])(?!.*\s).{8,}$/, {
		message: 'Password must at least contain 1 number, 1 lower case character, 1 upper case character, 1 special character and be of length +8'
	})
	newPassword: string;
}
