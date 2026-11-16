import { Exclude } from 'class-transformer';

export class UserResponseDto {
	id: string;
	firstName: string;
	lastName: string;
	profilePicture: string | null;
	bio: string;

	@Exclude()
	authId: string;

	constructor(partial: Partial<UserResponseDto>) {
		Object.assign(this, partial);
	}
}




