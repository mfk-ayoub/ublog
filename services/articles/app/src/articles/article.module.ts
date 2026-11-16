import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Comment } from './entities/comment.entity';
import { ArticleCategory, Category } from './entities/category.entity';
import { Like } from './entities/like.entity';
import { Saves } from './entities/saves.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Article, Comment, Category, Like, Saves, ArticleCategory])],
	controllers: [ArticleController],
	providers: [ArticleService],
	exports: [ArticleService],
})
export class ArticleModule { }
