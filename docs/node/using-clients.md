---
title: Using clients
sidebar_position: 4
---

On Node.js, you use the same clients as you do with Connect for Web, but with
a transport from [@bufbuild/connect-node](https://www.npmjs.com/package/@bufbuild/connect-node)
instead of from [@bufbuild/connect-web](https://www.npmjs.com/package/@bufbuild/connect-web):

```typescript
import { createPromiseClient } from "@bufbuild/connect";
// highlight-next-line
import { createConnectTransport } from "@bufbuild/connect-node";

// highlight-next-line
const transport = createConnectTransport({
// highlight-next-line
  httpVersion: "1.1",
// highlight-next-line
  baseUrl: "http://demo.connectrpc.com",
// highlight-next-line
});

async function main() {
  const client = createPromiseClient(ElizaService, transport);
  const res = await client.say({
    sentence: "I feel happy.",
  });
  console.log(res.sentence);
}
void main();
```

For details on clients (including error handling, interceptors, and accessing
headers and trailers), please refer to the documentation for [Web](../web/using-clients).

Under the hood, the transports from [@bufbuild/connect-node](https://www.npmjs.com/package/@bufbuild/connect-node)
use the built-in Node modules `http`, `https`, and `http2` instead of the fetch
API. The allows us to provide a transport for gRPC and bidi streaming. Node.js
v18 comes with fetch(), but it is limited to HTTP 1.1.


## Connect

The function `createConnectTransport()` creates a transport for the [Connect
protocol](/docs/protocol).
The most important options for the Connect transport are as follows:

```ts
import { createConnectTransport } from "@bufbuild/connect-node";

const transport = createConnectTransport({
  // Requests will be made to <baseUrl>/<package>.<service>/method
  baseUrl: "https://demo.connectrpc.com",

  // You have to tell the Node.js http API which HTTP version to use.
  httpVersion: "2",

  // Interceptors apply to all calls running through this transport.
  interceptors: [],
});
```


## gRPC

The function `createGrpcTransport()` creates a transport for the gRPC protocol.
The most important options for the gRPC transport are as follows:

```ts
import { createGrpcTransport } from "@bufbuild/connect-node";

const transport = createGrpcTransport({
  // Requests will be made to <baseUrl>/<package>.<service>/method
  baseUrl: "https://demo.connectrpc.com",

  // You have to tell the Node.js http API which HTTP version to use.
  httpVersion: "2",

  // Interceptors apply to all calls running through this transport.
  interceptors: [],
});
```



## gRPC-web

The function `createGrpcWebTransport()` creates a Transport for the gRPC-web
protocol. Any gRPC service can be made available to gRPC-web with the
[Envoy Proxy](https://www.envoyproxy.io/). ASP.NET Core supports gRPC-web with
a [middleware](https://docs.microsoft.com/en-us/aspnet/core/grpc/browser?view=aspnetcore-6.0).
Connect for Node and `connect-go` support gRCP-web out of the box.

```ts
import { createGrpcWebTransport } from "@bufbuild/connect-node";

const transport = createGrpcWebTransport({
  // Requests will be made to <baseUrl>/<package>.<service>/method
  baseUrl: "https://demo.connectrpc.com",

  // You have to tell the Node.js http API which HTTP version to use.
  httpVersion: "2",

  // Interceptors apply to all calls running through this transport.
  interceptors: [],
});
```
