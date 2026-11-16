import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('likes')
export class Like {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'text', nullable: true })
	slug: string

	@Column({ type: 'uuid', nullable: false })
	articleId: string;

	@Column({ type: 'varchar', length: 100, nullable: false })
	author: string;

	// @Column({ type: 'text' })
	// content: string;
}