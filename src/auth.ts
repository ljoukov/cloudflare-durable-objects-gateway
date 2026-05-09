import type { Env } from './types';

const BEARER_PREFIX = 'Bearer ';

function timingSafeEqual(left: string, right: string): boolean {
	const leftBytes = new TextEncoder().encode(left);
	const rightBytes = new TextEncoder().encode(right);
	const maxLength = Math.max(leftBytes.length, rightBytes.length);
	let diff = leftBytes.length ^ rightBytes.length;

	for (let index = 0; index < maxLength; index += 1) {
		diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
	}

	return diff === 0;
}

export function isAuthorized(request: Request, env: Env): boolean {
	const expected = env.GATEWAY_BEARER_TOKEN;
	if (!expected) {
		return false;
	}
	const authorization = request.headers.get('authorization') ?? '';
	if (!authorization.startsWith(BEARER_PREFIX)) {
		return false;
	}
	return timingSafeEqual(authorization.slice(BEARER_PREFIX.length), expected);
}
