import { Conf } from './index.models';

const conf: Conf = {
	http: {
		port: process.env.PORT || 8014,
		logLevel: 'dev', // log format for morgan
	},
	jwt: {
		secret: 'secret',
		expiration: 3600, // in seconds, 3600s == 1h
	},
	metrics: {
		isEnabled: true,
		waitDurationMs: 30 * 1_000,
	},
	api: [
		{
			name: 'ecrm',
			context: '/ecrm',
			target: 'http://ecrm-api:8080',
			options: {
				pathRewrite: {
					'^/ecrm': '',
				},
				changeOrigin: true,
			},
		},
	],
	ecrm: {
		url: 'http://mock-api:8015',
	},
};

export default conf;
