import { N9Error } from '@neo9/n9-node-utils';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import * as _ from 'lodash';
import { Route } from 'routing-controllers-wrapper/dist/src/models/routes.models';
import { ServerApi } from '../proxy/proxy.models';
import * as rp from 'request-promise-native';
import * as RouteParser from 'route-parser';
import { RouteForAcl } from './acl.models';

const conf = global.conf;
const log = global.log.module('acl');

const routesCache: { [id: string]: Route[] } = {};

const requestDefault = rp.defaults({
	json: true,
	resolveWithFullResponse: true
});

async function fetchRoutes(server: ServerApi): Promise<Route[]> {
	log.info(`fetching routes for server ${server.name}`);

	try {
		const res = await requestDefault(server.target + '/routes');
		return res.body;
	} catch (err) {
		log.error(`Error on fetch routes ${err}`);
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

async function loadAclContext(server: ServerApi, url: string, params: { [p: string]: string } | boolean, req: Request): Promise<object> {
	try {
		const res = await requestDefault({
			uri: server.target + url,
			qs: _.assignIn(params, req.query),
			headers: {
				session: req.headers.session
			}
		});
		return res.body;
	} catch (err) {
		log.error(`Error on load acl context ${err}`);
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
	return _.find(routes, (r) => !!(method === r.method && r.matcher.match(calledRoute))) as RouteForAcl;
}

async function checkAcl(server: ServerApi, routes: RouteForAcl[], req: Request, res: Response): Promise<boolean> {
	const goodUrl = req.baseUrl.replace(server.context, '');
	const foundRoute = findMatch(routes, goodUrl, req.method.toLowerCase());

	// if the route is not found or doesn't require perms
	if (!_.get(foundRoute, 'acl.perms.length')) return;

	// the route need acl, so one update token
	const foundRouteParams = foundRoute.matcher.match(goodUrl);

	let context = {};
	if (foundRoute.acl.loadPath) {
		context = await loadAclContext(server, foundRoute.acl.loadPath, foundRouteParams, req);
	}
	// console.log(`-- acl.main.ts foundRoute.acl, foundRouteParams, context --`, foundRoute.acl, foundRouteParams, context, JSON.parse(req.headers.session));
	// fetch user data from mock
	// fetch check acl with imperium

	// return await checkAclFromEcrm(foundRoute.acl, foundRouteParams, context, req);
	return true;
}

function check(server: ServerApi): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (server.ignoreRoutes) return next();

		try {
			const routes = await getOrFetchRoutes(server);

			await checkAcl(server, routes, req, res);
		} catch (err) {
			if (['too-old-session', 'jwt expired'].indexOf(_.get(err, 'error.code')) !== -1) {
				return next(new N9Error(err.error.code, 401));
			} else if (['too-old-session', 'jwt expired'].indexOf(_.get(err, 'context.code')) !== -1) {
				return next(new N9Error(err.context.code, 401));
			}
			return next(new N9Error('invalid-perms-web-api', 401));
		}
		return next();
	};
}

export { check };
