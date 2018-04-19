import { Request } from 'express';
import * as Imperium from 'imperium';
import { User } from 'pim-commons';

const conf = global.conf;
const log = global.log.module('acl-roles');

async function defineRoles(): Promise<void> {
	Imperium.role('USER_OWNER', async (req: Request) => {
		return { user: req['session'].userId };
	})
			.can('seeUser', { user: '@' });

	Imperium.role('ADMIN', async (req: Request) => {
		const user = req['user'] as User;

		if (user.roles && user.roles.indexOf('ADMIN') !== -1) {
			return {
				user: req['session'].userId
			};
		}
	})
			.can('createUser');
}

export { defineRoles };
