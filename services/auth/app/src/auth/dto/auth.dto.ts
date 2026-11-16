import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class AuthDTO {
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()-_+=])(?!.*\s).{8,}$/, {
		message: 'Password must at least contain 1 number, 1 lower case character, 1 upper case character, 1 special character and be of length +8'
	})
	password: string

	@IsEmail()
	@IsNotEmpty()
	@MinLength(4)
	email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@Matches(/^[a-zA-Z0-9]{3,25}$/)
	username: string;
};