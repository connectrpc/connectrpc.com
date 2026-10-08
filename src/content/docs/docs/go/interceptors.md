---
title: Interceptors
---

Interceptors are similar to the middleware or decorators you may be familiar
with from other frameworks: they're the primary way of extending Connect and are
often used to add logging, metrics, tracing, retries, and other
functionality.
If you followed the [getting started](/docs/go/getting-started/) guide, you've already seen an interceptor in action:
the [validate-go](https://github.com/connectrpc/validate-go/) interceptor powers the Protovalidate integration that made sure every `GreetRequest` contained a valid name.

On this page you'll learn how to build interceptors. Interceptors work the
same way for unary and streaming RPCs &mdash; streaming examples are covered
in the [streaming documentation](/docs/go/streaming/).

Take care when writing interceptors! They're powerful, but overly complex
interceptors can make debugging difficult.

## Interceptors are functions

Interceptors come in client and server flavors, built on two function types.
Every RPC &mdash; including unary &mdash; is modeled as a stream that sends
and receives messages, so we can model all RPCs as:

```go
type ClientFunc func(ctx context.Context, spec Spec) (ClientStream, error)
type ServerFunc func(ctx context.Context, spec Spec, stream ServerStream) error
```

An interceptor wraps an RPC with some additional logic, so it's transforming
one function into another:

```go
type ClientInterceptor func(next ClientFunc) ClientFunc
type ServerInterceptor func(next ServerFunc) ServerFunc
```

Client interceptors wrap the initialization of the stream. To observe
messages or the end of the RPC, wrap the `ClientStream` returned by `next`,
including its `Close` method. Server interceptors wrap the full lifecycle of
the RPC. The stream is passed in, and it is closed when the `ServerFunc`
returns.

## An example

That's a little abstract, so let's consider an example: we'd like to apply a
simple header-based authentication scheme to our RPCs. We could add this logic
to each method on our server, but it's less error-prone to write an interceptor
instead. [Headers](/docs/go/headers-and-trailers/) are reached through the
`CallInfo` in the context.

```go
package example

import (
	"context"

	"connectrpc.com/connect/v2"
)

const tokenHeader = "Acme-Token"

func NewAuthClientInterceptor() connect.ClientInterceptor {
	return func(next connect.ClientFunc) connect.ClientFunc {
		return func(ctx context.Context, spec connect.Spec) (connect.ClientStream, error) {
			// Send a token with client requests.
			if info, ok := connect.CallInfoForClientContext(ctx); ok {
				info.RequestHeader().Set(tokenHeader, "sample")
			}
			return next(ctx, spec)
		}
	}
}

func NewAuthServerInterceptor() connect.ServerInterceptor {
	return func(next connect.ServerFunc) connect.ServerFunc {
		return func(ctx context.Context, spec connect.Spec, stream connect.ServerStream) error {
			// Check the token in handlers.
			info, ok := connect.CallInfoForServerContext(ctx)
			if !ok || info.RequestHeader().Get(tokenHeader) == "" {
				return connect.NewError(connect.CodeUnauthenticated, "no token provided")
			}
			return next(ctx, spec, stream)
		}
	}
}
```

To apply our new interceptors to handlers or clients, pass them to the
constructors:

```go
// For handlers:
server := connect.NewServer(
	NewAuthServerInterceptor(),
	validate.NewServerInterceptor(),
)
greetv1connect.RegisterGreetServiceHandler(server, &GreetServer{})
```

```go
// For clients:
client := greetv1connect.NewGreetServiceClient(
	connect.NewClient(
		connecthttp.NewTransport(http.DefaultClient, "http://localhost:8080"),
		NewAuthClientInterceptor(),
	),
)
```

Interceptors fire in argument order. The first interceptor wraps the
outermost call.

## Authentication

Authenticating in a server interceptor is safe. A `ServerInterceptor` wraps the
whole RPC, and the handler pulls messages off the stream with `Receive`, so your
interceptor runs before Connect reads or decodes any request message. Rejecting
an unauthenticated call there costs no decoding work.

This differs from connect-go v1, where unary interceptors ran after the request
message was already read and unmarshaled. Code that moved authentication out of
an interceptor to avoid that cost can move back.

To turn requests away even earlier, before Connect sees them at all,
authenticate at the HTTP layer with standard `net/http` middleware. The
[authn-go](https://github.com/connectrpc/authn-go) package provides
authentication middleware designed for Connect servers.
