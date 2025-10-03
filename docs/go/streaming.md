---
title: Streaming
sidebar_position: 70
---

Connect supports several types of streaming RPCs. Streaming is exciting &mdash;
it's fundamentally different from the web's typical request-response model, and
in the right circumstances it can be very efficient. If you've been writing the
same pagination or polling code for years, streaming may look like the answer
to all your problems.

Temper your enthusiasm. Streaming also comes with many drawbacks:

- It requires excellent HTTP libraries. At the very least, the client and
  server must be able to stream HTTP/1.1 request and response bodies. For
  bidirectional streaming, both parties must support HTTP/2. Long-lived streams
  are much more likely to encounter bugs and edge cases in HTTP/2 flow control.
- It requires excellent proxies. Every proxy between the server and client
  &mdash; including those run by cloud providers &mdash; must support HTTP/2.
- It weakens the protections offered to your unary handlers, since streaming
  typically requires proxies to be configured with much longer timeouts.
- It requires complex tools. Streaming RPC protocols are much more involved
  than unary protocols, so cURL and your browser's network inspector are
  useless.

In general, streaming ties your application more closely to your
networking infrastructure and makes your application inaccessible to
less-sophisticated clients. You can minimize these downsides by keeping
streams short-lived.

Also, if your [http.Server](https://pkg.go.dev/net/http#Server) has the
`ReadTimeout` or `WriteTimeout` field configured, it applies to the entire
operation duration, even for streaming calls. See the [FAQ](../faq.md#stream-error)
for more information.

All that said, `connect-go` fully supports all three types of streaming. All
streaming subtypes work with the gRPC, gRPC-Web, and Connect protocols.

## Streaming variants

In _client streaming_, the client sends multiple messages. Once the server
receives all the messages, it responds with a single message. In Protobuf
schemas, client streaming methods look like this:

```protobuf
service GreetService {
  rpc Greet(stream GreetRequest) returns (GreetResponse) {}
}
```

In Go, client streaming RPCs use the `ClientStream` and `ClientStreamForClient`
types.

In _server streaming_, the client sends a single message and the server
responds with multiple messages. In Protobuf schemas, server streaming methods
look like this:

```protobuf
service GreetService {
  rpc Greet(GreetRequest) returns (stream GreetResponse) {}
}
```

In Go, server streaming RPCs use the `ServerStream` and `ServerStreamForClient`
types.

In _bidirectional streaming_ (often called bidi), the client and server may
both send multiple messages. Often, the exchange is structured like a
conversation: the client sends a message, the server responds, the client sends
another message, and so on. Keep in mind that this always requires end-to-end
HTTP/2 support (regardless of RPC protocol)! `net/http` clients and servers
support HTTP/2 by default if you're using TLS, but they need some [special
configuration](deployment.md#h2c) to support HTTP/2 without TLS. In Protobuf
schemas, bidi streaming methods look like this:

```protobuf
service GreetService {
  rpc Greet(stream GreetRequest) returns (stream GreetResponse) {}
}
```

In Go, bidi streaming RPCs use the `BidiStream` and `BidiStreamForClient`
types.

## HTTP representation

In all three protocols, streaming responses always have an HTTP status of 200
OK. This may seem unusual, but it's unavoidable: the server may encounter an
error after sending a few messages, when the HTTP status has already been sent
to the client. Rather than relying on the HTTP status, streaming handlers
encode any errors in HTTP trailers or at the end of the response body
(depending on the protocol).

The body of streaming requests and responses envelopes your schema-defined
messages with a few bytes of protocol-specific binary framing data. Because of
the interspersed framing data, the payloads are no longer valid Protobuf or
JSON: instead, they use protocol-specific Content-Types like
`application/connect+proto`, `application/grpc+json`, or
`application/grpc-web+proto`.

## Headers and trailers

[As in unary RPC](headers-and-trailers.md), headers are plain HTTP headers,
with the same ASCII-only restrictions and binary header support.

Each protocol sends response trailers differently: they may be sent as HTTP
trailers, a block of HTTP-formatted data at the end of the response body, or a
blob of JSON at the end of the body. Regardless of the wire encoding, all three
protocols give trailers the same semantics and restrictions as headers.

Headers and trailers are exposed on streaming RPCs in the same way as unary, via
a `CallInfo` type in context. 

## Interceptors

Streaming interceptors are naturally more complex than unary interceptors.
Rather than using `UnaryInterceptorFunc`, streaming interceptors must implement
the full `Interceptor` interface. This may require implementing a
`StreamingClientConn` or `StreamingHandlerConn` wrapper.

## An example

Let's start by amending the `GreetService` we defined in [Getting
Started](getting-started.md) to make the `Greet` method use client streaming:

```protobuf
syntax = "proto3";

package greet.v1;

option go_package = "example/gen/greet/v1;greetv1";

message GreetRequest {
  string name = 1;
}

message GreetResponse {
  string greeting = 1;
}

service GreetService {
  rpc Greet(stream GreetRequest) returns (GreetResponse) {}
}
```

After running `buf generate` to update our generated code, we can amend our
handler implementation in `cmd/server/main.go`:

```go
package main

import (
  "context"
  "errors"
  "fmt"
  "log"
  "net/http"
  "strings"

  "connectrpc.com/connect"

  greetv1 "example/gen/greet/v1"
  "example/gen/greet/v1/greetv1connect"
)

type GreetServer struct{}

func (s *GreetServer) Greet(
  ctx context.Context,
  stream *connect.ClientStream[greetv1.GreetRequest],
) (*greetv1.GreetResponse, error) {
  callInfo, ok := connect.CallInfoForHandlerContext(ctx)
  log.Println("Request headers: ", callInfo.RequestHeader())
  var greeting strings.Builder
  for stream.Receive() {
    g := fmt.Sprintf("Hello, %s!\n", stream.Msg().Name)
    if _, err := greeting.WriteString(g); err != nil {
      return nil, connect.NewError(connect.CodeInternal, err)
    }
  }
  if err := stream.Err(); err != nil {
    return nil, connect.NewError(connect.CodeUnknown, err)
  }
  callInfo.ResponseHeader().Set("Greet-Version", "v1")
  res := &greetv1.GreetResponse{
    Greeting: greeting.String(),
  }
  return res, nil
}

func main() {
  greeter := &GreetServer{}
  mux := http.NewServeMux()
  path, handler := greetv1connect.NewGreetServiceHandler(greeter)
  mux.Handle(path, handler)
  p := new(http.Protocols)
  p.SetHTTP1(true)
  // Use h2c so we can serve HTTP/2 without TLS.
  p.SetUnencryptedHTTP2(true)
  s := http.Server{
    Addr:      "localhost:8080",
    Handler:   mux,
    Protocols: p,
  }
  s.ListenAndServe()
}
```

Now that we've implemented our new client streaming RPC, we'll also need to
update our [simple authentication interceptor](interceptors.md). To support
streaming, we must implement the full `Interceptor` interface:

```go
const tokenHeader = "Acme-Token"

var errNoToken = errors.New("no token provided")

type authInterceptor struct {}

func NewAuthInterceptor() *authInterceptor {
  return &authInterceptor{}
}

func (i *authInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
  // Same as previous UnaryInterceptorFunc.
  return connect.UnaryFunc(func(
    ctx context.Context,
    req connect.AnyRequest,
  ) (connect.AnyResponse, error) {
    if req.Spec().IsClient {
      // Send a token with client requests.
      req.Header().Set(tokenHeader, "sample")
    } else if req.Header().Get(tokenHeader) == "" {
      // Check token in handlers.
      return nil, connect.NewError(connect.CodeUnauthenticated, errNoToken)
    }
    return next(ctx, req)
  })
}

func (*authInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
  return connect.StreamingClientFunc(func(
    ctx context.Context,
    spec connect.Spec,
  ) connect.StreamingClientConn {
    conn := next(ctx, spec)
    conn.RequestHeader().Set(tokenHeader, "sample")
    return conn
  })
}

func (i *authInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
  return connect.StreamingHandlerFunc(func(
    ctx context.Context,
    conn connect.StreamingHandlerConn,
  ) error {
    if conn.RequestHeader().Get(tokenHeader) == "" {
      return connect.NewError(connect.CodeUnauthenticated, errNoToken)
    }
    return next(ctx, conn)
  })
}
```

We apply our interceptor just as we did before, using `WithInterceptors`.
