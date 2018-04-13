import { N9Log } from '@neo9/n9-node-log';
import { Request, Response, Express, NextFunction } from 'express';
import { Conf } from '../../conf';
import * as Acl from '../acl/acl.main';
import { ServerApi } from '../proxy/proxy.models';
import * as JWT from 'jsonwebtoken';

export async function setJWTLoader(conf: Conf, log: N9Log, app: Express): Promise<void> {
	if (conf.jwt) {
		app.use((req: Request, res: Response, next: NextFunction) => {
			if (req.headers.authorization) {
				JWT.verify(req.headers.authorization as string, conf.jwt.secret, (err, decodedToken) => {
					if (err) {
						next(err);
					} else {
						req.headers.session = JSON.stringify(decodedToken);
						next();
					}
				});
			} else {
				next();
			}
		});
	}
}
