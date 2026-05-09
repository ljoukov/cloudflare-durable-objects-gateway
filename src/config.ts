import type { NamespaceConfig } from './types';

export const NAMESPACES = {
	'family-spark-chat-rooms': {
		binding: 'FAMILY_SPARK_CHAT_ROOMS',
		description: 'Family Spark chat room Durable Objects'
	},
	'test-objects': {
		binding: 'TEST_OBJECTS',
		description: 'Local integration-test Durable Objects'
	}
} as const satisfies Record<string, NamespaceConfig>;

export type NamespaceName = keyof typeof NAMESPACES;

export function isNamespaceName(value: string): value is NamespaceName {
	return Object.hasOwn(NAMESPACES, value);
}
