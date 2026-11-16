import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('following')
export class Following {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', length: 100, nullable: false })
	username: string;

	@Column({ type: 'varchar', length: 100, nullable: false })
	followedUsername: string;

	// @Column({ type: 'text' })
	// content: string;
}