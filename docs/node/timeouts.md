---
title: Timeouts
sidebar_position: 8
---

Timeouts can be used to limit the time a server may take to process a response.
In Connect-ES, timeout values are set by the client via the `timeoutMs` option 
when issuing a requests. If handling the response takes longer than the timeout, 
they will respond with the error code `deadline_exceeded`. In gRPC, the concept 
is also known as [deadlines](https://grpc.io/docs/guides/deadlines/).

## Using `HandlerContext`

Servers can interact with this timeout via the [handler context](https://connectrpc.com/docs/node/implementing-services#context).
Depending on your needs, there are a few ways to approach it:

The first way is via an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) 
on the context. Using this signal, route handlers can then tell if the timeout specified 
by the client was reached and abort their processes accordingly. The `AbortSignal` can be found
via the property name `signal`. 

The signal can be passed to other functions or used to gracefully stop processes when the timeout is reached or when the
RPC returns. Using `signal` works for any operation you might want to call as long as the API supports it. 

```ts
import type { HandlerContext } from "@bufbuild/connect";

const say = async (req: SayRequest, ctx: HandlerContext) => {

    ctx.signal.aborted; // true if timed out
    ctx.signal.reason; // an error with code deadline_exceeded if timed out

    // raises an error with code deadline_exceeded if timed out
    ctx.signal.throwIfAborted();

    // the AbortSignal can be passed to other functions
    await longRunning(ctx.signal);

    return {sentence: `You said: ${req.sentence}`};
};
```

A second way to interact with the timeout value is via the `timeoutMs()` function 
on the handler context. If the current request has a timeout, this function 
returns the remaining time.

Using the `timeoutMs()` function is preferable when invoking upstream RPC calls 
because it is more efficient and robust - you have a guarantee that the peer is 
aware of the deadline, regardless of network issues. In gRPC, the concept is also
known as [deadline propagation](https://grpc.io/docs/guides/deadlines/#deadline-propagation).

```ts
import type { HandlerContext } from "@bufbuild/connect";

const say = async (req: SayRequest, ctx: HandlerContext) => {
  
    // If a timeout was set on the call to this service, the timeoutMs() method 
    // returns the remaining time in milliseconds. 

    // Passing the value to an upstream client call propagates the timeout.
    await upstreamClient.someCall({}, { timeoutMs: ctx.timeoutMs() });

    return {sentence: `You said: ${req.sentence}`};
};
```

In addition, to server-side support for timeouts, there is also a related option on `ConnectRouter`
that helps constraining timeout values: `maxTimeoutMs`. For an explanation of this option,
see the docs on [Server Plugins](server-plugins#common-options)

Also note that while this page discusses timeouts in the context of a server, Connect-ES clients
honor timeout values and will raise a `ConnectError` with code `DeadlineExceeded`. Even if a connection 
becomes unresponsive, the client call will still abort at the configured timeout.

```ts
try {
  // If this call takes more than 200 milliseconds, it is canceled
  await client.say({sentence: "Hello"}, { timeoutMs: 200 });
} catch (err) {
  if (err instanceof ConnectError && err.code === Code.DeadlineExceeded) {
    // handle the timeout error
  }
}
```
