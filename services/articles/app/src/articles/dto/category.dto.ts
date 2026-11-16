import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CategoryDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(1)
	@MaxLength(64)
	@Matches(/^[a-zA-Z0-9 ]{1,64}$/)
	name: string
}