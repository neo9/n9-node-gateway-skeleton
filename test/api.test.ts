// NPM modules
import { cb } from '@neo9/n9-node-utils';
import test, { Assertions } from 'ava';
import { context, get, post, startAPI } from './fixtures/helpers';

/*
** Start API
*/
test.before('Start API', async (t: Assertions) => {
	await startAPI();
});

/*
** Informations routes
*/
test.serial('GET / => routing-controllers-starter', async (t: Assertions) => {
	const { statusCode, body, stdout, stderr } = await get('/');
	t.is(statusCode, 200);
	t.is(body, 'pim-web-api');
	t.is(stderr.length, 0);
	t.is(stdout.length, 1);
	t.true(stdout[0].includes('GET /'));
});

test.serial('GET /ping => pong', async (t: Assertions) => {
	const { statusCode, body, stdout, stderr } = await get('/ping');
	t.is(statusCode, 200);
	t.is(body, 'pong');
	t.is(stderr.length, 0);
	t.is(stdout.length, 1);
	t.true(stdout[0].includes('GET /ping'));
});

test.serial('GET /routes => 1 routes', async (t: Assertions) => {
	const { statusCode, body } = await get('/routes');
	t.is(statusCode, 200);
	t.is(body.length, 0);
});

test.serial('GET /404 => 404 status code', async (t: Assertions) => {
	const { statusCode, body } = await get('/404');
	t.is(statusCode, 404);
	t.is(body.code, 'not-found');
	t.is(body.context.url, '/404');
});

/*
/*
** Stop API
*/
test.after('Stop server', async (t: Assertions) => {
	await cb(context.server.close.bind(context.server));
});
