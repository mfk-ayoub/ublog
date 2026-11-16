import {
	IsString,
	MaxLength,
	Matches,
	IsNotEmpty,
} from 'class-validator';

export class CreateCommentDto {
	@IsString()
	@MaxLength(255)
	@IsNotEmpty()
	content: string

	@IsString()
	@MaxLength(255)
	@Matches(/^[a-zA-Z0-9]{3,25}$/)
	author?: string;
}