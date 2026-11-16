import { NotFoundException, Controller, Get, Post, Delete, Body, Param, UseGuards, Req, ForbiddenException, Res, StreamableFile, MaxFileSizeValidator, FileTypeValidator, ParseFilePipe, UploadedFile, UseInterceptors, BadRequestException, Patch, HttpException } from '@nestjs/common';
import { ProxyService } from '../services/proxy.service';
import { AuthGuard } from 'src/guards/jwt.guard';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import FormData from 'form-data';

@Controller('article')
@UseGuards(AuthGuard)
export class ArticlesController {
	constructor(
		private proxyService: ProxyService,
		private httpService: HttpService,
	) { }

	// console.log("------>", req.originalUrl);
	// console.log(" user :", req.user.username);
	// console.log(" requested:", req.originalUrl + '/' + req.user.username);

	@Post(':slug/ask') // TODO NOW
	async askAi(
		@Req() req: any,
		@Param('slug') slug: string,
		@Body('question') question: string
	) {
		const article = await this.proxyService.forwardRequest(
			'articles',
			`/article/${slug}`,
			'GET'
		);

		if (!article)
			throw new NotFoundException('article not found');

		const ai_check = await this.forwardAi('/api/data/ask', 'POST', {
			user_id: req.user.id,
			article_id: article.id,
			question: this.validateQuestion(question),
		});

		return {
			answer: ai_check
		};
	}


	@Post('ai/chat') // TODO NOW
	async chatWithAi(
		@Req() req: any,
		@Body('question') question: string
	) {
		const ai_check = await this.forwardAi('/api/data/chat', 'POST', {
			user_id: req.user.id,
			question: this.validateQuestion(question),
		});

		return {
			answer: ai_check
		};
	}

	@Post(':slug/summarize')
	async summarize(
		@Req() req: any,
		@Param('slug') slug: string
	) {
		const article = await this.proxyService.forwardRequest(
			'articles',
			`/article/${slug}`,
			'GET'
		);

		if (!article)
			throw new NotFoundException('article not found');

		const aiBody = {
			user_id: req.user.id,
			article_id: article.id
		}

		const ai_check = await this.forwardAi('/api/data/summarize', 'POST', aiBody);

		return {
			answer: ai_check
		};

	}




	@Post('test-login')
	testLogin(@Req() req: any) {
		console.log(req.user);

		return {
			message: "valid jwt token"
		}
	}

	@Post("likes/all")
	async getAllLikes(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST'
		)
	}


	@Post(':slug/view')
	incrementArticleViews(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST'
		);
	}
	// SAVES

	@Post('my/saves')
	getUserSavedArticles(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			{
				author: req.user.username
			}
		);
	}

	@Get(':slug/save')
	getUserSaveStatusOnArticle(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'GET',
			{
				author: req.user.username
			}
		);
	}
	// END OF SAVES

	// TODO when user changes their username change all occurences of the username in db(articles/likes/saves...)
	// LIKES
	@Get(':slug/like')
	getUserLikeStatusOnArticle(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'GET',
			{
				author: req.user.username
			}
		);
	}

	@Post(':slug/like')
	likeArticle(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			{
				author: req.user.username
			}
		);
	}

	@Post(':slug/unlike')
	unlikeArticle(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			{
				author: req.user.username
			}
		);
	}

	@Get(':skug/likes')
	getArticleLikes(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'GET'
		);
	}
	// END OF LIKES

	// SAVES
	@Post(':slug/save')
	saveArticle(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			{
				author: req.user.username
			}
		);
	}

	@Post(':slug/unsave')
	unsaveArticle(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			{
				author: req.user.username
			}
		);
	}
	// END OF SAVES

	@Post("saves/all")
	async getAllSaves(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST'
		)
	}

	@Post('all')
	async allArticles(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			// { ...body, author: req.user.username },
		);
	}

	// ATHORIZATION @Get('all/:author')		is jwt same as article owner?
	@Get('all')
	async all(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl + '/' + req.user.username,
			'GET',
			// { ...body, author: req.user.username },
		);
	}

	@Get(":slug")
	async getArticle(@Param('slug') slug: string, @Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			'/article/' + slug,
			'GET'
		);
	}

	@Get("/id/:id")
	async getArticleById(@Param('slug') slug: string, @Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'GET'
		);
	}

	// @Get(":slug/comments")				PAGINATION query
	@Get(":slug/comments")
	async getArticleComments(@Req() req: any) {

		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'GET',
		);
	}

	// @Get(":slug/comments")				PAGINATION query
	@Post(":slug/comments")
	async writeArticleComment(@Req() req: any, @Body() body: any) {

		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			{ ...body, 'author': req.user.username }
		);
	}
	// @Get('by/:author')					PAGINATION query
	@Get('by/:author')
	async getArticlesByAuthor(@Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'GET'
		);
	};

	// @Get(':slug/picture')
	// @Public()
	@Get(':slug/picture')
	async getArticlePicture(
		@Req() req: any,
		@Param('slug') slug: string,
		@Res({ passthrough: true }) res: any
	) {
		const article = await this.proxyService.forwardRequest(
			'articles',
			'/article/' + slug,
			'GET'
		);

		if (!article.displayImg)
			throw new NotFoundException('image not found');
		const { stream, contentType, contentLength } = await this.proxyService.forwardBinaryRequest(
			'articles',
			req.originalUrl,
			'GET'
		);

		res.set({
			'Content-Type': contentType,
			...(contentLength && { 'Content-Length': contentLength }),
		});

		return new StreamableFile(stream);
	};
	// @Get('in/:name')					PAGINATION query
	@Get('in/:name')
	async getArticlesInCategory(
		@Req() req: any
	) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'GET',
		);
	}

	// ATHORIZATION @Post("create")			get user from jwt and create article for user
	@Post("create")
	async create(@Req() req: any) {

		const article = await this.proxyService.forwardRequest(
			'articles',
			req.originalUrl + '/' + req.user.username,
			'POST',
			// { ...body, author: req.user.username },
		);



		return article;
	}

	// ATHORIZATION @Delete(":id")				is jwt same as article owner?
	@Delete(":id")
	async deleteArticle(@Param('id') id: string, @Req() req: any) {
		await this.checkAuthority(id, req.user.username);

		const article = await this.proxyService.forwardRequest(
			'articles',
			'/article/' + id,
			'DELETE'
		);


		const aiBody = {
			article_id: id,
		}

		await this.forwardAi('/api/data/delete', 'DELETE', aiBody);

		return article;
	}
	// ATHORIZATION @Delete(':id/picture')		is jwt same as article owner?
	@Delete(":id/pic")
	async deleteArticlePic(@Param('id') id: string, @Req() req: any) {
		await this.checkAuthority(id, req.user.username);

		return this.proxyService.forwardRequest(
			'articles',
			'/article/' + id + '/picture',
			'DELETE'
		);
	}

	// ATHORIZATION @Patch(':id')				is jwt same as article owner?
	@Patch(':id')
	async updateArticle(
		@Param('id') id: string,
		@Body() body: any,
		@Req() req: any
	) {
		const article = await this.checkAuthority(id, req.user.username);
		const merged = {
			...body,
			title: body.title === undefined ? article.title : body.title,
			body: body.body === undefined ? article.body : body.body,
			slug: body.slug === undefined ? article.slug : body.slug,
		};

		await this.forwardAi('/api/data/update', 'PUT', {
			article_id: id,
			title: merged.title,
			content: merged.body,
			categories: ['article'],
		});

		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'PATCH',
			merged
		);
	}
	// ATHORIZATION @Patch(':id/publish')		is jwt same as article owner?
	@Patch(':id/publish')
	async publishArticle(
		@Param('id') id: string,
		@Req() req: any
	) {
		await this.checkAuthority(id, req.user.username);

		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'PATCH'
		);
	}
	// ATHORIZATION @Post(':id/category')		is jwt same as article owner?
	@Post(':id/category')
	async addCategoryToArticle(
		@Param('id') id: string,
		@Body() body: any,
		@Req() req: any
	) {
		await this.checkAuthority(id, req.user.username);

		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			{ ...body }
		)
	}

	// @Post('category')
	@Post('category')
	async createCategory(@Body() body: any, @Req() req: any) {
		return this.proxyService.forwardRequest(
			'articles',
			req.originalUrl,
			'POST',
			{ ...body }
		);
	}

	@UseGuards(AuthGuard)
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
		@Param('id') id: string,
		@Req() req: any,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
					new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
				],
			}),
		)
		file: Express.Multer.File,
	) {
		await this.checkAuthority(id, req.user.username);

		const articlesServiceUrl = this.proxyService.serviceUrls.articles;

		const formData = new FormData();
		formData.append('file', file.buffer, {
			filename: file.originalname,
			contentType: file.mimetype,
		});

		try {
			const response = await firstValueFrom(
				this.httpService.post(
					`${articlesServiceUrl}/article/${id}/picture`,
					formData,
					{
						headers: formData.getHeaders(),
					}
				)
			);

			return response.data;
		} catch (error: any) {
			throw error.response.data || error;
		}
	}
	private validateQuestion(question: string): string {
		if (typeof question !== 'string' || !question.trim() || question.length > 8000)
			throw new BadRequestException('Question must contain 1 to 8000 characters and not be blank');
		return question.trim();
	}

	private async forwardAi(path: string, method: 'POST' | 'PUT' | 'DELETE', data: any): Promise<string> {
		try {
			return await this.proxyService.forwardRequest(
				'ai',
				path,
				method,
				data,
				{ 'Content-Type': 'application/json' },
				{ responseType: 'text', timeout: 180000 },
			);
		} catch (error: unknown) {
			if (error instanceof HttpException)
				throw error;
			throw new HttpException('AI service is temporarily unavailable.', 502);
		}
	}

	private async checkAuthority(id: string, username: string) {
		const article = await this.proxyService.forwardRequest(
			'articles',
			'/article/id/' + id,
			'GET'
		);

		if (!article)
			throw new NotFoundException('article not found');
		if (article.author !== username)
			throw new ForbiddenException('Forbidden action');
		return article;
	}
}

