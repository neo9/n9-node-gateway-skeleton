import type { Express } from 'express';
import * as proxy from 'http-proxy-middleware';
import { Container, N9Log } from 'n9-node-routing';

import { Conf } from '../../conf/index.models';
import { AclService } from '../acl/acl.service';
import { ServerApi } from './proxy.models';

declare type Logger = (...args: any[]) => void;
interface LogProvider {
	log: Logger;
	debug?: Logger;
	info?: Logger;
	warn?: Logger;
	error?: Logger;
}

export default (conf: Conf, log: N9Log, app: Express): void => {
	const aclService: AclService = Container.get(AclService);
	if (global.conf && global.conf.api) {
		(global.conf.api as ServerApi[]).forEach((serv) => {
			app.use(`${serv.context}*`, aclService.check(serv));

			const proxyOptions = {
				target: serv.target,
				...serv.options,
				logProvider: (): LogProvider => {
					return {
						log: log.info,
						debug: log.info,
						info: log.info,
						warn: log.warn,
						error: log.error,
					};
				},
			};
			app.use(proxy.createProxyMiddleware([`${serv.context}/**`, '!**/routes'], proxyOptions));
		});
	}
};
