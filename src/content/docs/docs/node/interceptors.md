---
title: Interceptors
---

An interceptor can add logic to servers and clients, similar to the decorators
or middleware you may have seen in other libraries. Interceptors may
mutate the request and response, catch errors and retry/recover, emit
logs, or do nearly anything else.

For a simple example, this interceptor logs every RPC on a Node.js server:

```ts
import * as http from "http";
import routes from "./connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import type { Interceptor } from "@connectrpc/connect";

const logger: Interceptor = (next) => async (req) => {
  console.log(`received message on ${req.url}`);
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

You can think of interceptors like a layered onion. A request received by a server goes through the outermost layer first. Each call to `next()` traverses to the next layer. In the center, the request is handled by user provided implementation. The response then comes back through all layers and is returned to the client. In the array of interceptors passed to the adapter/router, the interceptor at the end of the array is the first applied to the response.

To intercept responses, we simply look at the return value of `next()`:

```ts
const logger: Interceptor = (next) => async (req) => {
  console.log(`received message on ${req.url}`);
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

async function* logEach(stream: AsyncIterable<any>) {
  for await (const m of stream) {
    console.log("sending response message", m);
    yield m;
  }
}
```

Interceptors can be applied to clients via the `interceptors` option in `createConnectTransport()`. Refer to the documentation for [Web](/docs/web/interceptors/) for an example.

## Context Values

Context values are a type safe way to attach arbitrary values to a call, and share them with interceptors, all the way down to the handler.

The `ContextValues` type is a map-like object with methods to set, get, and delete values:

```ts
import { createContextValues, type ContextValues } from "@connectrpc/connect";
import { createContextKey } from "@connectrpc/connect";

const key = createContextKey("default value");

const values: ContextValues = createContextValues();
values.get(key); // "default value"
values.set(key, "custom value");
```

The keys are `ContextKey` objects, and enable type safe and collision-free use of context values. They carry a default value that is used when the context value is not set, and an optional description that's helpful for debugging.

Context values can be populated via the `contextValues` option of [server plugins](/docs/node/server-plugins/), and they can be read or set by the [requestGate option](/docs/node/server-plugins/#common-options):

```ts
connectNodeAdapter({
  routes,
  contextValues: (nodeServerRequest): ContextValues => {
    const httpVersion = nodeServerRequest.httpVersion;
    return createContextValues().set(kHttpVersion, httpVersion);
  },
  requestGate: (context: HandlerContext) => {
    if (context.values.get(kHttpVersion) === "1.0") {
      throw new ConnectError("HTTP 1.0 is not supported", Code.Unimplemented);
    }
  },
})
```

Interceptors have full access to context values:

```ts
const logger: Interceptor = (next) => async (req) => {
  const httpVersion = req.contextValues.get(kHttpVersion);
  console.log(`HTTP version ${httpVersion}`);
  return await next(req);
};
```

And handlers can access them through the `HandlerContext`:

```ts title=connect.ts
function say(req: SayRequest, context: HandlerContext) {
  const httpVersion = context.values.get(kHttpVersion);
  return { sentence: `You are using HTTP ${httpVersion}` };
}
```

## Authentication

Don't use interceptors to authenticate requests on the server. For unary RPCs,
interceptors run after the request message is received, decompressed, and parsed.
To turn away requests earlier than that, use the [requestGate option](/docs/node/server-plugins/#common-options):

```ts
import * as http from "http";
import routes from "./connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import { Code, ConnectError } from "@connectrpc/connect";
import type { HandlerContext } from "@connectrpc/connect";
// This can come from an auth library like passport.js
import { authenticate } from "./authenticate";

function authGate(context: HandlerContext) {
  if (authenticate(context.requestHeader.get("Authorization")) === undefined) {
    throw new ConnectError("User not authenticated", Code.Unauthenticated);
  }
}

http
  .createServer(
    connectNodeAdapter({
      routes,
      requestGate: authGate,
    }),
  )
  .listen(8080);
```

Use context values to pass information from the gate to your interceptors and implementation:

```ts
import { createContextKey } from "@connectrpc/connect";
import { authenticate, type User } from "./authenticate";

const kUser = createContextKey<User | undefined>(undefined);

function authGate(context: HandlerContext) {
  const user = authenticate(context.requestHeader.get("Authorization"));
  if (user === undefined) {
    throw new ConnectError("User not authenticated", Code.Unauthenticated);
  }
  // Add the user to the request context.
  context.values.set(kUser, user);
}
```
