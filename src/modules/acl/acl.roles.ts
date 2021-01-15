import { Request } from 'express';
import * as Imperium from 'imperium';
import { User } from '../../models/users/users.models';

function defineRole(role: string): any {
	return Imperium.role(role, async (req: Request) => {
		const user: User = (req as any).user;

		if (user.roles?.includes(role)) {
			return {
				user: (req as any).session.userId,
			};
		}
	});
}

async function defineRoles(): Promise<void> {
	Imperium.role('USER_OWNER', async (req: Request) => {
		return { user: (req as any).session.userId };
	}).can('seeUser', { user: '@' });

	defineRole('ADMIN').can('createUser');
}

export { defineRoles };
