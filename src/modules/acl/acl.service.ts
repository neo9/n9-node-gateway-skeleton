import type { NextFunction, Request, RequestHandler, Response } from 'express';
import * as Imperium from 'imperium';
import * as _ from 'lodash';
import { Inject, N9Error, N9HttpClient, N9Log, Service } from 'n9-node-routing';
import { Route } from 'n9-node-routing/dist/src/models/routes.models';
import * as RouteParser from 'route-parser';

import { TokenContent } from '../../models/users/users.models';
import { EcrmClient } from '../clients/ecrm.client';
import { ServerApi } from '../proxy/proxy.models';
import { RouteForAcl } from './acl.models';

@Service()
export class AclService {
	private routesCache: Record<string, Route[]> = {};

	constructor(
		@Inject('logger') private logger: N9Log,
		@Inject('N9HttpClient') private readonly n9HttpClient: N9HttpClient,
	) {
		this.logger = logger.module('acl');
	}

	private async fetchRoutes(server: ServerApi): Promise<Route[]> {
		log.info(`fetching routes for server ${server.name}`);

		try {
			return await this.n9HttpClient.get<Route[]>(`${server.target}/routes`);
		} catch (err) {
			log.error(`Error on fetch routes ${err}`, { errString: JSON.stringify(err) });
			throw err;
		}
	}

	private async getOrFetchRoutes(server: ServerApi): Promise<RouteForAcl[]> {
		if (this.routesCache[server.name]) {
			return this.routesCache[server.name];
		}

		let routes = await this.fetchRoutes(server);
		if (!routes) return null;
		routes = routes.map((r) => Object.assign(r, { matcher: new RouteParser(r.path.toString()) }));
		this.routesCache[server.name] = routes;

		return routes;
	}

	private async loadAclContext(
		server: ServerApi,
		url: string,
		req: Request<object>,
		params: { [key: string]: string } = {},
	): Promise<object> {
		try {
			let res;
			if (url) {
				res = await this.n9HttpClient.get<object>(
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

	private findMatch(routes: RouteForAcl[], calledRoute: string, method: string): RouteForAcl {
		return _.find(routes, (r) => !!(method === r.method && r.matcher.match(calledRoute)));
	}

	private async checkAcl(
		server: ServerApi,
		routes: RouteForAcl[],
		req: Request<object>,
	): Promise<boolean> {
		const goodUrl = req.baseUrl.replace(server.context, '');
		const foundRoute = this.findMatch(routes, goodUrl, req.method.toLowerCase());

		// if the route is not found or doesn't require perms
		if (!_.get(foundRoute, 'acl.perms.length')) return;

		// the route need acl, so one update token
		const foundRouteParams = foundRoute.matcher.match(goodUrl);

		const context = await this.loadAclContext(
			server,
			foundRoute.acl.loadPath,
			req,
			foundRouteParams as { [key: string]: string },
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
			// eslint-disable-next-line no-async-promise-executor
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

	public check(server: ServerApi): RequestHandler {
		return async (req: Request, res: Response, next: NextFunction) => {
			if (server.ignoreRoutes) return next();

			try {
				const routes = await this.getOrFetchRoutes(server);

				await this.checkAcl(server, routes, req);
			} catch (err) {
				if (err.message) {
					log.error(err.message);
				}
				return next(new N9Error('invalid-perms', 401));
			}
			return next();
		};
	}
}
