import { N9Log } from '@neo9/n9-node-log';
import { RoutingControllerWrapper } from 'routing-controllers-wrapper';

export interface Conf {
	api?: {
		name: string;
		context: string;
		target: string;
		options: {
			pathRewrite: any;
			changeOrigin: boolean;
		};
	}[];
	ecrm?: {
		url: string;
	};

	// n9-micro config
	http?: RoutingControllerWrapper.HttpOptions;
	jwt?: {
		secret: string,
		expiration: number,
	};
	log?: N9Log.Options;
	env?: string;
	name?: string;
	version?: string;

	// Custom config
	io?: {
		enabled: boolean;
	};
}
