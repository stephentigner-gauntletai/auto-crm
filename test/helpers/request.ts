import { NextRequest } from 'next/server';
import type { RequestInit } from 'next/dist/server/web/spec-extension/request';
import { MockRequest } from 'node-mocks-http';

export function mockToNextRequest(mockReq: MockRequest): NextRequest {
	const url = new URL(mockReq.url || 'http://localhost');
	if (mockReq.query) {
		Object.entries(mockReq.query).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});
	}

	const init: RequestInit = {
		method: mockReq.method || 'GET',
		headers: new Headers(mockReq.headers as Record<string, string>),
		signal: undefined,
	};

	if (mockReq.body) {
		init.body = JSON.stringify(mockReq.body);
	}

	return new NextRequest(url, init);
}
