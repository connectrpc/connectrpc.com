---
title: Testing
sidebar_position: 5
---

## Testing services

There are multiple ways for testing your Connect-Node services each with their own benefits. Below are some examples:

### Testing against a running server
With this approach, we run a full HTTP server over TPC, and use regular clients to call procedures, asserting that the result matches expectations.

This way you get a behavior that is closest to a real deployment. This approach works well with plain Node.js, Fastify, and Express. It let's you test other routes besides connect routes that your server might implement, including middleware.

Note that we do not recommend fastify.inject() for testing Connect routes. fastify.inject() is a great tool, but using it means you have to handle details of the protocol like content-types and status codes yourself. This is rather straight-forward for Connect unary, but much less so for streaming RPCs, or the gRPC or gRPC-web protocols.

### Testing against an in-memory server
With this approach, we testust connect routes, no other routes or middleware that your server might implement. We use createRouterTransport from @connectrpc/connect. It is a special transport that does not make HTTP requests over the network, but calls the supplied connect routes instead. We create clients with this transport, and call procedures, asserting that the result matches expectations.

The behavior is not as close to a real deployment because we are not going through the network, but request and response messages are serialized, and headers, trailers, errors and other Connect features are supported.

This approach works well with Next.js, where spinning up a full server in tests is not trivial.

### Unit testing a service
We side-step TCP and HTTP, and call service methods directly. This approach is useful for unit testing, making it trivial to inject test-only dependencies via the constructor.


To illustrate, let's start with a simple `BigIntService` proto definition:

```protobuf
message CountRequest {
  int64 add = 1;
}

message CountResponse {
  int64 count = 1;
}

service BigIntService {
  rpc Count(CountRequest) returns (CountResponse);
}
```

With `createRouterTransport` and `BigIntService` from your generated code, you can create a simple mock:

```ts
import { createRouterTransport } from '@connectrpc/connect';
import { BigIntService } from 'my-generated-code/bigint_connectweb';

export const mockBigIntTransport = () =>
  createRouterTransport(({ service }) => {
    service(BigIntService, {
      count: () => new CountResponse({ count: 1n })
    });
  });
```

In your client testing code, you can then use `createPromiseClient` from `@connectrpc/connect` with `mockBigIntTransport`:

```ts
import { createPromiseClient } from '@connectrpc/connect';

describe('your client test suite', () => {
  it('tests a simple client call', async () => {
    const client = createPromiseClient(BigIntService, mockBigIntTransport());
    const { count } = await client.count({});
    expect(count).toEqual(1n);
  });
});
```

:::note
You can pass the `Transport` returned by `createRouterTransport` to any client that accepts a transport, including Connect-Node, Connect-Web, and Connect-Query.
:::

### Adding Headers, interceptors, more

You can do all the same things with this mock as with any other transport, such as setting headers and trailers, using interceptors, and more. Here's an example:

```ts
import { type HandlerContext } from '@connectrpc/connect';
import { CountRequest } from 'my-generated-code/bigint_connectweb';

export const mockBigIntTransport = () =>
  createRouterTransport(({ service }) => {
    service(BigIntService, {
      count: (_request: CountRequest, context: HandlerContext) => {
        context.responseHeader.set("unary-response-header", "foo"); // set Response Header
        context.responseTrailer.set("unary-response-trailer", "foo"); // set Response Trailer
        return new CountResponse({ count: 1n });
      },
    },
    {
      transport: {
        interceptors: [
          loggingInterceptor, // set an interceptor
        ],
      },
    });
  });
```

In this example, we have added an interceptor to the mock implementation of the `count` method. The interceptor is a function that logs some information before and after the request is processed. We have also added a response header and a response trailer to the response.

### Using stateful mocks to test a client

You can also create a stateful mock. Here's an example of a mock server that takes in a request and adds it to an existing count:

```ts
/**
 * a mock for BigIntService that acts as an impromptu database
 */
export const mockStatefulBigIntTransport = () =>
  createRouterTransport(({ service }) => {
    let count = 0n;
    service(BigIntService, {
      count: (request?: CountRequest) => {
        if (request) {
          count += request.add;
        }
        return new CountResponse({ count });
      },
    });
  });
```

Your client test for this might look something like:

```ts
describe('your client test suite', () => {
  it('tests a client calling a mock stateful server', async () => {
    const client = createPromiseClient(BigIntService, mockStatefulBigIntTransport());
    let { count } = await client.count({ add: 1n });
    expect(count).toEqual(1n);

    ({ count } = await client.count({ add: 9000n }));
    expect(count).toEqual(9001n);
  });
});
```

