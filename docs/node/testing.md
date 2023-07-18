---
title: Testing
sidebar_position: 5
---

## Testing a client application

Testing a client application can be a crucial part of ensuring its functionality and performance. When it comes to TypeScript projects, you can utilize the `createRouterTransport` method from `@bufbuild/connect` to create a mock transport that can be used in both backend and frontend applications.

For backend applications, it can be useful to create mock transports within the context of unit tests. By integrating the actual logic of your application and testing it incrementally, you can ensure that each part of your application is functioning as expected.

On the other hand, for frontend applications, it may not always be feasible or desirable to test against an actual API. In such cases, you can utilize a mocked Connect backend to test your application.

To help you get started with testing your client application, here is a guide on how to use `createRouterTransport` to create mock transports for your TypeScript projects.

### A simple mock to test a client

No matter whether your client is Node.js with Connect-Node or a web frontend with Connect-Web or Connect-Query, you can use `createRouterTransport` to write tests.

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
import { createRouterTransport } from '@bufbuild/connect';
import { BigIntService } from 'my-generated-code/bigint_connectweb';

export const mockBigIntTransport = () =>
  createRouterTransport(({ service }) => {
    service(BigIntService, {
      count: () => new CountResponse({ count: 1n })
    });
  });
```

In your client testing code, you can then use `createPromiseClient` from `@bufbuild/connect` with `mockBigIntTransport`:

```ts
import { createPromiseClient } from '@bufbuild/connect';

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
import { type HandlerContext } from '@bufbuild/connect';
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

### What about mocking `fetch` itself?

Mocking `fetch` itself is a common approach to testing network requests, but it has some drawbacks. Instead, using a schema-based serialization chain with an in-memory transport can be a better approach. Here are some reasons why:

- With schema-based serialization, the request goes through the same process as it would in your actual code, allowing you to test the full flow of your application.
- You can create stateful mocks with an in-memory transport, which can test more complex workflows and scenarios.
- An in-memory transport is fast, so you can quickly set up your tests without worrying about resetting mocks.
- With an in-memory transport, you can eliminate the need for [spy functions](https://jestjs.io/docs/jest-object#jestspyonobject-methodname) because you can implement any checks directly in your server implementation. This can simplify your testing code and make it easier to understand.
- You can leverage `expect` directly within the code of your mock implementation to verify particular scenarios pertaining to the requests or responses.
