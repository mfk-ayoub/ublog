import {
	Entity,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('articles')
export class Article {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({
		type: 'text',
		nullable: true,
	})
	body: string

	@Column({
		type: 'text',
		nullable: true
	})
	displayImg: string | null

	@Column({
		type: 'text',
		nullable: true,
		unique: true
	})
	slug: string

	@Column({
		type: 'text',
		nullable: true
	})
	excerpt: string
	
	

	@Column({
		type: 'text',
		nullable: true
	})
	title: string

	@Column({
		type: 'text',
		nullable: false
	})
	author: string

	@Column({
		type: 'boolean',
		default: false
	})
	published: boolean


	@Column({
		type: 'integer',
		default: 0
	})
	views: number


	@UpdateDateColumn()
	createdAt

	@CreateDateColumn()
	updatedAt
}
