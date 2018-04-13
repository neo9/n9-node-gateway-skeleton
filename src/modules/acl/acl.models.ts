import * as RouteParser from 'route-parser';
import { Route } from 'routing-controllers-wrapper/dist/src/models/routes.models';

export interface RouteForAcl extends Route {
	matcher?: RouteParser;
}
