import { N9Log } from '@neo9/n9-node-log';
import { Express } from 'express';
import * as proxy from 'http-proxy-middleware';
import { Conf } from '../../conf/index.models';
import { ServerApi } from './proxy.models';
import * as Acl from '../acl/acl.main';

export default async function(conf: Conf, log: N9Log, app: Express): Promise<void> {
	if (global.conf && global.conf.api) {
		(global.conf.api as ServerApi[]).forEach((serv) => {
			app.use(serv.context + '*', Acl.check(serv));

			const proxyOptions = Object.assign({ target: serv.target }, serv.options, {
				logProvider: () => {
					return {
						log: log.info,
						debug: log.info,
						info: log.info,
						warn: log.warn,
						error: log.error
					};
				}
			});
			app.use(proxy([serv.context + '/**', '!**/routes'], proxyOptions));
		});
	}
}
