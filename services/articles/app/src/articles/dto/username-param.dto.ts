import { IsString, Matches } from 'class-validator';

export class UsernameParamDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9]{3,25}$/, {
    message: 'Author must be 3-25 alphanumeric characters'
  })
  author: string;
}