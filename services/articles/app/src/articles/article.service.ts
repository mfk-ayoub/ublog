import {
	BadRequestException,
	Body,
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { NewArticleResponse } from './dto/new-article-response.dto';
import { ListUserArticlesDto } from './dto/list-user-articles.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleCategory, Category } from './entities/category.entity';
import { Comment } from './entities/comment.entity';
import { privateDecrypt } from 'crypto';
import { CreateCommentDto } from './dto/comment.dto';
import { waitForDebugger } from 'inspector';
import { Like } from './entities/like.entity';
import { Saves } from './entities/saves.entity';


@Injectable()
export class ArticleService {
	private readonly uploadDir = path.join(process.cwd(), 'uploads');
	private readonly commentLimit = 6;
	private readonly articleLimit = 12;

	constructor(
		@InjectRepository(Article)
		private articleRepository: Repository<Article>,

		@InjectRepository(Category)
		private categoryRepo: Repository<Category>,

		@InjectRepository(ArticleCategory)
		private articleCategoryRepo: Repository<ArticleCategory>,

		@InjectRepository(Comment)
		private commentRepository: Repository<Comment>,

		@InjectRepository(Saves)
		private savesRepository: Repository<Saves>,

		@InjectRepository(Like)
		private likeRepository: Repository<Like>

	) { }

	async getallArticles() {
		return this.articleRepository.find({
			where : {
				published: true
			}
		});
	}

	async getAllSaves() {
		return this.savesRepository.find();
	}

	async getAllLikes() {
		return this.likeRepository.find();
	}

	async saveImageToDisk(file: Express.Multer.File): Promise<string> {
		if (!file || !file.buffer) {
			throw new InternalServerErrorException('File buffer is missing');
		}

		const detected = await fileTypeFromBuffer(file.buffer);

		if (!detected)
			throw new BadRequestException('Weird file extention');

		const ext = detected.ext ? `.${detected.ext}` : path.extname(file.originalname) || '.jpg';
		const filename = `${uuidv4()}${ext}`;
		const filePath = path.join(this.uploadDir, filename);

		try {
			await fs.mkdir(this.uploadDir, { recursive: true });
			await fs.writeFile(filePath, file.buffer);
		} catch (err) {
			throw new InternalServerErrorException('Failed to save image to disk');
		}

		return filename;
	}

	async create(author: string): Promise<NewArticleResponse> {
		const article = await this.articleRepository.create({
			author
		});
		const savedArticle = await this.articleRepository.save(article);

		console.log(savedArticle);

		return {
			id: savedArticle.id
		};
	};

	async getAllUserArticles(author: string, page: number): Promise<ArticleResponseDto[]> {

		const articles = this.articleRepository.find({
			where: {
				author,
				// published: true
			},
			select: ['id', 'author', 'createdAt', 'displayImg', 'excerpt', 'updatedAt', 'title', 'slug', 'published'],
			take: this.articleLimit,
			skip: (page - 1) * this.articleLimit

		});

		return articles;
	}

	async update(id: string, updateArticleDto: UpdateArticleDto) {
		const { body, slug, title } = updateArticleDto;

		const article = await this.articleRepository.findOne({
			where: {
				id
			}
		});

		if (!article)
			throw new NotFoundException(`Article with id ${id} was not found.`);

		const slugCheck = await this.articleRepository.findOne({
			where: {
				slug
			}
		});
		if (slugCheck && slugCheck.id != id)
			throw new ConflictException(`Article with '${slug}' slug already exist`);

		article.body = body;
		article.excerpt = body.substring(0, 250) + '...';
		article.title = title;
		article.slug = slug;
		const savedArticle = await this.articleRepository.save(article);

		console.log(savedArticle);

		return (savedArticle);
	}


	async getPublishedUserArticles(author: string, page: number): Promise<any> {

		const articles = await this.articleRepository.find({
			where: {
				author,
				published: true
			},
			select: ['author', 'createdAt', 'displayImg', 'excerpt', 'updatedAt', 'title', 'slug', 'published'],
			take: this.articleLimit,
			skip: (page - 1) * this.articleLimit
		});

		return articles;
	}

	async publish(id: string) {
		const article = await this.articleRepository.findOne({
			where: {
				id
			}
		});

		if (article === null)
			throw new NotFoundException("article not found");

		if (article.published) {
			article.published = false;
			const savedArticle = await this.articleRepository.save(article);


			await this.articleCategoryRepo.update(
				{ articleId: article.id },
				{ published: false }
			);

			return savedArticle
		}

		if (article.body === null || article.body.length < 250)
			throw new NotAcceptableException('Body must be of length 250-5000');

		if (article.title === null || article.title.length < 3)
			throw new NotAcceptableException(`Title must be of length 2-175. Your current title is ${article.title}`);

		if (article.slug === null || article.slug.length < 3)
			throw new NotAcceptableException(`Slug must be of length 2-100. Your current slug is ${article.slug}`);

		if (article.slug === 'all')
			throw new NotAcceptableException(`Slug cannot be 'all' please change it to something else.`);

		// if (!article.displayImg)
		// 	throw new NotAcceptableException(`An article must have a display image.`);


		article.published = !article.published;

		const savedArticle = await this.articleRepository.save(article);

		await this.articleCategoryRepo.update(
			{ articleId: article.id },
			{ published: true }
		);

		return savedArticle;
	}


	async getArticleById(id: string) {
		const article = await this.articleRepository.findOne({
			where: {
				id
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');
		return article;
	}


	async unlikeArticle(slug: string, author: string) {
		const article = await this.articleRepository.findOne({
			where: {
				slug,
				published: true
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');

		const alreadyLiked = await this.likeRepository.findOne({
			where: {
				slug,
				author
			}
		})
		if (!alreadyLiked) {
			throw new ConflictException("not liked");
		}

		this.likeRepository.remove(alreadyLiked);
		return {
			message: "like removed"
		};
	}


	async userSaveStatusOnArticle(slug: string, author: string) {
		const article = await this.articleRepository.findOne({
			where: {
				slug,
				published: true
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');

		const alreadySaved = await this.savesRepository.findOne({
			where: {
				slug,
				author
			}
		})
		if (alreadySaved)
			return true;
		return false;
	}

	async checkUserLikeStatusOnArticle(slug: string, author: string) {
		const article = await this.articleRepository.findOne({
			where: {
				slug,
				published: true
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');

		const alreadyLiked = await this.likeRepository.findOne({
			where: {
				slug,
				author
			}
		})
		if (alreadyLiked)
			return true;
		return false;
	}

	async likeArticle(slug: string, author: string) {
		const article = await this.articleRepository.findOne({
			where: {
				slug,
				published: true
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');

		const alreadyLiked = await this.likeRepository.findOne({
			where: {
				slug,
				author
			}
		})
		if (alreadyLiked) {
			throw new ConflictException("already liked");
		}

		const like = this.likeRepository.create({
			articleId: article.id,
			slug,
			author,
		});

		this.likeRepository.save(like);
		return {
			message: "liked article"
		};
	}

	async getArticleLikes(slug: string) {
		return await this.likeRepository.count({
			where: {
				slug,
			}
		});
	}


	async incrementViews(slug: string) {
		const article = await this.articleRepository.findOne({
			where: {
				slug,
				published: true
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');
		article.views += 1;
		this.articleRepository.save(article);
		console.log(article)
		return article;
	}

	async getArticle(slug: string) {
		const article = await this.articleRepository.findOne({
			where: {
				slug,
				// published: true
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');
		return article;
	}

	async updateArticlePicture(id: string, filename: string | null) {
		const article = await this.articleRepository.findOne({ where: { id } });

		if (!article) {
			throw new NotFoundException(`Article with ID ${id} not found`);
		}

		if (article.displayImg) {
			const oldFilePath = path.join(process.cwd(), 'uploads', article.displayImg);
			try {
				await fs.unlink(oldFilePath);
			} catch (error) { }
		}

		article.displayImg = filename;
		const savedArticle = await this.articleRepository.save(article);

		return savedArticle;
	}

	async deleteArticle(id: string) {
		const article = await this.articleRepository.findOne({
			where: {
				id
			}
		});

		if (article === null)
			throw new NotFoundException('article was not found');

		await this.commentRepository.delete({ articleId: id });

		await this.articleCategoryRepo.delete({ articleId: id });

		this.articleRepository.remove(article);

		return {
			message: "article deleted successfully!"
		};
	}

	async createComment(slug: string, createCommentDto: CreateCommentDto) {
		const { author, content } = createCommentDto;

		const article = await this.articleRepository.findOne({
			where: {
				slug: slug,
				published: true
			}
		});

		if (!article) {
			throw new NotFoundException('Article not found or not published');
		}

		const comment = this.commentRepository.create({
			articleId: article.id,
			slug,
			author,
			content: content.trim()
		});

		return this.commentRepository.save(comment);
	}

	async getArticleComments(slug: string, page: number) {
		const article = await this.articleRepository.findOne({
			where: {
				slug: slug
			}
		});

		if (article === null)
			throw new NotFoundException('article was not found');

		const comments = this.commentRepository.find({
			where: {
				articleId: article.id
			},
			skip: (page - 1) * this.commentLimit,
			take: this.commentLimit
		});

		return comments;
	}

	async getCategory(id: string) {
		const category = this.categoryRepo.find({
			where: {
				id
			}
		});

		if (category === null)
			throw new NotFoundException('category was not found');

		return category;
	}

	async createCategory(name: string) {
		const search = await this.categoryRepo.findOne({
			where: {
				name
			}
		});

		if (search !== null)
			throw new ConflictException(`Category with name '${name}' already exist`);

		const category = await this.categoryRepo.save({
			name
		});

		return category;
	}


	async addCategoryToArticle(articleId: string, categoryName: string) {
		const category = await this.categoryRepo.findOne({
			where: {
				name: categoryName.trim()
			}
		});

		if (category === null)
			throw new NotFoundException('Category was not found!');

		const article = await this.articleRepository.findOne({
			where: {
				id: articleId
			}
		});

		if (article === null)
			throw new NotFoundException('Article was not found!');

		const entry = this.articleCategoryRepo.create({
			articleId: article.id,
			categoryId: category.id
		});

		this.articleCategoryRepo.save(entry);

		return {
			message: "Category added to the article",
		}
	}

	async getArticlesInCategory(name: string, page: number) {
		name = name.trim();
		const category = await this.categoryRepo.findOne({
			where: {
				name
			}
		});
		if (category === null)
			throw new NotFoundException('category was not found');

		const articles = await this.articleCategoryRepo.find({
			where: {
				categoryId: category.id,
				published: true
			},
			skip: (page - 1) * this.articleLimit,
			take: this.articleLimit
		});

		return articles;
	}




	async unsaveArticle(slug: string, author: string) {
		const article = await this.articleRepository.findOne({
			where: {
				slug,
				published: true
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');

		const alreadyLiked = await this.savesRepository.findOne({
			where: {
				slug,
				author
			}
		})
		if (!alreadyLiked) {
			throw new ConflictException("not saved");
		}

		this.savesRepository.remove(alreadyLiked);
		return {
			message: "save removed"
		};
	}


	async getUserSavedArticles(author: string) {
		const saves = await this.savesRepository.find({
			where: {
				author
			}
		})
		return saves;
	}

	async saveArticle(slug: string, author: string) {
		const article = await this.articleRepository.findOne({
			where: {
				slug,
				published: true
			}
		});

		if (article === null)
			throw new NotFoundException('Article not found');

		const alreadySaved = await this.savesRepository.findOne({
			where: {
				slug,
				author
			}
		})
		if (alreadySaved) {
			throw new ConflictException("already saved");
		}

		const like = this.savesRepository.create({
			articleId: article.id,
			slug,
			author,
		});

		this.savesRepository.save(like);
		return {
			message: "saved article"
		};
	}
}


/*
article/create 					X
	->	new article (id), 		X
	->	linked with a user		X
		not published(draft)	X
article/id/update				X
	->	update body				X
	->	update title			X
	->	update slug				X
	->	update category			
article/id/image				X
	->	POST -> new image		X 
	->	DELETE -> remove image	X 
article/id/publish				X
	-> publish article			X
article/slug					X
	->	GET -> retrieve article	X
article/slug					X
	->	DEL -> remove article	X

article/id/category/id
	->	PATCH
article/category
	->	POST
*/