import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsPhoneNumber,
	MaxLength,
	Matches,
	MinLength,
} from 'class-validator';

export class UpdateUserDto {
	@IsString()
	@MinLength(2)
	@IsNotEmpty()
	firstName: string;
	
	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	lastName: string;
	
	// @Matches(/^[a-zA-Z0-9]{3,25}$/)
	// @IsNotEmpty()
	// @IsString()
	// @MinLength(2)
	// username: string;

	// @IsPhoneNumber()
	// @IsNotEmpty()
	// phoneNumber: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	bio: string;
}