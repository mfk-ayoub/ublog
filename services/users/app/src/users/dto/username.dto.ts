import {
	IsString,
	IsOptional,
	IsPhoneNumber,
	MaxLength,
	Matches,
	MinLength,
} from 'class-validator';

export class UsernameParamDto {
	@Matches(/^[a-zA-Z0-9]{3,25}$/)
	@IsString()
	@MinLength(2)
	username: string;

}
