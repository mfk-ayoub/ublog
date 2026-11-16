import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, BadRequestException, Res, StreamableFile, Put, Patch, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ArticleService } from './article.service';
import * as path from 'path';
import { createReadStream } from 'fs';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { NewArticleResponse } from './dto/new-article-response.dto';
import { UsernameParamDto } from './dto/username-param.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleIDDto } from './dto/article-id.dto';
import { ArticleSlugDto } from './dto/article-slug.dto';
import { PageDto } from './dto/page.dto';
import { CategoryDto } from './dto/category.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { ArticleSlugAndAuthorDto } from './dto/article-slug-and-author.dto';


@Controller('article')
export class ArticleController {
	constructor(private readonly articlesService: ArticleService) { }

	@Get(":slug")
	getArticle(@Param() params: ArticleSlugDto): Promise<any> {
		return this.articlesService.getArticle(params.slug);
	}


	// @Post('likes/all')
	// getAllLikes() {
	// 	return this.articlesService.getAllLikes();
	// }


	@Post('all')
	getAllArticles() {
		return this.articlesService.getallArticles();
	}


	@Post('my/saves')
	getUserSavedArticles(
		@Body() body: UsernameParamDto

	) {
		return this.articlesService.getUserSavedArticles(body.author);
	}

	@Post(":slug/save")
	saveArticle(
		@Param() params: ArticleSlugDto,
		@Body() body: UsernameParamDto
	): Promise<any> {
		return this.articlesService.saveArticle(params.slug, body.author);
	}

	@Post(":slug/unsave")
	unsaveArticle(
		@Param() params: ArticleSlugDto,
		@Body() body: UsernameParamDto
	): Promise<any> {
		return this.articlesService.unsaveArticle(params.slug, body.author);
	}

	@Get(":slug/save")
	getUserSaveStatusOnArticle(
		@Param() params: ArticleSlugDto,
		@Body() body: UsernameParamDto
	): Promise<any> {
		return this.articlesService.userSaveStatusOnArticle(params.slug, body.author);
	}


	@Get(":slug/likes")
	getArticleLikes(
		@Param() params: ArticleSlugDto,
	): Promise<any> {
		return this.articlesService.getArticleLikes(params.slug);
	}

	@Post(":slug/like")
	likeArticle(
		@Param() params: ArticleSlugDto,
		@Body() body: UsernameParamDto
	): Promise<any> {
		return this.articlesService.likeArticle(params.slug, body.author);
	}

	@Get(":slug/like")
	getUserLikeStatusOnArticle(
		@Param() params: ArticleSlugDto,
		@Body() body: UsernameParamDto
	): Promise<any> {
		return this.articlesService.checkUserLikeStatusOnArticle(params.slug, body.author);
	}

	@Post(":slug/unlike")
	unlikeArticle(
		@Param() params: ArticleSlugDto,
		@Body() body: UsernameParamDto
	): Promise<any> {
		return this.articlesService.unlikeArticle(params.slug, body.author);
	}

	@Post(':slug/view')
	incrementViewsOfArticle(@Param() params: ArticleSlugDto) {
		return this.articlesService.incrementViews(params.slug);
	}

	@Post('saves/all')
	getAllSaves(): Promise<any> {
		return this.articlesService.getAllSaves();
	}

	@Get("id/:id")
	getArticleById(@Param() params: ArticleIDDto): Promise<any> {
		return this.articlesService.getArticleById(params.id);
	}

	@Delete(":id")
	deleteArticle(@Param() params: ArticleIDDto): Promise<any> {
		return this.articlesService.deleteArticle(params.id);
	}

	@Post("create/:author")
	create(@Param() params: UsernameParamDto): Promise<NewArticleResponse> {
		return this.articlesService.create(params.author);
	}

	@Get(":slug/comments")
	getArticleComments(
		@Param() params: ArticleSlugDto,
		@Query() queries: PageDto
	): Promise<any> {
		return this.articlesService.getArticleComments(params.slug, queries.page);
	}

	@Post(":slug/comments")
	createArticleComment(
		@Param() params: ArticleSlugDto,
		@Body() createCommentDto: CreateCommentDto
	): Promise<any> {
		return this.articlesService.createComment(params.slug, createCommentDto);
	}

	@Get('all/:author')
	getAllUserArticles(
		@Param() params: UsernameParamDto,
		@Query() queries: PageDto
	): Promise<any> {
		return this.articlesService.getAllUserArticles(params.author, queries.page);
	}

	@Get('in/:name')
	getArticlesInCategory(
		@Param() params: CategoryDto,
		@Query() queries: PageDto
	): Promise<any> {
		return this.articlesService.getArticlesInCategory(params.name, queries.page);
	}

	@Get('by/:author')
	getPublishedUserArticles(
		@Param() params: UsernameParamDto,
		@Query() queries: PageDto
	): Promise<any> {
		return this.articlesService.getPublishedUserArticles(params.author, queries.page);
	}

	@Patch(':id')
	updateArticle(@Param() params: ArticleIDDto, @Body() updateArticleDto: UpdateArticleDto) {
		return this.articlesService.update(params.id, updateArticleDto)
	}


	@Post(':id/category')
	addCategoryToArticle(@Param() params: ArticleIDDto, @Body() categoryDto: CategoryDto) {
		return this.articlesService.addCategoryToArticle(params.id, categoryDto.name.trim());
	}

	@Post('category')
	createCategory(@Body() categoryDto: CategoryDto) {
		return this.articlesService.createCategory(categoryDto.name.trim())
	}

	@Patch(':id/publish')
	publishArticle(@Param() params: ArticleIDDto) {
		return this.articlesService.publish(params.id)
	}


	@Post(':id/picture')
	@UseInterceptors(
		FileInterceptor('file', {
			storage: memoryStorage(),
			limits: {
				fileSize: 5 * 1024 * 1024,
				fieldNameSize: 75
			},
			fileFilter: (req, file, callback) => {
				if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
					return callback(
						new BadRequestException('Only image files are allowed'),
						false,
					);
				}
				callback(null, true);
			},
		}),
	)
	async uploadArticlePicture(
		@Param() params: ArticleIDDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
					new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
				],
			}),
		)
		file: Express.Multer.File,
	) {
		const filename = await this.articlesService.saveImageToDisk(file);
		return this.articlesService.updateArticlePicture(params.id, filename);
	}

	@Get(':slug/picture')
	async getProfilePicture(
		@Param() params: ArticleSlugDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<StreamableFile> {
		const article = await this.articlesService.getArticle(params.slug);

		if (!article.displayImg) {
			throw new BadRequestException('Article does not have a display picture');
		}

		const filePath = path.join(process.cwd(), 'uploads', article.displayImg);
		const file = createReadStream(filePath);
		const ext = path.extname(article.displayImg).toLowerCase();

		const mimeTypes = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
		};

		res.set({
			'Content-Type': mimeTypes[ext] || 'application/octet-stream',
			'Content-Disposition': `inline; filename="${article.displayImg}"`,
		});

		return new StreamableFile(file);
	}

	@Delete(':id/picture')
	deleteDisplayPicture(@Param() params: ArticleIDDto) {
		return this.articlesService.updateArticlePicture(params.id, null);
	}


	// @Get(':username/profile-picture')
	// async getProfilePicture(
	// 	@Param('username') username: string,
	// 	@Res({ passthrough: true }) res: Response,
	// ): Promise<StreamableFile> {
	// 	const user = await this.usersService.findOneByUsername(username);

	// 	if (!user.profilePicture) {
	// 		throw new BadRequestException('User does not have a profile picture');
	// 	}

	// 	const filePath = path.join(process.cwd(), 'uploads', user.profilePicture);
	// 	const file = createReadStream(filePath);
	// 	const ext = path.extname(user.profilePicture).toLowerCase();

	// 	const mimeTypes = {
	// 		'.jpg': 'image/jpeg',
	// 		'.jpeg': 'image/jpeg',
	// 		'.png': 'image/png',
	// 		'.gif': 'image/gif',
	// 		'.webp': 'image/webp',
	// 	};

	// 	res.set({
	// 		'Content-Type': mimeTypes[ext] || 'application/octet-stream',
	// 		'Content-Disposition': `inline; filename="${user.profilePicture}"`,
	// 	});

	// 	return new StreamableFile(file);
	// }

	// @Delete(':username/profile-picture')
	// deleteProfilePicture(@Param('username') username: string): Promise<ArticleResponseDto> {
	// 	return this.usersService.updateProfilePicture(username, null);
	// }
}