---
title: Testing
sidebar_position: 5
---

## Testing clients

Testing clients can be a crucial part of ensuring their functionality and performance. However, it may not always be
feasible or desirable to test against an actual API. In such cases, you can utilize a mocked Connect backend to test
your application using Connect's `createRouterTransport` function.

### Mocking Transports

The function `createRouterTransport` from `@connectrpc/connect` creates an in-memory
server with your own RPC implementations. It allows you to mock a backend to cover different behavior in your component.

To illustrate, let's setup a very simple ELIZA service:

```ts
import { ElizaService } from "@buf/connectrpc_eliza.connectrpc_es/connectrpc/eliza/v1/eliza_connect";
import { SayResponse } from "@buf/connectrpc_eliza.connectrpc_es/connectrpc/eliza/v1/eliza_pb";
import { createRouterTransport } from "@connectrpc/connect";

const mockTransport = createRouterTransport(({ service }) => {
  service(ElizaService, {
    say: () => new SayResponse({ sentence: "I feel happy." }),
  });
});
```

Under the hood, this mock transport runs nearly the same code that a server running on
Node.js would run. This means that all features from [implementing real services](../node/implementing-services.md)
are available: You can access request headers, raise errors with details, and also
mock streaming responses. Here is an example that raises an error on the fourth
request:

```ts
const mockTransport = createRouterTransport(({ service }) => {
  const sentences: string[] = [];
  service(ElizaService, {
    say(request: SayRequest) {
      sentences.push(request.sentence);
      // highlight-next-line
      if (sentences.length > 3) {
      // highlight-next-line
        throw new ConnectError(
      // highlight-next-line
          "I have no words anymore.",
      // highlight-next-line
          Code.ResourceExhausted,
      // highlight-next-line
        );
      // highlight-next-line
      }
      return new SayResponse({
        sentence: `You said ${sentences.length} sentences.`,
      });
    },
  });
});
```

You can also use expectations to assert that your client sends requests as expected:

```ts
const mockTransport = createRouterTransport(({ service }) => {
  service(ElizaService, {
    say(request) {
      // highlight-next-line
      expect(request.sentence).toBe("how do you feel?");
      return new SayResponse({ sentence: "I feel happy." });
    },
  });
});
```

The `createRouterTransport` function also accepts an optional second argument, allowing you
to pass options like [interceptors](./interceptors.mdx).

### Testing against a running server


### Testing against an in-memory server


### Mocking clients



## Testing services

There are multiple ways for testing your Connect-Node services each with their own benefits. Below are some examples:

### Testing against a running server
With this approach, you can run a full HTTP server over TCP, and use regular clients to call procedures, asserting that
the result matches expectations.

The big benefit is that you get a behavior that is closest to a real deployment. This approach works well with plain
Node.js, Fastify, and Express. It let's you test other routes besides Connect routes that your server might implement,
including middleware.

:::note
We do not recommend using [`fastify.inject()`](https://fastify.dev/docs/v1.14.x/Documentation/Testing/#testing-with-http-injection)
for testing Connect routes. `fastify.inject()` is a great tool, but using it means you have to handle details of the
protocol like `Content-Type` headers and status codes yourself. This is rather straight-forward for Connect unary,
but much less so for streaming RPCs, or the gRPC or gRPC-Web protocols.
:::note

### Testing against an in-memory server
When testing against an in-memory server, you can test your Connect routes in isolation and circumvent any other routes
or middleware that your server might implement. To accomplish this, you can use the `createRouterTransport` function
exported from [`@connectrpc/connect`](https://www.npmjs.com/package/@connectrpc/connect). This in-memory transport is a
special transport that does not make HTTP requests over the network, but directly calls the supplied Connect routes
instead. The `Transport` returned from `createRouterTransport` can be used to create clients and call procedures,
asserting that the result matches expectations.

One of the benefits with an in-memory server is the ease of setup and testing of routes in isolation. Request and
response messages are serialized. Headers, trailers, errors and other Connect features are supported. However, the
behavior under test is not as close to a real deployment. Since requests are not going through the network, there are
many areas not factored into the test that could fail in production.

This approach works well with Next.js, where spinning up a full server in tests is not trivial.

### Unit testing a service
Unit testing a service side-steps TCP and HTTP altogether and calls the service methods directly, without the need for
clients, transports, and other ancillary processes used when using an actual server. This approach is useful for unit
testing, making it trivial to inject test-only dependencies via the constructor.

### Examples

Our examples-es repo provides examples for all three approaches in [Fastify](https://github.com/connectrpc/examples-es/blob/b5d3f6822330f6b7816fac697b64ed4214aabafe/fastify/test/connect.test.ts), [Express](https://github.com/connectrpc/examples-es/blob/b5d3f6822330f6b7816fac697b64ed4214aabafe/express/connect.test.ts), and [vanilla Node.js](https://github.com/connectrpc/examples-es/blob/b5d3f6822330f6b7816fac697b64ed4214aabafe/vanilla-node/connect.test.ts).

In addition, check out the [Next.js](https://github.com/connectrpc/examples-es/blob/6e80c5677bf650b4c40bb26e8220bcac53adb585/nextjs/__tests__/connect.test.ts) project for an example of testing with an in-memory server and unit testing service methods directly in Next.js

