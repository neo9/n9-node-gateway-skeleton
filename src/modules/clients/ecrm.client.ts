import { Inject, N9Error, N9HttpClient, N9Log, Service } from 'n9-node-routing';

import { Conf } from '../../conf/index.models';
import { User } from '../../models/users/users.models';

@Service()
export class EcrmClient {
	@Inject('N9HttpClient')
	private httpClient: N9HttpClient;

	@Inject('conf')
	private readonly conf: Conf;

	@Inject('logger')
	private readonly logger: N9Log;

	constructor() {
		this.conf = global.conf;
	}

	public async getUserById(userId: string): Promise<User> {
		try {
			return await this.httpClient.get<User>([this.conf.ecrm.url, 'ecrm', 'users', userId]);
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
