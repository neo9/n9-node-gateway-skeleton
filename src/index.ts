/* tslint:disable:ordered-imports */
import 'reflect-metadata';

import n9NodeConf from '@neo9/n9-node-conf';
// Dependencies
import n9NodeLog from '@neo9/n9-node-log';
import * as bodyParser from 'body-parser';
import { Express } from 'express';
import fastSafeStringify from 'fast-safe-stringify';
import { Server } from 'http';
import n9NodeRouting, { N9NodeRouting, Container } from 'n9-node-routing';
import { join } from 'path';
// Add source map supports
// tslint:disable:no-import-side-effect
import 'source-map-support/register';
import { Conf } from './conf/index.models';
import * as Roles from './modules/acl/acl.roles';
import * as Session from './modules/sessions/sessions.main';

// Start method
async function start(confOverride: Partial<Conf> = {}): Promise<{ server: Server; conf: Conf }> {
	// Load project conf & set as global
	const conf = (global.conf = n9NodeConf({
		path: join(__dirname, 'conf'),
		extendConfig: {
			key: 'starterApi',
			path: {
				relative: './env/env.yaml',
			},
		},
		override: {
			value: confOverride,
		},
	}) as Conf);

	const log = (global.log = n9NodeLog(conf.name, global.conf.log));
	// Load loaded configuration
	log.info(`Conf loaded: ${conf.env}`);

	// Profile startup boot time
	log.profile('startup');
	// print app infos
	const initialInfos = `${conf.name} version : ${conf.version} env: ${conf.env}`;
	log.info('-'.repeat(initialInfos.length));
	log.info(initialInfos);
	log.info('-'.repeat(initialInfos.length));

	const proxyMain = require('./modules/proxy/proxy.main').default;
	await Roles.defineRoles();

	const callbacksBeforeShutdown: N9NodeRouting.CallbacksBeforeShutdown[] = [];
	Container.set('callbacksBeforeShutdown', callbacksBeforeShutdown);

	// Load modules
	const { server } = await n9NodeRouting({
		hasProxy: true,
		path: join(__dirname, 'modules'),
		http: {
			...conf.http,
			beforeRoutingControllerLaunchHook: async (app2: Express) => {
				log.info('Add JWT decoder');
				await Session.setJWTLoader(conf, log, app2);

				log.info('Init proxy');
				await proxyMain(conf, log, app2);
			},
		},
		enableLogFormatJSON: conf.enableLogFormatJSON,
		openapi: conf.openapi,
		shutdown: {
			...conf.shutdown,
			callbacksBeforeShutdown,
		},
		prometheus: conf.metrics.isEnabled ? {} : undefined,
	});

	// Log the startup time
	log.profile('startup');
	// Return server and more for testing
	return { server, conf };
}

// Start server if not in test mode
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
	start()
		.then(() => {
			(global.log || console).info('Launch SUCCESS !');
		})
		.catch((e) => {
			(global.log || console).error(`Error on launch : `, { errString: fastSafeStringify(e) });
			throw e;
		});
}

export default start;
