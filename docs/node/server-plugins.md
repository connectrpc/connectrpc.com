---
title: Server plugins
sidebar_position: 3
---

If you just need an API server, using a built-in Node.js server might be
sufficient, but Connect also supports several server frameworks on Node.js.

The following code snippets expect that you have already added a file `connect.ts` with your Connect RPCs to your
project. See [Implementing services](./implementing-services.md) for more information.


## Vanilla Node.js

Run your Connect RPCs on the Node.js built in HTTP modules with the function
`connectNodeAdapter()` from [@bufbuild/connect-node](https://www.npmjs.com/package/@bufbuild/connect-node):

```ts
import * as http from "http";
import routes from "./connect";
import { connectNodeAdapter } from "@bufbuild/connect-node";

http.createServer(
  connectNodeAdapter({ routes }) // responds with 404 for other requests
).listen(8080);
```

The function accepts all common options, and the following additional
ones:

- `fallback?: NodeHandlerFn`<br/>
  If none of the handler request paths match, a 404 is served. This option
  can provide a custom fallback for this case.
- `requestPathPrefix?: string`<br/>
  Serve all handlers under this prefix. For example, the prefix "/something"
  will serve the RPC foo.FooService/Bar under "/something/foo.FooService/Bar".
  Note that many gRPC client implementations do not allow for prefixes.


## Fastify

[Fastify](https://www.fastify.io/) is a fast and low overhead web framework,
for Node.js. We highly recommend it if you want to serve anything else along
with your Connect RPCs. Use the plugin from [@bufbuild/connect-fastify](https://www.npmjs.com/package/@bufbuild/connect-fastify)
with Fastify:

```ts
import { fastify } from "fastify";
import routes from "./connect";
import { fastifyConnectPlugin } from "@bufbuild/connect-fastify";

const server = fastify();

await server.register(fastifyConnectPlugin, {
 routes
});

await server.listen({
  host: "localhost",
  port: 8080,
});
```

The plugin accepts all common options.

## Next.js

[Next.js](https://nextjs.org/) is a framework supported by Vercel that enables creating full-stack web applications
using the latest React features. With [@bufbuild/connect-next](https://www.npmjs.com/package/@bufbuild/connect-next),
you can serve your Connect RPCs via Next.js API Routes.

To enable the server plugin, create the file `pages/api/[[...connect]].ts` in your project:

```ts
import { nextJsApiRouter } from "@bufbuild/connect-next";
import routes from "./connect";

const {handler, config} = nextJsApiRouter({ routes });
export {handler as default, config};
```

This file is a Next.js [catch-all API route](https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes). It will
serve your Connect RPCs with the `/api` prefix. Make sure to include the `/api` prefix in the `baseUrl` option for
your client transport.

Note that Next.js does not support the http2 module.

## Express

[Express](https://expressjs.com/) has been around for a long time, and it's still
popular because of its simplicity. Use the middleware provided by [@bufbuild/connect-express](https://www.npmjs.com/package/@bufbuild/connect-express)
to add your Connect RPCs to Express:

```ts
import http from "http";
import express from "express";
import routes from "./connect";
import { expressConnectMiddleware } from "@bufbuild/connect-express";

const app = express();

app.use(expressConnectMiddleware({
 routes
}));

http.createServer(app).listen(8080);
```

The middleware accepts all common options, and the following additional
one:

- `requestPathPrefix?: string`<br/>
Serve all handlers under this prefix. For example, the prefix "/something"
will serve the RPC foo.FooService/Bar under "/something/foo.FooService/Bar".
Note that many gRPC client implementations do not allow for prefixes.


Note that Express does not support the `http2` module.


## Common options

All adapters take a set of common options:

- `routes: (router: ConnectRouter) => void`<br/>
  The adapter will call this function, and lets you register your services.<br/>
  See [Implementing services](./implementing-services.md) for an example.
- `connect?: boolean`<br/>
  Whether to enable the Connect protocol for your routes. Enabled by default.
- `grpcWeb?: boolean`<br/>
  Whether to enable the gRPC protocol for your routes. Enabled by default.
- `grpc?: boolean`<br/>
  Whether to enable the gRPC protocol for your routes. Enabled by default.


## HTTP/2, TLS, and gRPC

All examples above use HTTP 1.1 without TLS (Transport Layer Security).

This works just fine for browsers and Connect clients, but most gRPC clients
require HTTP/2. If you want gRPC clients and browsers, you need HTTP/2 and TLS:

|                  | Web browsers | Connect | gRPC-web | gRPC |
|------------------|--------------|---------|----------|------|
| HTTP/2 + TLS     | ✓            | ✓       | ✓        | ✓    |
| HTTP/2 cleartext |              | ✓       | ✓        | ✓    |
| HTTP 1.1         | ✓            | ✓       | ✓        |      |

TLS is usually used to negotiate the HTTP protocol version for a connection.
Without TLS, you have to tell the client which HTTP version it should use.
For example, you would use the flag `--http2-prior-knowledge` with cURL or
`buf curl`.

Unfortunately, web browsers do not have such a flag, and flat out refuse HTTP/2
over cleartext. If you want to use gRPC clients _and_ browser clients during
local development, we recommend to set up locally-trusted development
certificates and run HTTP/2 with TLS. This actually only takes a minute to set
up if you follow the steps in [Getting Started](getting-started.md#use-the-grpc-protocol-instead-of-the-connect-protocol).

## CORS

If your browser client makes a request to a different host or port, the browser
will send a preflight request first, and will let the server decide whether the
actual request should be allowed. This mechanism is called Cross-Origin Resource
Sharing, or CORS.

If your server is not set up to handle CORS preflight requests, you will see an
error like `Failed to fetch` in the browser, or response headers sent by your
server will be invisible to your client.

The `cors` object from [`@bufbuild/connect`](https://www.npmjs.com/package/@bufbuild/connect)
helps to configure common middleware packages. The following example shows how
to use it with [Fastify](#fastify):

```ts
import fastifyCors from "@fastify/cors";
import { cors } from "@bufbuild/connect";

await server.register(fastifyCors, {
  origin: "https://demo.connectrpc.com",
  methods: cors.allowedMethods,
  allowedHeaders: [
    ...cors.allowedHeaders,
    "Custom-Request-Header"
  ],
  exposedHeaders: [
    ...cors.exposedHeaders,
    "Custom-Response-Header",
    "Trailer-Response-Id",
  ],
  // Let browsers cache CORS information to reduce the number of
  // preflight requests. Modern Chrome caps the value at 2h.
  maxAge: 2 * 60 * 60
});
```

Make sure to include application-specific request headers in the allowed headers,
and response headers in the exposed headers. If your application uses trailers,
they will be sent as header fields with a `Trailer-` prefix for Connect unary RPCs.

For additional examples using CORS with the various flavors of Node.js servers,
see the [Express](https://github.com/bufbuild/connect-es-integration/tree/main/express)
and [Vanilla Node](https://github.com/bufbuild/connect-es-integration/tree/main/vanilla-node)
examples in the [Connect ES Integration](https://github.com/bufbuild/connect-es-integration)
repository.
