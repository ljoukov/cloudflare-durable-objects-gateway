import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import worker from '../src/index';

const BASE = 'https://gateway.test';
const AUTH = { authorization: 'Bearer test-token' };
const fetchWorker = worker.fetch as unknown as (request: Request, env: unknown) => Promise<Response>;

async function fetchGateway(path: string, init?: RequestInit): Promise<Response> {
	return await fetchWorker(
		new Request(`${BASE}${path}`, {
			...init,
			headers: {
				...AUTH,
				...(init?.headers ?? {})
			}
		}) as unknown as Request,
		env
	);
}

describe('gateway', () => {
	it('rejects requests without bearer auth', async () => {
		const response = await fetchWorker(
			new Request(`${BASE}/v1/namespaces`) as unknown as Request,
			env
		);
		expect(response.status).toBe(401);
		expect(await response.json()).toMatchObject({ error: 'unauthorized' });
	});

	it('lists configured namespaces when authorized', async () => {
		const response = await fetchGateway('/v1/namespaces');
		expect(response.status).toBe(200);
		const body = (await response.json()) as { namespaces: Array<{ name: string }> };
		expect(body.namespaces.some((namespace) => namespace.name === 'test-objects')).toBe(true);
	});

	it('forwards method, path, query, body, and selected headers to a Durable Object', async () => {
		const response = await fetchGateway('/v1/namespaces/test-objects/objects/session-1/echo?x=1', {
			method: 'POST',
			headers: {
				'content-type': 'text/plain',
				'x-test-user': 'alice'
			},
			body: 'hello'
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			method: 'POST',
			pathname: '/echo',
			search: '?x=1',
			body: 'hello',
			forwardedUser: 'alice',
			authorization: null
		});
	});

	it('forwards SSE responses without buffering them into JSON', async () => {
		const response = await fetchGateway('/v1/namespaces/test-objects/objects/session-1/events');
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/event-stream');
		expect(await response.text()).toContain('event: ready');
	});
});
