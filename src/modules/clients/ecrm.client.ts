import { N9Log } from '@neo9/n9-node-log';
import { N9Error } from '@neo9/n9-node-utils';
import { CoreOptions, Request, RequestAPI, RequiredUriUrl } from 'request';
import * as request from 'request-promise-native';
import { Service } from "typedi";
import * as UrlJoin from "url-join";
import { Conf } from '../../conf';
import { User } from 'pim-commons';

@Service()
export class EcrmClient {

	private readonly logger: N9Log;
	private readonly requestDefault: RequestAPI<Request, CoreOptions, RequiredUriUrl>;
	private readonly conf: Conf;

	constructor() {
		this.conf = global.conf;
		this.logger = global.log.module('ecrm-client');
		this.requestDefault = request.defaults({
			useQuerystring: true,
			json: true,
			resolveWithFullResponse: true,
			gzip: true
		});
	}

	public async getUserById(userId: string): Promise<User> {
		try {
			const res = await this.requestDefault({
				uri: UrlJoin(this.conf.ecrm.url, '/ecrm/users/' + userId)
			});

			return res.body as any;
		} catch (e) {
			this.logger.error(`Error on get user by id : ${userId}`, e);
			if (e.error) {
				throw new N9Error(e.error.code, e.statusCode);
			} else {
				throw e;
			}
		}
	}
}
