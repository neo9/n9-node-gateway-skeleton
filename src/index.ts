// eslint-disable-next-line import/no-extraneous-dependencies
import 'reflect-metadata';
// Add source map supports
// tslint:disable:no-import-side-effect
import 'source-map-support/register';

import n9NodeConf from '@neo9/n9-node-conf';
import type { Express } from 'express';
// eslint-disable-next-line import/no-extraneous-dependencies
import fastSafeStringify from 'fast-safe-stringify';
import { Server } from 'http';
// Dependencies
import n9NodeRouting, { Container, N9Log, N9NodeRouting } from 'n9-node-routing';
import { join } from 'path';

import { Conf } from './conf/index.models';
import * as Roles from './modules/acl/acl.roles';
import proxyMain from './modules/proxy/proxy.main';
import * as Session from './modules/sessions/sessions.main';

// Start method
async function start(confOverride: Partial<Conf> = {}): Promise<{ server: Server; conf: Conf }> {
	// Load project conf & set as global
	const conf = n9NodeConf({
		path: join(__dirname, 'conf'),
		extendConfig: {
			path: {
				relative: './env/env.json',
			},
			key: 'starterApi',
		},
		override: {
			value: confOverride,
		},
	}) as Conf;
	global.conf = conf;

	const log = new N9Log(conf.name, conf.log);
	global.log = log; // Load loaded configuration
	log.info(`Conf loaded: ${conf.env}`);

	// Profile startup boot time
	log.profile('startup');
	// print app infos
	const initialInfos = `${conf.name} version : ${conf.version} env: ${conf.env}`;
	log.info('-'.repeat(initialInfos.length));
	log.info(initialInfos);
	log.info('-'.repeat(initialInfos.length));

	Roles.defineRoles();

	const callbacksBeforeShutdown: N9NodeRouting.CallbacksBeforeShutdown[] = [];
	Container.set('callbacksBeforeShutdown', callbacksBeforeShutdown);

	// Load modules
	const { server } = await n9NodeRouting({
		hasProxy: true,
		path: join(__dirname, 'modules'),
		http: {
			...conf.http,
			beforeRoutingControllerLaunchHook: (app2: Express) => {
				log.info('Add JWT decoder');
				Session.setJWTLoader(conf, log, app2);

				log.info('Init proxy');
				proxyMain(conf, log, app2);
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
