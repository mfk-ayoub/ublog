import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({
		unique: true,
		update: false
	})
	authId: string;

	@Column()
	firstName: string;

	@Column()
	lastName: string;

	@Column({
		nullable: false,
		unique: true,
	})
	username: string;

	@Column({ type: 'text', nullable: true })
	profilePicture: string | null;

	@Column({ type: 'text', nullable: true })
	bio: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}