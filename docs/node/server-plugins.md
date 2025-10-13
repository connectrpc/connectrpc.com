---
title: Server plugins
sidebar_position: 3
---

If you just need an API server, using a built-in Node.js server might be
sufficient, but Connect also supports several server frameworks on Node.js.

The following code snippets expect that you've already added a `connect.ts` file with your Connect RPCs to your
project. See [Implementing services](./implementing-services.md) for more.


## Vanilla Node.js

Run your Connect RPCs on the Node.js built-in HTTP modules with
`connectNodeAdapter()` from [@connectrpc/connect-node](https://www.npmjs.com/package/@connectrpc/connect-node):

```ts
import * as http from "http";
import routes from "./connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import { createValidateInterceptor } from "@connectrpc/validate";

http.createServer(
  connectNodeAdapter({
    // Validation via Protovalidate is almost always recommended
    interceptors: [createValidateInterceptor()],
    // responds with 404 for other requests
    routes
  })
).listen(8080);
```

The function accepts all [common options](#common-options) as well as:

- `fallback?: NodeHandlerFn`<br/>
  If none of the handler request paths match, a 404 is served. This option
  can provide a custom fallback for this case.
- `requestPathPrefix?: string`<br/>
  Serve all handlers under this prefix. For example, the prefix "/something"
  will serve the RPC foo.FooService/Bar under "/something/foo.FooService/Bar".
  Note that many gRPC client implementations do not allow for prefixes.
- `contextValues?: (req: NodeServerRequest) => ContextValues`<br/>
  A function that returns a set of context values for each request. The
  context values are passed to the service implementation. See
  [Context values](./interceptors.md#context-values) for more information.

#### Node Protocol Support by HTTP Version

Over HTTP/2, Node.js can serve the Connect, gRPC, and gRPC-Web protocols with
all types of RPCs.
Over HTTP 1.1, the gRPC protocol and bidirectional streaming RPCs are not
supported.

## Fastify

[Fastify](https://www.fastify.io/) is a fast and low overhead web framework
for Node.js. We highly recommend it if you want to serve anything else along
with your Connect RPCs. Use the plugin from [@connectrpc/connect-fastify](https://www.npmjs.com/package/@connectrpc/connect-fastify)
with Fastify:

```bash
$ npm install fastify @connectrpc/connect @connectrpc/connect-node @connectrpc/connect-fastify
```

```ts
import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import { createValidateInterceptor } from "@connectrpc/validate";
import routes from "./connect";

async function main() {
    const server = fastify();
    await server.register(fastifyConnectPlugin, {
        // Validation via Protovalidate is almost always recommended
        interceptors: [createValidateInterceptor()],
        routes,
    });
    await server.listen({ host: "localhost", port: 8080 });
}
// You can remove the main() wrapper if you set type: module in your package.json,
// and update your tsconfig.json with target: es2017 and module: es2022.
void main();
```

The plugin accepts all [common options](#common-options) as well as:
- `shutdownTimeoutMs?: number`<br/>
  If set, the server will wait for the specified duration before aborting any 
  in-flight requests once [`fastify.close`](https://fastify.dev/docs/latest/Reference/Server/#close) is called.
- `shutdownError?: unknown`<br/>
  The reason to use when shutdown occurs. Note that if this is a `ConnectError` it will
  be sent to the client.
- `contextValues?: (req: FastifyRequest) => ContextValues`<br/>
  A function that returns a set of context values for each request. The
  context values are passed to the service implementation. See
  [Context values](./interceptors.md#context-values) for more information.

#### Fastify Protocol Support by HTTP Version

Over HTTP/2, Fastify can serve the Connect, gRPC, and gRPC-Web protocols with
all types of RPCs.
Over HTTP 1.1, the gRPC protocol and bidirectional streaming are not supported.

## Next.js

[Next.js](https://nextjs.org/) is a framework supported by Vercel that enables creating full-stack web applications
using the latest React features. With [@connectrpc/connect-next](https://www.npmjs.com/package/@connectrpc/connect-next),
you can serve your Connect RPCs via Next.js API Routes.

```bash
$ npm install next@"^13.0.0" @connectrpc/connect @connectrpc/connect-node @connectrpc/connect-next
```

To enable the server plugin, create the file `pages/api/[[...connect]].ts` in your project:

```ts
import { nextJsApiRouter } from "@connectrpc/connect-next";
import { createValidateInterceptor } from "@connectrpc/validate";
import routes from "./connect";

const {handler, config} = nextJsApiRouter({
    // Validation via Protovalidate is almost always recommended
    interceptors: [createValidateInterceptor()],
    routes
});
export {handler as default, config};
```

This file is a Next.js [catch-all API route](https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes). It will
serve your Connect RPCs with the `/api` prefix. Make sure to include the `/api` prefix in the `baseUrl` option for
your client transport.

The middleware accepts all [common options](#common-options) as well as:

- `prefix?: string`<br/>
  Serve all handlers under this prefix. For example, the prefix "/something"
  will serve the RPC foo.FooService/Bar under "/something/foo.FooService/Bar".
  By default, this is `/api` for Next.js.<br/>
  Note that many gRPC client implementations do not allow for prefixes.
- `contextValues?: (req: NextApiRequest) => ContextValues`<br/>
  A function that returns a set of context values for each request. The
  context values are passed to the service implementation. See
  [Context values](./interceptors.md#context-values) for more information.

#### Next.js Protocol Support

Next.js does not support the `http2` module. You can serve the Connect protocol 
and gRPC-Web. The gRPC protocol and bidirectional streaming are not supported.

## Express

[Express](https://expressjs.com/) has been around for a long time, and it's still
popular because of its simplicity. Use the middleware provided by [@connectrpc/connect-express](https://www.npmjs.com/package/@connectrpc/connect-express)
to add your Connect RPCs to Express:

```bash
$ npm install express @connectrpc/connect @connectrpc/connect-node @connectrpc/connect-express
```

```ts
import http from "http";
import express from "express";
import routes from "./connect";
import { expressConnectMiddleware } from "@connectrpc/connect-express";
import { createValidateInterceptor } from "@connectrpc/validate";

const app = express();

app.use(expressConnectMiddleware({
  // Validation via Protovalidate is almost always recommended
  interceptors: [createValidateInterceptor()],
  // responds with 404 for other requests
  routes
}));

http.createServer(app).listen(8080);
```

The middleware accepts all [common options](#common-options) as well as:

- `requestPathPrefix?: string`<br/>
  Serve all handlers under this prefix. For example, the prefix "/something"
  will serve the RPC foo.FooService/Bar under "/something/foo.FooService/Bar".
  Note that many gRPC client implementations do not allow for prefixes.
- `contextValues?: (req: express.Request) => ContextValues`<br/>
  A function that returns a set of context values for each request. The
  context values are passed to the service implementation. See
  [Context values](./interceptors.md#context-values) for more information.

#### Express Protocol Support

Express does not support the `http2` module. You can serve the Connect protocol 
and gRPC-Web. The gRPC protocol and bidirectional streaming RPCs are not 
supported.

## Common options

All adapters take a set of common options:

- `routes: (router: ConnectRouter) => void`
  The adapter will call this function, and lets you register your services.
  See [Implementing services](./implementing-services.md) for an example.
- `maxTimeoutMs?: number`
  The maximum value for [timeouts](./timeouts) that clients may specify.
  If a client requests a timeout that is greater than `maxTimeoutMs`,
  the server responds with the error code `invalid_argument`.
- `connect?: boolean`
  Whether to enable the Connect protocol for your routes. Enabled by default.
- `grpcWeb?: boolean`
  Whether to enable the gRPC-web protocol for your routes. Enabled by default.
- `grpc?: boolean`
  Whether to enable the gRPC protocol for your routes. Enabled by default.
- `interceptors?: Interceptor[]`
  An array of interceptors to apply to all requests. See [Interceptors](./interceptors.md) for more information.
- `jsonOptions`
  Protobuf [JSON serialization options](https://github.com/bufbuild/protobuf-es/blob/v2.2.1/MANUAL.md#json-serialization-options).
  If your service uses `google.protobuf.Any`, provide a `typeRegistry` with the
  allowed message types.
- `binaryOptions`
  Protobuf [binary serialization options](https://github.com/bufbuild/protobuf-es/blob/v2.2.1/MANUAL.md#binary-serialization-options).


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
certificates and run HTTP/2 with TLS. This only takes a minute to set
up if you follow the steps in [Getting Started](getting-started.md#use-the-grpc-protocol-instead-of-the-connect-protocol).

## CORS

If your browser client makes a request to a different host or port, the browser
will send a preflight request first, and will let the server decide whether the
actual request should be allowed. This mechanism is called Cross-Origin Resource
Sharing, or CORS.

If your server is not set up to handle CORS preflight requests, you will see an
error like `Failed to fetch` in the browser, or response headers sent by your
server will be invisible to your client.

The `cors` object from [`@connectrpc/connect`](https://www.npmjs.com/package/@connectrpc/connect)
helps to configure common middleware packages. The following example shows how
to use it with [Fastify](#fastify):

```ts
import fastifyCors from "@fastify/cors";
import { cors } from "@connectrpc/connect";

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
see the [Express](https://github.com/connectrpc/examples-es/tree/main/express)
and [Vanilla Node](https://github.com/connectrpc/examples-es/tree/main/vanilla-node)
examples in the [examples-es](https://github.com/connectrpc/examples-es)
repository.
