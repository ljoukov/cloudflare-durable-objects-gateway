const HOP_BY_HOP_HEADERS = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade'
]);

const GATEWAY_HEADERS = new Set(['authorization', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray']);

export function json(body: unknown, init?: ResponseInit): Response {
	const headers = new Headers(init?.headers);
	headers.set('content-type', 'application/json; charset=utf-8');
	return new Response(JSON.stringify(body), { ...init, headers });
}

export function forwardedHeaders(source: Headers): Headers {
	const headers = new Headers();
	for (const [name, value] of source) {
		const lower = name.toLowerCase();
		if (
			lower === 'host' ||
			lower === 'content-length' ||
			HOP_BY_HOP_HEADERS.has(lower) ||
			GATEWAY_HEADERS.has(lower)
		) {
			continue;
		}
		headers.append(name, value);
	}
	return headers;
}

export function corsHeaders(request: Request): Headers {
	const headers = new Headers();
	const origin = request.headers.get('origin');
	if (origin) {
		headers.set('access-control-allow-origin', origin);
		headers.set('vary', 'Origin');
	}
	headers.set('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
	headers.set(
		'access-control-allow-headers',
		'authorization,content-type,accept,x-family-spark-user-id,x-family-spark-chat-id'
	);
	headers.set('access-control-max-age', '600');
	return headers;
}

export function withCors(response: Response, request: Request): Response {
	const headers = new Headers(response.headers);
	for (const [name, value] of corsHeaders(request)) {
		headers.set(name, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
