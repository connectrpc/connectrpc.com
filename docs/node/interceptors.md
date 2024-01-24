---
title: Interceptors
sidebar_position: 4
---

An interceptor can add logic to server/clients, similar to the decorators
or middleware you may have seen in other libraries. Interceptors may
mutate the request and response, catch errors and retry/recover, emit
logs, or do nearly anything else.

For client side interceptors, please refer to the documentation for [Web](../web/interceptors).

For a simple example, this interceptor logs all requests:

```ts
import * as http from "http";
import routes from "./connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";

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

You can think of interceptors like a layered onion. A request received by a server goes through the outermost layer first. Each call to next() traverses to the next layer. In the center, the request is handled by user provided implementation. The response then comes back through all layers and is returned to the client. In the array of interceptors passed adapter/router, the interceptor at the end of the array is applied first.

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

# Context Values

Context values are a type safe way to pass arbitary values from one interceptor to the next all the way to the handler.

One of the common use cases of interceptors is to a handle logic that is common to many requests like authentication. We can add authentication logic like so:

```ts
import { authenticate } from "./authenticate.js"; // This can come from an auth library like passport.js

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

But what if we need the user info in one of our rpc implementations? One way is to parse the header again:

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

But this means authentication happens twice, once in the Interceptor and second in our handler. This is where context values become useful, we
can modify the interceptor to pass the user information:

```ts
import { authenticate } from "./authenticate.js"; // This can come from an auth library like passport.js
import { kUser } from "user-context.js";

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

Here `kUser` is the key used to map the context values:

```ts
import { createContextKey } from "@connectrpc/connect";
import type { User } from "./authenticate.js";

const kUser = createContextKey<User>(
  { name: "Anonymous" }, // Default value
  {
    description: "The current user", // Optional description, useful for debugging
  },
);

export { kUser };
```
