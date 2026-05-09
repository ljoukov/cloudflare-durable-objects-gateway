import { DurableObject } from 'cloudflare:workers';
import { handleRequest } from './gateway';
import type { Env } from './types';

export { handleRequest };

export class TestDurableObject extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === '/echo') {
			return Response.json({
				method: request.method,
				pathname: url.pathname,
				search: url.search,
				body: request.method === 'GET' ? null : await request.text(),
				forwardedUser: request.headers.get('x-test-user'),
				authorization: request.headers.get('authorization')
			});
		}

		if (url.pathname === '/events') {
			const stream = new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(new TextEncoder().encode('event: ready\ndata: {"ok":true}\n\n'));
					controller.close();
				}
			});
			return new Response(stream, {
				headers: { 'content-type': 'text/event-stream; charset=utf-8' }
			});
		}

		return new Response('not found', { status: 404 });
	}
}

export default {
	async fetch(request, env) {
		return await handleRequest(request, env);
	}
} satisfies ExportedHandler<Env>;
