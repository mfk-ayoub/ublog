import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ArticleSlugAndAuthorDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	@Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
		message: 'Invalid slug format',
	})
	slug: string;

	@IsString()
	@Matches(/^[a-zA-Z0-9]{3,25}$/, {
		message: 'Author must be 3-25 alphanumeric characters'
	})
	author: string;
}

