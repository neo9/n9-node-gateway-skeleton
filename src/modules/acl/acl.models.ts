import { Route } from 'n9-node-routing/dist/src/models/routes.models';
import * as RouteParser from 'route-parser';

export interface RouteForAcl extends Route {
	matcher?: RouteParser;
}
