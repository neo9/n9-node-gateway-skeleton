import { N9Log } from '@neo9/n9-node-log';
import { N9Error } from '@neo9/n9-node-utils';
import { Express, NextFunction, Request, Response } from 'express';
import * as JWT from 'jsonwebtoken';
import { Conf } from '../../conf/index.models';
import { TokenContent } from '../../models/users/users.models';

export async function setJWTLoader(conf: Conf, log: N9Log, app: Express): Promise<void> {
	if (conf.jwt) {
		app.use((req: Request, res: Response, next: NextFunction) => {
			if (req.headers.authorization) {
				JWT.verify(req.headers.authorization as string, conf.jwt.secret, (err, decodedToken: TokenContent) => {
					if (err) {
						log.error('Error while decoding JWT ', err);
						next(new N9Error((err.message || 'unknown-error').replace(/ /g, '-'), 401));
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
