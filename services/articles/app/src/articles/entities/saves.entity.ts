import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('saves')
export class Saves {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'text', nullable: true })
	slug: string

	@Column({ type: 'uuid', nullable: false })
	articleId: string;

	@Column({ type: 'varchar', length: 100, nullable: false })
	author: string;

}