import { N9Log } from 'n9-node-routing';

import { Conf } from './conf/index.models';

/* eslint-disable no-var,vars-on-top */
declare global {
	var conf: Conf;
	var log: N9Log;
}

export {};
