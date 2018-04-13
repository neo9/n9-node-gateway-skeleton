import { Conf } from './index';

const conf: Conf = {
	http: {
		port: process.env.PORT,
		logLevel: 'dev', // log format for morgan
		routingController: {
			classTransformer: false,
		}
	},
	jwt: {
		secret: 'secret',
		expiration: 3600 // in seconds, 3600s == 1h
	},
	api: [
		{
			name: 'pcm',
			context: '/pcm',
			target: 'http://pim-pcm-api:8011',
			options: {
				pathRewrite: {
					"^/pcm": ""
				},
				changeOrigin: true
			}
		}
	]
};

export default conf;
