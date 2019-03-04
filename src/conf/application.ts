import { Conf } from './index.models';

const conf: Conf = {
	http: {
		port: process.env.PORT || 8014,
		logLevel: 'dev', // log format for morgan
	},
	jwt: {
		secret: 'secret',
		expiration: 3600 // in seconds, 3600s == 1h
	},
	api: [
		{
			name: 'pcm',
			context: '/pcm',
			target: 'http://pcm-api:8011',
			options: {
				pathRewrite: {
					"^/pcm": ""
				},
				changeOrigin: true
			}
		}
	],
	ecrm: {
		url: 'http://mock-api:8015',
	}
};

export default conf;
