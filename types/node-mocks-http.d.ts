declare module 'node-mocks-http' {
	import { IncomingHttpHeaders } from 'http';

	export interface MockRequest {
		method?: string;
		url?: string;
		headers?: IncomingHttpHeaders;
		query?: Record<string, string>;
		body?: Record<string, unknown>;
	}

	export interface MockResponse {
		_getStatusCode(): number;
		_getData(): string;
	}

	export function createMocks(options: {
		method?: string;
		url?: string;
		query?: Record<string, string>;
		body?: Record<string, unknown>;
	}): { req: MockRequest; res: MockResponse };
}
