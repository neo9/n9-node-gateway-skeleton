import n9NodeLog from '@neo9/n9-node-log';
import { cb, N9Error } from '@neo9/n9-node-utils';
import { Server } from 'http';
import { N9HttpClient } from 'n9-node-routing';
import { join } from 'path';
import * as stdMocks from 'std-mocks';
import src from '../../src';
import { Conf } from '../../src/conf/index.models';

export interface TestContext {
	server: Server;
	session: string;
	conf: Conf;
}
export let context: Partial<TestContext> = {};

/* istanbul ignore next */
const url = (path: string = '/') => `http://localhost:${context.conf.http.port}${join('/', path)}`;

export async function get<T extends string | object = object>(
	path: string,
	responseType: 'text' | 'json' = 'json',
	queryParams?: object,
	headers?: object,
): Promise<{
	body: T;
	err: N9Error;
	stdout: string[];
	stderr: string[];
}> {
	const httpClient = getHttpClient(responseType);
	return await wrapLogs<T>(httpClient.get<T>(url(path), queryParams, headers));
}

// istanbul ignore next
export async function post<T>(
	path: string,
	body: any,
): Promise<{
	body: T;
	err: N9Error;
	stdout: string[];
	stderr: string[];
}> {
	const httpClient = getHttpClient('json');
	return await wrapLogs<T>(httpClient.post<T>(url(path), body));
}

// istanbul ignore next
export async function put<T>(
	path: string,
	body: any,
): Promise<{
	body: T;
	err: N9Error;
	stdout: string[];
	stderr: string[];
}> {
	const httpClient = getHttpClient('json');
	return await wrapLogs<T>(httpClient.put<T>(url(path)));
}

export const startAPI = async () => {
	stdMocks.use();
	// Set env to 'test'
	process.env.NODE_ENV = 'test';
	// Start again (to init files)

	const { server, conf } = await src({});

	// Add variables to t.context
	context.server = server;
	context.conf = conf;
	// Flush logs output
	stdMocks.flush();
	stdMocks.restore();
};

export const stopAPI = async () => {
	await cb(context.server.close.bind(context.server));
};

async function wrapLogs<T>(
	apiCall: Promise<T>,
): Promise<{ body: T; err: N9Error; stdout: string[]; stderr: string[] }> {
	// Store logs output
	stdMocks.use();
	// Call API & check response
	let body = null;
	let err = null;
	try {
		body = await apiCall;
	} catch (error) {
		err = error;
	}
	// Get logs ouput & check logs
	const { stdout, stderr } = stdMocks.flush();
	// Restore logs output
	stdMocks.restore();
	return { body, err, stdout, stderr };
}

function getHttpClient(responseType: 'text' | 'json'): N9HttpClient {
	return new N9HttpClient(global.log ?? n9NodeLog('test'), { responseType });
}
