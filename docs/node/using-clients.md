---
title: Using clients
sidebar_position: 5
---

On Node.js, you use the same clients as you do with Connect for Web, but with
a transport from [@connectrpc/connect-node](https://www.npmjs.com/package/@connectrpc/connect-node)
instead of from [@connectrpc/connect-web](https://www.npmjs.com/package/@connectrpc/connect-web):

```typescript
import { createClient } from "@connectrpc/connect";
// highlight-next-line
import { createConnectTransport } from "@connectrpc/connect-node";

// highlight-next-line
const transport = createConnectTransport({
// highlight-next-line
  httpVersion: "1.1",
// highlight-next-line
  baseUrl: "http://demo.connectrpc.com",
// highlight-next-line
});

async function main() {
  const client = createClient(ElizaService, transport);
  const res = await client.say({
    sentence: "I feel happy.",
  });
  console.log(res.sentence);
}
void main();
```

For details on clients (including error handling, interceptors, and accessing
headers and trailers), please refer to the documentation for [Web](../web/using-clients).

Under the hood, the transports from [@connectrpc/connect-node](https://www.npmjs.com/package/@connectrpc/connect-node)
use the built-in Node modules `http`, `https`, and `http2` instead of the fetch
API. With HTTP/2, clients can use the Connect, gRPC, or gRPC-Web protocol, and 
call all types of RPCs. With HTTP 1.1, the gRPC protocol and bidirectional 
streaming are not supported.

## Connect

The function `createConnectTransport()` creates a transport for the [Connect
protocol](/docs/protocol).
The most important options for the Connect transport are as follows:

```ts
import { createConnectTransport } from "@connectrpc/connect-node";

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
import { createGrpcTransport } from "@connectrpc/connect-node";

const transport = createGrpcTransport({
  // Requests will be made to <baseUrl>/<package>.<service>/method
  baseUrl: "https://demo.connectrpc.com",

  // Interceptors apply to all calls running through this transport.
  interceptors: [],
});
```

:::note
The gRPC transport requires HTTP/2.
:::

## gRPC-web

The function `createGrpcWebTransport()` creates a Transport for the gRPC-web
protocol. Any gRPC service can be made available to gRPC-web with the
[Envoy Proxy](https://www.envoyproxy.io/). ASP.NET Core supports gRPC-web with
a [middleware](https://docs.microsoft.com/en-us/aspnet/core/grpc/browser?view=aspnetcore-6.0).
Connect for Node and `connect-go` support gRPC-web out of the box.

```ts
import { createGrpcWebTransport } from "@connectrpc/connect-node";

const transport = createGrpcWebTransport({
  // Requests will be made to <baseUrl>/<package>.<service>/method
  baseUrl: "https://demo.connectrpc.com",

  // You have to tell the Node.js http API which HTTP version to use.
  httpVersion: "2",

  // Interceptors apply to all calls running through this transport.
  interceptors: [],
});
```
