import { Type } from "class-transformer";
import { IsNumber, Max, Min } from "class-validator";

export class PageDto {
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	@Max(100)
	page: number = 1
}