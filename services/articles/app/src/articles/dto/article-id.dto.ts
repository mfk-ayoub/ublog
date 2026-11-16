import { IsNotEmpty, IsUUID } from 'class-validator';

export class ArticleIDDto {
  @IsNotEmpty()
  @IsUUID('4')  // UUID v4 (most common)
  id: string;
}

// Other versions: '3', '4', '5', 'all'