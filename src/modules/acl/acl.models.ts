import * as RouteParser from 'route-parser';
import { Route } from 'n9-node-routing/dist/src/models/routes.models';

export interface RouteForAcl extends Route {
	matcher?: RouteParser;
}
