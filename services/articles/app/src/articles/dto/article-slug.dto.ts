import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ArticleSlugDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Invalid slug format',
  })
  slug: string;
}

