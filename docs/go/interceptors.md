---
title: Interceptors
sidebar_position: 60
---

Interceptors are similar to the middleware or decorators you may be familiar
with from other frameworks: they're the primary way of extending Connect and are 
often used to add logging, metrics, tracing, retries, and other
functionality. 
If you followed the [getting started](getting-started.md) guide, you've already seen an interceptor in action:
the [validate-go](https://github.com/connectrpc/validate-go/) interceptor powers the Protovalidate integration that made sure every `GreetRequest` contained a valid name.

On this page you'll learn how to build unary interceptors &mdash; more complex use
cases are covered in the [streaming documentation](streaming.md).

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

That's a little abstract, so let's consider an example: we'd like to apply a
simple header-based authentication scheme to our RPCs. We could add this logic
to each method on our server, but it's less error-prone to write an interceptor
instead.

```go
package example

import (
  "context"
  "errors"

  "connectrpc.com/connect"
)

const tokenHeader = "Acme-Token"

func NewAuthInterceptor() connect.UnaryInterceptorFunc {
  return func(next connect.UnaryFunc) connect.UnaryFunc {
    return func(
      ctx context.Context,
      req connect.AnyRequest,
    ) (connect.AnyResponse, error) {
      if req.Spec().IsClient {
        // Send a token with client requests.
        req.Header().Set(tokenHeader, "sample")
      } else if req.Header().Get(tokenHeader) == "" {
        // Check token in handlers.
        return nil, connect.NewError(
          connect.CodeUnauthenticated,
          errors.New("no token provided"),
        )
      }
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
    NewAuthInterceptor(),
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
  connect.WithInterceptors(NewAuthInterceptor()),
)
```
