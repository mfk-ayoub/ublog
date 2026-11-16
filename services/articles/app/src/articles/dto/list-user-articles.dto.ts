import { IsString, Matches, MaxLength } from "class-validator";

export class ListUserArticlesDto {
		@IsString()
		@MaxLength(255)
		@Matches(/^[a-zA-Z0-9]{3,25}$/)
		author?: string;
}