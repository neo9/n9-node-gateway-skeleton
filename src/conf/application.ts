import { Conf } from './index';

const conf: Conf = {
	http: {
		port: process.env.PORT,
		logLevel: 'dev', // log format for morgan
		routingController: {
			classTransformer: false,
		}
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
