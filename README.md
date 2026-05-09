# Cloudflare Durable Objects Gateway

Bearer-authenticated HTTP gateway for explicitly configured Cloudflare Durable Object namespaces.

The gateway is useful when a local app cannot use a remote Durable Object binding directly. Run the app normally in local development, and let it call this deployed Worker over HTTPS. The gateway validates a bearer token, resolves a configured namespace, and forwards the request to the chosen Durable Object instance.

## API

All routes require:

```http
Authorization: Bearer <token>
```

Forward a request to an object by name:

```text
<METHOD> /v1/namespaces/:namespace/objects/:objectName/:path*
```

Examples:

```text
GET  /v1/namespaces/family-spark-chat-rooms/objects/<object-name>/state
GET  /v1/namespaces/family-spark-chat-rooms/objects/<object-name>/events
POST /v1/namespaces/family-spark-chat-rooms/objects/<object-name>/message
POST /v1/namespaces/family-spark-chat-rooms/objects/<object-name>/stop
```

The gateway forwards request method, query string, body, and most headers. It removes hop-by-hop headers and its own `Authorization` header before calling the Durable Object.

## Object Lifetime

There is no generic Durable Object "release" operation in Cloudflare Workers. Instances are created on demand and evicted from memory by Cloudflare when idle. For streaming requests, closing the browser `EventSource` or aborting the HTTP request closes the upstream stream; the target Durable Object receives normal stream cancellation.

If a specific Durable Object API supports explicit cleanup, call that object-specific path through the gateway.

## Configuration

`wrangler.jsonc` statically maps public namespace names to Durable Object bindings. Add one binding per external DO namespace.

The deployed Worker needs a secret:

```sh
wrangler secret put GATEWAY_BEARER_TOKEN
```

Do not commit tokens, API keys, account IDs, or deployment URLs.

## Development

```sh
npm install
npm test
npm run typecheck
npm run deploy
```

## License

MIT
