import type { Request } from 'express';
import * as Imperium from 'imperium';

import { User } from '../../models/users/users.models';

function defineRole(role: string): any {
	// eslint-disable-next-line @typescript-eslint/require-await
	return Imperium.role(role, async (req: Request) => {
		const user: User = (req as any).user;

		if (user.roles?.includes(role)) {
			return {
				user: (req as any).session.userId,
			};
		}
	});
}

function defineRoles(): void {
	// eslint-disable-next-line @typescript-eslint/require-await
	Imperium.role('USER_OWNER', async (req: Request) => {
		return { user: (req as any).session.userId };
	}).can('seeUser', { user: '@' });

	defineRole('ADMIN').can('createUser');
}

export { defineRoles };
