import ava, { Assertions } from 'ava';

import { get, startAPI, stopAPI } from './fixtures/helpers';
/*
 ** Start API
 */
ava.before('Start API', async () => {
	await startAPI({});
});

/*
 ** Information routes
 */
ava.serial('GET / => n9-node-gateway-skeleton', async (t: Assertions) => {
	const { body, stdout, stderr } = await get<string>('/', 'text');
	t.is(body, 'n9-node-gateway-skeleton');
	t.is(stderr.length, 0, `Request has errors: ${JSON.stringify(stderr)}`);
	t.true(stdout.length > 0, 'Request had no success message');
});

ava.serial('GET /ping => pong', async (t: Assertions) => {
	const { body, stdout, stderr } = await get<string>('/ping', 'text');
	t.true(body.includes('pong'));
	t.is(stderr.length, 0, `Request has errors: ${JSON.stringify(stderr)}`);
	t.not(stdout.length, 0, 'Request had no success message');
});

ava('GET /routes => 1 routes', async (t: Assertions) => {
	const { body } = await get<any[]>('/routes');
	t.is(body.length, 0);
});

ava.serial('GET /404 => 404 status code', async (t: Assertions) => {
	const { err } = await get('/404');
	t.is(err.status, 404);
	t.is(err.message, 'not-found');
	t.is(err.context.srcError.context.url, '/404');
});

/*
/*
** Stop API
*/
ava.after('Stop server', async () => {
	await stopAPI();
});
