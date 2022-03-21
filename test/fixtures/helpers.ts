import { cb, Container, N9Error, N9HttpClient, N9Log, waitFor } from 'n9-node-routing';
import { join } from 'path';
import * as stdMocks from 'std-mocks';
import * as Mockito from 'ts-mockito';

import src from '../../src';
import { Conf } from '../../src/conf/index.models';

export const print = true;
export const context: { [key: string]: any } = {};

export const startAPI = async (confOverride?: Conf): Promise<void> => {
	stdMocks.use({ print });
	// Set env to 'test'
	process.env.NODE_ENV = 'test';
	// Start again (to init files)
	stdMocks.use({ print });
	const { server, conf } = await src({
		log: {
			formatJSON: false,
		},
		enableLogFormatJSON: false,
		...confOverride,
	});

	// Add variables to context
	context.server = server;
	context.conf = conf;
	// Flush logs output
	stdMocks.flush();
	stdMocks.restore();
};

export const stopAPI = async (): Promise<void> => {
	await cb(context.server.close.bind(context.server));
};

export const waitForHelper = async (durationMs: number): Promise<void> => {
	global.log.info(`Wait for ${durationMs / 1_000} s`);
	await waitFor(durationMs);
};

/* istanbul ignore next */
const url = (path: string | string[] = '/'): string | string[] => {
	if (Array.isArray(path)) return [`http://localhost:${context.conf.http.port}`, ...path];
	return `http://localhost:${context.conf.http.port}${join('/', path)}`;
};

type AnyConstructor = new (...args: any[]) => any;
// helper that takes a list of constructors and returns a list of instances
export function inject<T extends AnyConstructor[]>(
	...argsDefinitions: T
): {
	[K in keyof T]: T[K] extends AnyConstructor ? InstanceType<T[K]> : never;
};
export function inject<T extends any[]>(...argsDefinitions: T): any[] {
	const args = argsDefinitions.map((argsDefinition) => {
		return Container.get(argsDefinition);
	});
	return args as any;
}

export const getMockedName = (constr: AnyConstructor): string => `__mock__${constr.name}__`;

// override a service in the container
export function overrideService<T extends AnyConstructor>(serviceClass: T, instance: any): void {
	Container.remove(serviceClass);
	Container.set(serviceClass, instance);
}

// mock a service, register the service instance and the mock, and return the mocked service class
export function mockService<T extends AnyConstructor>(serviceClass: T): InstanceType<T> {
	const mockedServiceClass = Mockito.mock(serviceClass);
	Container.remove(serviceClass);
	Container.set(serviceClass, Mockito.instance(mockedServiceClass));
	Container.set(getMockedName(serviceClass), mockedServiceClass);
	return mockedServiceClass;
}

export async function wrapLogs<T>(
	apiCall: Promise<T>,
): Promise<{ body: T; err: N9Error; stdout: string[]; stderr: string[] }> {
	// Store logs output
	stdMocks.use({ print });
	// Call API & check response
	let body = null;
	let err = null;
	try {
		body = await apiCall;
	} catch (error) {
		err = error;
	}
	// Get logs output & check logs
	const { stdout, stderr } = stdMocks.flush();
	// Restore logs output
	stdMocks.restore();
	return { body, err, stdout, stderr };
}

function getHttpClient(responseType: 'text' | 'json'): N9HttpClient {
	return new N9HttpClient(global.log ?? new N9Log('test'), { responseType });
}

export async function get<T extends string | object = object>(
	path: string,
	responseType: 'text' | 'json' = 'json',
	queryParams?: Record<string, any>,
	headers?: Record<string, any>,
): Promise<{
	body: T;
	err: N9Error;
	stdout: string[];
	stderr: string[];
}> {
	const httpClient = getHttpClient(responseType);
	return await wrapLogs<T>(httpClient.get<T>(url(path), queryParams, headers));
}

export async function post<B = any, T = object>(
	path: string | string[],
	body: B,
	queryParams?: Record<string, any>,
	headers?: Record<string, any>,
): Promise<{
	body: T;
	err: N9Error;
	stdout: string[];
	stderr: string[];
}> {
	const httpClient = getHttpClient('json');
	return await wrapLogs<T>(
		httpClient.post<T>(url(path), body, queryParams, {
			session: JSON.stringify({ userId: '0' }),
			...headers,
		}),
	);
}

export async function put<B = any, T = object>(
	path: string | string[],
	body: B,
	queryParams?: Record<string, any>,
	headers?: Record<string, any>,
): Promise<{
	body: T;
	err: N9Error;
	stdout: string[];
	stderr: string[];
}> {
	const httpClient = getHttpClient('json');
	return await wrapLogs<T>(
		httpClient.put<T>(url(path), body, queryParams, {
			session: JSON.stringify({ userId: '0' }),
			...headers,
		}),
	);
}

export async function patch<B = any, T = object>(
	path: string | string[],
	body?: B,
	queryParams?: Record<string, any>,
	headers?: Record<string, any>,
): Promise<{
	body: T;
	err: N9Error;
	stdout: string[];
	stderr: string[];
}> {
	const httpClient = getHttpClient('json');
	return await wrapLogs<T>(
		httpClient.patch<T>(url(path), body, queryParams, {
			session: JSON.stringify({ userId: '0' }),
			...headers,
		}),
	);
}
