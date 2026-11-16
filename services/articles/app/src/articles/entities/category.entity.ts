import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('categories')
export class Category {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 100, unique: true })
	name: string;
}

@Entity('article_categories')
export class ArticleCategory {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid' })
	articleId: string;

	@Column({ type: 'uuid' })
	categoryId: string;

	@Column({
		type: 'boolean',
		default: false
	})
	published: boolean

}