---
title: Get Requests and Caching
sidebar_position: 6
---

Connect supports performing idempotent, side-effect free requests using an HTTP
GET-based protocol. This makes it easier to cache certain kinds of requests in
the browser, on your CDN, or in proxies and other middleboxes.

:::info
This functionality is **only** supported when using the Connect
protocol&mdash;using a Connect client with a Connect service. When using gRPC
clients with Connect servers, or Connect clients with gRPC servers, all
requests will use HTTP POST.

If you need HTTP GET support when talking to a vanilla gRPC server, you could
use a proxy. Envoy supports translating between Connect clients and gRPC servers
using the [Connect-gRPC Bridge][connect-grpc-bridge-docs].
:::

If you are using clients to make query-style requests, you may want the ability
to use Connect HTTP GET request support. To opt-in for a given procedure, you
must mark it as being side-effect free using the
[`MethodOptions.IdempotencyLevel`][idempotency-level] option:

```protobuf
service ElizaService {
  rpc Say(stream SayRequest) returns (SayResponse) {
    option idempotency_level = NO_SIDE_EFFECTS;
  }
}
```

Handlers will automatically support GET requests using this option, but ensure
you have a recent enough version of Connect Node; v0.9.0 or newer is required.

It is still necessary to opt-in to HTTP GET on your client, as well. If you are
using a Node client, you need to specify the `useHttpGet` option when creating
the Connect transport:

```js
const transport = createConnectTransport({
  baseUrl: "https://demo.connectrpc.com",
  useHttpGet: true,
});
const client = createPromiseClient(ElizaService, transport);
const response = await client.say(request);
console.log(response);
```

Methods annotated as side-effect free will use GET requests. All other requests
will continue to use POST.

For other clients, see their respective documentation pages:

- [Connect Go](../go/get-requests-and-caching.md)
- [Connect Web](../web/get-requests-and-caching.md)
- [Connect Kotlin](../kotlin/get-requests-and-caching.md)

## Caching

Using GET requests will not necessarily automatically make browsers or proxies
cache your RPCs. To ensure that requests are allowed to be cached, a handler
should also set the appropriate headers.

For example, you may wish to set the `Cache-Control` header with a `max-age`
directive:

```js
say(request, context) {
  // ...
  context.responseHeader.set("Cache-Control", "max-age=604800");
}
```

This would instruct agents and proxies that the request may be cached for up to
7 days, after which it must be re-requested. There are other
[`Cache-Control` Response Directives][cache-control-response-directives] that
may be useful for your application as well; for example, the `private` directive
would specify that the request should only be cached in private caches, such as
the user agent itself, and _not_ CDNs or reverse proxies&mdash;this would be
appropriate, for example, for authenticated requests.

## Distinguishing GET Requests

In some cases, you might want to introduce behavior that only occurs when
handling HTTP GET requests. This can be accomplished using
`context.requestMethod`:

```ts
if (context.requestMethod == "GET") {
  context.responseHeader.set("Cache-Control", "max-age=604800");
}
```

[connect-grpc-bridge-docs]: https://www.envoyproxy.io/docs/envoy/v1.26.0/configuration/http/http_filters/connect_grpc_bridge_filter#config-http-filters-connect-grpc-bridge
[idempotency-level]: https://github.com/protocolbuffers/protobuf/blob/e5679c01e8f47e8a5e7172444676bda1c2ada875/src/google/protobuf/descriptor.proto#L795
[cache-control-response-directives]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#response_directives
