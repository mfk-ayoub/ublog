import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateArticleDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	@Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
		message: 'Invalid slug format',
	})
	slug: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(175)
	@Matches(/^[A-Za-z0-9][A-Za-z0-9\s.,:;!?'"()\-]{1,175}$/)
	title: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(5000)
	body: string
}