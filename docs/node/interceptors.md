---
title: Interceptors
sidebar_position: 4
---

An interceptor can add logic to server/clients, similar to the decorators
or middleware you may have seen in other libraries. Interceptors may
mutate the request and response, catch errors and retry/recover, emit
logs, or do nearly anything else.

For client side interceptors, please refer to the documentation for [Web](../web/interceptors).

For a simple example, this interceptor logs every RPC:

```ts
import * as http from "http";
import routes from "./connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import type { Interceptor } from "@connectrpc/connect";

const logger: Interceptor = (next) => async (req) => {
  console.log(`recevied message on ${req.url}`);
  return await next(req);
};

http
  .createServer(
    connectNodeAdapter({
      routes,
      interceptors: [logger],
    }),
  )
  .listen(8080);
```

You can think of interceptors like a layered onion. A request received by a server goes through the outermost layer first. Each call to `next()` traverses to the next layer. In the center, the request is handled by user provided implementation. The response then comes back through all layers and is returned to the client. In the array of interceptors passed adapter/router, the interceptor at the end of the array is applied first.

To intercept responses, we simply look at the return value of `next()`:

```ts
const logger: Interceptor = (next) => async (req) => {
  console.log(`recevied message on ${req.url}`);
  const res = await next(req);
  if (!res.stream) {
    console.log("message:", res.message);
  }
  return res;
};
```

The `stream` property of the request/response tells us whether this is a streaming
response. A streaming request/response has not fully arrived yet when we intercept it
— we have to wrap it to see individual messages:

```ts
const logger: Interceptor = (next) => async (req) => {
  const res = await next(req);
  if (res.stream) {
    // to intercept streaming response messages, we wrap
    // the AsynchronousIterable with a generator function
    return {
      ...res,
      message: logEach(res.message),
    };
  }
  return res;
};

async function* logEach(stream: AsyncIterable<AnyMessage>) {
  for await (const m of stream) {
    console.log("sending response message", m);
    yield m;
  }
}
```

## Context Values

Context values are a type safe way to pass arbitary values from server plugins or one interceptor to the next all the way to the handler. You can use `createContextValues` function to create a new `ContextValues`. Each request will have its own `ContextValues` instance. The `ContextValues` instance is passed to the handler via the interceptors and can be used to retrieve the values. Server plugins can also provide a `ContextValues` instance for each request by using the `contextValues` option of [server plugins](./server-plugins.md).

`ContextValues` has methods to set, get, and delete values. The keys are `ContextKey` objects:

### Context Keys

`ContextKey` is a type safe and collision free way to use context values. It is defined using `createContextKey` function which takes a default value and returns a `ContextKey` object. The default value is used when the context value is not set.

```ts
import { createContextKey } from "@connectrpc/connect";

type User = { name: string };

const kUser = createContextKey<User>(
  { name: "Anonymous" }, // Default value
  {
    description: "Current user", // Description useful for debugging
  },
);

export { kUser };
```

For values where a default doesn't make sense you can just modify the type:

```ts
import { createContextKey } from "@connectrpc/connect";

type User = { name: string };

const kUser = createContextKey<User | undefined>(undefined, {
  description: "Authenticated user",
});

export { kUser };
```

It is best to define context keys in a separate file and export them. This is better for code splitting and also avoids circular imports. This also helps in the case where the provider changes based on the environment. For example, in a test environment we could setup an interceptor that adds a mock user and in production we will have the actual user.

### Example

One of the common use cases of interceptors is to a handle logic that is common to many requests like authentication. We can add authentication logic like so:

```ts
// This can come from an auth library like passport.js
import { authenticate } from "./authenticate.js";

const authenticator: Interceptor = (next) => async (req) => {
  // `authenticate` takes the authorization header value
  // and returns the user that represents the token.
  const user = authenticate(req.header.get("Authorization"));
  if (user === undefined) {
    throw new ConnectError("User not authenticated", Code.Unauthenticated);
  }
  return await next(req);
};
```

But what if we need the user info in one of our RPC implementations? One way is to parse the header again:

```ts
import { ConnectRouter } from "@connectrpc/connect";
import { ElizaService } from "./gen/eliza_connect";
import { authenticate } from "authenticate.js";

export default (router: ConnectRouter) =>
  // registers connectrpc.eliza.v1.ElizaService
  router.service(ElizaService, {
    // implements rpc Say
    async say(req, context) {
      const user = authenticate(context.requestHeader.get("Authorization"))!;
      return {
        sentence: `Hey ${user.name}! You said: ${req.sentence}`,
      };
    },
  });
```

But this means authentication happens twice, once in the Interceptor and second in our handler. This is where context values come in. We can add the user as a context value which can then be retrieved in the handler. To do so we need to define a context key:

```ts title=user-context.js
import { createContextKey } from "@connectrpc/connect";

type User = { name: string };

const kUser = createContextKey<User>(
  { name: "Anonymous" }, // Default value
);

export { kUser };
```

`ContextKey` is a type safe way to use context values. It also avoids collisions that are otherwise unavoidable with plain string keys. For more on context keys refer to the [Context Keys](#context-keys) section.

We can modify the interceptor to pass the user information using the context key:

```ts
import { authenticate } from "./authenticate.js";
import { kUser } from "user-context.js";
import type { Interceptor } from "@connectrpc/connect";
import { ConnectError, Code } from "@connectrpc/connect";

const authenticator: Interceptor = (next) => async (req) => {
  // `authenticate` takes the authorization header value
  // and returns the user that represents the token.
  const user = authenticate(req.header.get("Authorization"));
  if (user === undefined) {
    throw new ConnectError("User not authenticated", Code.Unauthenticated);
  }
  // Add the user to the request context.
  req.contextValues.set(kUser, user);
  return await next(req);
};
```

And then in our handler we can use it:

```ts
import { ConnectRouter } from "@connectrpc/connect";
import { ElizaService } from "./gen/eliza_connect";
import { authenticate } from "authenticate.js";
import { kUser } from "user-context.js";

export default (router: ConnectRouter) =>
  // registers connectrpc.eliza.v1.ElizaService
  router.service(ElizaService, {
    // implements rpc Say
    async say(req, context) {
      const user = values.get(kUser);
      return {
        sentence: `Hey ${user.name}! You said: ${req.sentence}`,
      };
    },
  });
```

You can also pass the context value from the server plugin:

```ts
import { fastify } from "fastify";
import routes from "./connect";
import { kUser } from "user-context.js";
import { authenticate } from "authenticate.js";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";

const server = fastify();

await server.register(fastifyConnectPlugin, {
  routes,
  contextValues: (req) =>
    createContextValues().set(kUser, authenticate(req)),
});

await server.listen({
  host: "localhost",
  port: 8080,
});
```

The request passed to the `contextValues` function is different for each server plugin, please refer to the documentation for the server plugin you are using.