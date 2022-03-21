import { ObjectID } from 'bson';
import { Allow, Exclude, IsEmail, IsString, MinLength } from 'n9-node-routing';

export type UserType = 'BACK' | 'DOCTOR' | 'NURSE' | 'SALESPERSON' | 'ASSISTANT' | 'SUPERVISOR';

export class User {
	public _id: string | ObjectID;

	@IsString()
	@MinLength(2)
	@Allow()
	public firstName: string;

	@IsString()
	@MinLength(2)
	@Allow()
	public lastName: string;

	@IsString()
	@IsEmail()
	@Allow()
	public email: string;

	@IsString()
	@MinLength(8)
	@Allow()
	@Exclude({ toPlainOnly: true })
	public password: string;

	public roles: string[];

	public createdAt: Date;
}

export class TokenContent {
	public userId: string;
	public iat: number; // creation timestamp
	public exp: number; // expiration timestamp
}
