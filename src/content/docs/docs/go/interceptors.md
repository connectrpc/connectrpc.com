---
title: Interceptors
---

Interceptors are similar to the middleware or decorators you may be familiar
with from other frameworks: they're the primary way of extending Connect and are
often used to add logging, metrics, tracing, retries, and other
functionality.
If you followed the [getting started](/docs/go/getting-started/) guide, you've already seen an interceptor in action:
the [validate-go](https://github.com/connectrpc/validate-go/) interceptor powers the Protovalidate integration that made sure every `GreetRequest` contained a valid name.

On this page you'll learn how to build unary interceptors &mdash; more complex use
cases are covered in the [streaming documentation](/docs/go/streaming/).

Take care when writing interceptors! They're powerful, but overly complex
interceptors can make debugging difficult.

## Interceptors are functions

Unary interceptors are built on two interfaces: `AnyRequest` and `AnyResponse`
and provide access to the request and response data only as an `any`. With these
interfaces, we can model all unary RPCs as:

```go
type UnaryFunc func(context.Context, AnyRequest) (AnyResponse, error)
```

An interceptor wraps an RPC with some additional logic, so it's transforming
one `UnaryFunc` into another:

```go
type UnaryInterceptorFunc func(UnaryFunc) UnaryFunc
```

Most unary interceptors are best implemented as a `UnaryInterceptorFunc`.

## An example

That's a little abstract, so let's consider an example: we'd like to log every
RPC. We could add logging to each method on our server, but it's less
error-prone to write an interceptor instead.

```go
package example

import (
	"context"
	"log/slog"

	"connectrpc.com/connect"
)

func NewLoggingInterceptor() connect.UnaryInterceptorFunc {
	return func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(
			ctx context.Context,
			req connect.AnyRequest,
		) (connect.AnyResponse, error) {
			spec := req.Spec()
			slog.InfoContext(ctx, "rpc",
				"procedure", spec.Procedure,
				"is_client", spec.IsClient,
			)
			return next(ctx, req)
		}
	}
}
```

To apply our new interceptor to handlers or clients, we can use
`WithInterceptors`:

```go
// For handlers:
interceptors := connect.WithInterceptors(
	NewLoggingInterceptor(),
	validate.NewInterceptor(),
)
mux := http.NewServeMux()
mux.Handle(greetv1connect.NewGreetServiceHandler(
	&GreetServer{},
	interceptors,
))
```

```go
// For clients:
client := greetv1connect.NewGreetServiceClient(
	http.DefaultClient,
	"http://localhost:8080",
	connect.WithInterceptors(NewLoggingInterceptor()),
)
```

## Authentication

Don't use interceptors to authenticate requests on the server. Handlers run
unary interceptors _after_ the request message has been read, decompressed, and
unmarshaled. An interceptor-based check lets unauthenticated clients consume
memory and CPU on your server. Instead, authenticate at the HTTP layer with
standard `net/http` middleware, which runs before Connect reads the request
body. The [authn-go](https://github.com/connectrpc/authn-go) package provides
authentication middleware designed for Connect servers.
