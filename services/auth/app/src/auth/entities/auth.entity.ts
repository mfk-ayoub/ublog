import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('auth')
export class Auth{
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({
		type: "varchar",
		nullable: false,
		unique: true
	})
	email: string;

	@Column({
		type: "varchar",
		nullable: false,
		unique: true
	})
	username: string;

	@Column({
		type: "varchar",
		nullable: false
	})
	password_hash: string;

	@Column({
		default: true,
	})
	is_active: boolean;
	
	@CreateDateColumn()
	created_at: Date

	@UpdateDateColumn()
	updated_at: Date

	@Column({
		type: "varchar",
		nullable: true,
		length: 256
	})
	password_reset_token: string | null

	@Column({ type: 'timestamp', nullable: true })
	password_reset_token_expiration_date: Date | null
};
