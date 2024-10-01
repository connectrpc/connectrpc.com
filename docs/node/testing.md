---
title: Testing
sidebar_position: 7
---

When writing tests for your Connect for Node.js application, your approach will
vary depending on whether you are testing clients or backend services. There are similarities
in the setups as well as advantages and disadvantages for each. Below we'll list a few techniques for testing both.

## Clients

The process of testing your Connect for Node.js clients involves verifying that your client is sending the expected
requests and reacting correctly to various responses. Consequently, when writing tests for your clients, you will have
to define a server to interact with during your tests.

### Testing against a running server

With this approach, you can run a full HTTP server over TCP, and use your clients under test to call procedures,
asserting that the result matches expectations. The big benefit is that you get a behavior that is closest to a real
deployment. It lets you get closest to a production deployment and will factor in test other processes that your server
might interact with, including middleware. The big drawback is that it requires a lot of legwork to get a working server
setup for your tests.

### Testing against an in-memory server

With an in-memory server, you can test your Connect clients against a route in isolation and circumvent any other
routes or middleware that your server might implement. To accomplish this, you can use the `createRouterTransport`
function exported from [`@connectrpc/connect`](https://www.npmjs.com/package/@connectrpc/connect). This in-memory
transport is a special transport that does not make HTTP requests over the network, but directly calls the supplied
Connect routes instead. The `Transport` returned from `createRouterTransport` can be used to create clients and call
procedures, asserting that the result matches expectations.

One of the benefits with testing clients against an in-memory server is the ease of setup. For example, request and
response messages are serialized. Headers, trailers, errors and other Connect features are supported, too. However, the
behavior under test is not as close to a real deployment. Since requests are not going through the network, there are
many areas not factored into the test that could result in a false sense of security about the completeness of your
client coverage.

### Mocking services

It may not always be feasible or desirable to test against an actual API. For example, you may want to write a test
route that hardcodes certain scenarios such as always returning an error or always returning an empty response. In such
cases, you can utilize a mocked Connect backend to test your application again using Connect's `createRouterTransport`
function.


As mentioned, the function `createRouterTransport` from `@connectrpc/connect` creates an in-memory
server with the supplied routes. So, you can provide your own RPC implementations just for testing purposes.

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

With this mock, you can test how your client will react to returned errors after subsequent responses. You can also use
expectations to assert that your client sends requests as expected:

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
to pass options like [interceptors](docs/web/interceptors.mdx).

### Examples

For a working example of all three approaches in vanilla Node.js, check out the [client.test.ts file](https://github.com/connectrpc/examples-es/blob/b5d3f6822330f6b7816fac697b64ed4214aabafe/vanilla-node/client.test.ts) in the `vanilla-node` project of our [examples-es](https://github.com/connectrpc/examples-es) repo.

## Services

As with clients, there are multiple ways for testing your Connect-Node services each with their own benefits. The
approaches mainly follow the same concepts as with clients with the only difference being what you are testing.

### Testing with a running server

This approach is basically the same concept [as described above](#testing-against-a-running-server) regarding using a
running server. With this approach, you can set up test clients to send various configurations of requests and verify
your routes are behaving as planned. This approach works well with plain Node.js, Fastify, and Express.

:::note
We do not recommend using [`fastify.inject()`](https://fastify.dev/docs/v1.14.x/Documentation/Testing/#testing-with-http-injection)
for testing Connect routes. `fastify.inject()` is a great tool, but using it means you have to handle details of the
protocol like `Content-Type` headers and status codes yourself. This is rather straight-forward for Connect unary,
but much less so for streaming RPCs, or the gRPC or gRPC-Web protocols.
:::

### Testing with an in-memory server

Likewise, this follows the same concept as its [client counterpart above](#testing-against-an-in-memory-server). The
idea is to test your routes in isolation without factoring in any ancillary servers or middleware. The setup is the
same as above and can be facilitated through the use of `createRouterTransport`.

This approach works well with Next.js, where spinning up a full server in tests is not trivial.

### Unit testing a service

Unit testing a service side-steps TCP and HTTP altogether and calls the service methods directly, without the need for
clients, transports, and other processes used when interacting with an actual server. This approach is ideal
for unit testing, but it requires implementing services as classes using
[helper types](https://connectrpc.com/docs/node/implementing-services#helper-types). This way, you can simply
instantiate your service class directory and invoke methods on the service directly.

### Examples

Our examples-es repo provides examples for all three approaches in [Fastify](https://github.com/connectrpc/examples-es/blob/b5d3f6822330f6b7816fac697b64ed4214aabafe/fastify/test/connect.test.ts), [Express](https://github.com/connectrpc/examples-es/blob/b5d3f6822330f6b7816fac697b64ed4214aabafe/express/connect.test.ts), and [vanilla Node.js](https://github.com/connectrpc/examples-es/blob/b5d3f6822330f6b7816fac697b64ed4214aabafe/vanilla-node/connect.test.ts).

In addition, check out the [Next.js](https://github.com/connectrpc/examples-es/blob/6e80c5677bf650b4c40bb26e8220bcac53adb585/nextjs/__tests__/connect.test.ts) project for an example of testing with an in-memory server and unit testing service methods directly in Next.js

