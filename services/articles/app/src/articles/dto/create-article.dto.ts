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

export class CreateArticleDto {
	// @IsString()
	// @IsNotEmpty()
	// @Matches(/^[\s\S]{10,50000}$/)
	// @MinLength(250)
	// body: string

	// @IsString()
	// @IsNotEmpty()
	// @MinLength(2)
	// slug: string;

	// @IsString()
	// @IsNotEmpty()
	// @MinLength(2)
	// @Matches(/^[A-Za-z0-9][A-Za-z0-9\s.,:;!?'"()\-]{2,119}$/)
	// title: string;

	@IsString()
	@MaxLength(255)
	@Matches(/^[a-zA-Z0-9]{3,25}$/)
	author?: string;
}