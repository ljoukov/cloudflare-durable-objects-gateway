import { isAuthorized } from './auth';
import { isNamespaceName, NAMESPACES } from './config';
import { corsHeaders, forwardedHeaders, json, withCors } from './http';
import type { Env } from './types';

const API_PREFIX = '/v1/namespaces/';

type RouteMatch = {
	namespace: string;
	objectName: string;
	objectPath: string;
};

function route(request: Request): RouteMatch | null {
	const url = new URL(request.url);
	if (!url.pathname.startsWith(API_PREFIX)) {
		return null;
	}

	const rest = url.pathname.slice(API_PREFIX.length);
	const marker = '/objects/';
	const markerIndex = rest.indexOf(marker);
	if (markerIndex <= 0) {
		return null;
	}

	const namespace = decodeURIComponent(rest.slice(0, markerIndex));
	const objectAndPath = rest.slice(markerIndex + marker.length);
	const slashIndex = objectAndPath.indexOf('/');
	if (slashIndex <= 0) {
		return null;
	}

	const objectName = decodeURIComponent(objectAndPath.slice(0, slashIndex));
	const rawPath = objectAndPath.slice(slashIndex);
	return {
		namespace,
		objectName,
		objectPath: rawPath || '/'
	};
}

function namespaceList(env: Env): Response {
	return json({
		namespaces: Object.entries(NAMESPACES)
			.filter(([, config]) => Boolean(env[config.binding]))
			.map(([name, config]) => ({
				name,
				description: config.description
			}))
	});
}

async function proxyRequest(request: Request, env: Env, match: RouteMatch): Promise<Response> {
	if (!isNamespaceName(match.namespace)) {
		return json({ error: 'unknown_namespace', message: 'Unknown Durable Object namespace.' }, { status: 404 });
	}

	const binding = env[NAMESPACES[match.namespace].binding];
	if (!binding || typeof binding !== 'object' || !('idFromName' in binding)) {
		return json(
			{ error: 'namespace_unbound', message: 'Durable Object namespace is not bound.' },
			{ status: 503 }
		);
	}

	const url = new URL(request.url);
	const objectUrl = new URL(`${match.objectPath}${url.search}`, 'https://durable-object-gateway.internal');
	const stub = binding.get(binding.idFromName(match.objectName));
	const method = request.method.toUpperCase();
	const body = method === 'GET' || method === 'HEAD' ? undefined : request.body;

	return await stub.fetch(objectUrl, {
		method,
		headers: forwardedHeaders(request.headers),
		body,
		redirect: 'manual'
	});
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: corsHeaders(request) });
	}

	if (!isAuthorized(request, env)) {
		return withCors(json({ error: 'unauthorized', message: 'Bearer token required.' }, { status: 401 }), request);
	}

	const url = new URL(request.url);
	if (url.pathname === '/v1/namespaces' && request.method === 'GET') {
		return withCors(namespaceList(env), request);
	}

	const match = route(request);
	if (!match) {
		return withCors(json({ error: 'not_found', message: 'Unknown gateway route.' }, { status: 404 }), request);
	}

	return withCors(await proxyRequest(request, env, match), request);
}
