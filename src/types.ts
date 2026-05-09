export type Env = {
	GATEWAY_BEARER_TOKEN?: string;
	FAMILY_SPARK_CHAT_ROOMS?: DurableObjectNamespace;
	FAMILY_SPARK_FAMILY_ACCOUNTS?: DurableObjectNamespace;
	TEST_OBJECTS?: DurableObjectNamespace;
};

export type NamespaceConfig = {
	readonly binding: keyof Env;
	readonly description: string;
};
