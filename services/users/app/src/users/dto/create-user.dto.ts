import {
	IsEmail,
	IsString,
	MinLength,
	IsOptional,
	IsPhoneNumber,
	MaxLength,
	IsNotEmpty,
	Matches,
} from 'class-validator';


export class CreateUserDto {

	@IsString()
	@IsNotEmpty()
	authId: string

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	firstName: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	lastName: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@Matches(/^[a-zA-Z0-9]{3,25}$/)
	username: string;

	@IsString()
	@MaxLength(255)
	bio?: string;
}