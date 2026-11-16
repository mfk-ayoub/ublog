import { Exclude } from 'class-transformer';

export class ArticleResponseDto {
	body: string | null;
	displayImg: string | null;
	slug: string | null;
	excerpt: string | null;
	title: string | null;
	author: string;

	@Exclude()
	id: string;

	constructor(partial: Partial<ArticleResponseDto>) {
		Object.assign(this, partial);
	}
}




