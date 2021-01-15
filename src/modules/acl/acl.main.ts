import { N9Error } from '@neo9/n9-node-utils';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import * as Imperium from 'imperium';
import * as _ from 'lodash';
import { N9HttpClient } from 'n9-node-routing';
import { Route } from 'n9-node-routing/dist/src/models/routes.models';
import * as RouteParser from 'route-parser';
import { TokenContent } from '../../models/users/users.models';
import { EcrmClient } from '../clients/ecrm.client';
import { ServerApi } from '../proxy/proxy.models';
import { RouteForAcl } from './acl.models';

const log = global.log.module('acl');
const httpClient = new N9HttpClient(log);

const routesCache: { [id: string]: Route[] } = {};

async function fetchRoutes(server: ServerApi): Promise<Route[]> {
	log.info(`fetching routes for server ${server.name}`);

	try {
		return await httpClient.get<Route[]>(`${server.target}/routes`);
	} catch (err) {
		log.error(`Error on fetch routes ${err}`, { errString: JSON.stringify(err) });
		throw err;
	}
}

async function getOrFetchRoutes(server: ServerApi): Promise<RouteForAcl[]> {
	if (routesCache[server.name]) {
		return await routesCache[server.name];
	}

	let routes = await fetchRoutes(server);
	if (!routes) return null;
	routes = routes.map((r) => Object.assign(r, { matcher: new RouteParser(r.path.toString()) }));
	routesCache[server.name] = routes;

	return routes;
}

async function loadAclContext(
	server: ServerApi,
	url: string,
	params: { [key: string]: string } = {},
	req: Request<object>,
): Promise<object> {
	try {
		let res;
		if (url) {
			res = await httpClient.get<object>(
				server.target + url,
				{ ...params, ...req.query },
				{
					session: req.headers.session,
				},
			);
			return { ...params, ...res };
		}
		return params;
	} catch (err) {
		log.error(`Error on load acl context ${err}`, { errString: JSON.stringify(err) });
		throw err;
	}
}

//
// async function checkAclFromEcrm(acl: AcessControl, params: { [p: string]: string } | boolean, context: object, req: Request): Promise<{ ok: boolean }> {
// 	// TODO: replace me with connector
// 	try {
// 		const res = await request({
// 			uri: ecrmConf['target'] + '/acl/check',
// 			method: 'POST',
// 			json: true,
// 			body: {
// 				perms: acl.perms,
// 				context: _.assignIn({}, context, params, req.query)
// 			},
// 			headers: {
// 				'Authorization': req.headers.authorization || ('Bearer ' + req.query.token),
// 				'X-Brand': req.headers['x-brand']
// 			}
// 		});
// 		return res.body;
// 	} catch (err) {
// 		log.error(`Error on check acl from ecrm ${err}`);
// 		throw err;
// 	}
// }

// check if an url matches any of the route definitions
function findMatch(routes: RouteForAcl[], calledRoute: string, method: string): RouteForAcl {
	return _.find(
		routes,
		(r) => !!(method === r.method && r.matcher.match(calledRoute)),
	) as RouteForAcl;
}

async function checkAcl(
	server: ServerApi,
	routes: RouteForAcl[],
	req: Request<object>,
	res: Response,
): Promise<boolean> {
	const goodUrl = req.baseUrl.replace(server.context, '');
	const foundRoute = findMatch(routes, goodUrl, req.method.toLowerCase());

	// if the route is not found or doesn't require perms
	if (!_.get(foundRoute, 'acl.perms.length')) return;

	// the route need acl, so one update token
	const foundRouteParams = foundRoute.matcher.match(goodUrl);

	const context = await loadAclContext(
		server,
		foundRoute.acl.loadPath,
		foundRouteParams as { [key: string]: string },
		req,
	);
	if (req.headers.session) {
		const session: TokenContent = JSON.parse(req.headers.session as string);
		const user = await new EcrmClient().getUserById(session.userId);

		(req as any).session = session;
		req.params = context;
		(req as any).user = user;

		// console.log('-**- user : ', user);
		// console.log('-**- session : ', session);
		// console.log('-**- context : ', context);

		// fetch check acl with imperium
		await new Promise<void>(async (resolve, reject) => {
			(await Imperium.can(foundRoute.acl.perms as Imperium.Action[]))(
				req as any,
				null,
				(err: any) => {
					if (err) reject(err);
					else resolve();
				},
			);
		});
	} else {
		throw new N9Error('no-session-provided', 401);
	}

	return true;
}

function check(server: ServerApi): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (server.ignoreRoutes) return next();

		try {
			const routes = await getOrFetchRoutes(server);

			await checkAcl(server, routes, req, res);
		} catch (err) {
			if (err.message) {
				log.error(err.message);
			}
			return next(new N9Error('invalid-perms', 401));
		}
		return next();
	};
}

export { check };
