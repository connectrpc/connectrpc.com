---
title: Streaming
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
operation duration, even for streaming calls. See the [FAQ](/docs/faq/#stream-error)
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

In Go, the generator emits a pair of stream types for each streaming RPC,
named after the service and method: `GreetServiceGreetServerStream` for the
handler and `GreetServiceGreetClientStream` for the client. Each type exposes
only the operations its streaming variant allows. For client streaming, the
handler stream can only receive and the client stream can only send. The
handler receives messages until `io.EOF` signals the end of the client's
stream, then returns its single response:

```go
// Handler
func (s *GreetServer) Greet(
	ctx context.Context,
	stream greetv1connect.GreetServiceGreetServerStream,
) (*greetv1.GreetResponse, error) {
	var names []string
	for {
		req, err := stream.Receive()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, err
		}
		names = append(names, req.Name)
	}
	return &greetv1.GreetResponse{
		Greeting: fmt.Sprintf("Hello, %s!", strings.Join(names, ", ")),
	}, nil
}
```

The client sends its messages, then calls `CloseAndReceive` to close the send
side of the stream and wait for the response:

```go
// Client
stream, err := client.Greet(context.Background())
if err != nil {
	return err
}
for _, name := range []string{"Jane", "Joe"} {
	if err := stream.Send(&greetv1.GreetRequest{Name: name}); err != nil {
		return err
	}
}
res, err := stream.CloseAndReceive()
if err != nil {
	return err
}
fmt.Println(res.Greeting)
```

In _server streaming_, the client sends a single message and the server
responds with multiple messages. In Protobuf schemas, server streaming methods
look like this:

```protobuf
service GreetService {
  rpc Greet(GreetRequest) returns (stream GreetResponse) {}
}
```

In Go, server streaming RPCs use the same generated stream types, exposing
`Send` to the handler and `Receive` to the client. The handler takes the
request message and the stream; returning ends the RPC, with `nil` for
success or an error to send the client:

```go
// Handler
func (s *GreetServer) Greet(
	ctx context.Context,
	req *greetv1.GreetRequest,
	stream greetv1connect.GreetServiceGreetServerStream,
) error {
	for _, prefix := range []string{"Hello", "Bonjour", "Hola"} {
		if err := stream.Send(&greetv1.GreetResponse{
			Greeting: fmt.Sprintf("%s, %s!", prefix, req.Name),
		}); err != nil {
			return err
		}
	}
	return nil
}
```

The client receives messages until `io.EOF` signals the end of the stream. If
the handler returned an error, the final `Receive` returns it instead of
`io.EOF`. `Close` releases the stream's resources; it's idempotent, so defer
it to clean up even if you abandon the stream early:

```go
// Client
stream, err := client.Greet(context.Background(), &greetv1.GreetRequest{Name: "Jane"})
if err != nil {
	return err
}
defer stream.Close()
for {
	res, err := stream.Receive()
	if errors.Is(err, io.EOF) {
		return nil
	}
	if err != nil {
		return err
	}
	fmt.Println(res.Greeting)
}
```

In _bidirectional streaming_ (often called bidi), the client and server may
both send multiple messages. Often, the exchange is structured like a
conversation: the client sends a message, the server responds, the client sends
another message, and so on. Keep in mind that this always requires end-to-end
HTTP/2 support (regardless of RPC protocol)! `net/http` clients and servers
support HTTP/2 by default if you're using TLS, but they need some [special
configuration](/docs/go/deployment/#h2c) to support HTTP/2 without TLS. In Protobuf
schemas, bidi streaming methods look like this:

```protobuf
service GreetService {
  rpc Greet(stream GreetRequest) returns (stream GreetResponse) {}
}
```

In Go, bidi streaming RPCs also use the generated stream types, exposing
`Send` and `Receive` on both sides. This handler responds to each message as
it arrives, and returns once the client's `io.EOF` signals the end of the
conversation:

```go
// Handler
func (s *GreetServer) Greet(
	ctx context.Context,
	stream greetv1connect.GreetServiceGreetServerStream,
) error {
	for {
		req, err := stream.Receive()
		if errors.Is(err, io.EOF) {
			return nil
		}
		if err != nil {
			return err
		}
		if err := stream.Send(&greetv1.GreetResponse{
			Greeting: fmt.Sprintf("Hello, %s!", req.Name),
		}); err != nil {
			return err
		}
	}
}
```

When the client is done sending, `CloseSend` closes the request side of the
stream, and a final `Receive` drains the stream to collect the RPC's status:
`io.EOF` for success, or the handler's error. As with server streams, defer
`Close` to release the stream's resources:

```go
// Client
stream, err := client.Greet(context.Background())
if err != nil {
	return err
}
defer stream.Close()
for _, name := range []string{"Jane", "Joe"} {
	if err := stream.Send(&greetv1.GreetRequest{Name: name}); err != nil {
		return err
	}
	res, err := stream.Receive()
	if err != nil {
		return err
	}
	fmt.Println(res.Greeting)
}
if err := stream.CloseSend(); err != nil {
	return err
}
if _, err := stream.Receive(); !errors.Is(err, io.EOF) {
	return err
}
return nil
```

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

[As in unary RPC](/docs/go/headers-and-trailers/), headers are plain HTTP headers,
with the same ASCII-only restrictions and binary header support.

Each protocol sends response trailers differently: they may be sent as HTTP
trailers, a block of HTTP-formatted data at the end of the response body, or a
blob of JSON at the end of the body. Regardless of the wire encoding, all three
protocols give trailers the same semantics and restrictions as headers.

Headers and trailers are exposed on streaming RPCs in the same way as unary, via
a `CallInfo` type in context.

## Interceptors

[Interceptors](/docs/go/interceptors/) work the same way for streaming and
unary RPCs: every RPC is wrapped as a stream by a `connect.ClientInterceptor`
or `connect.ServerInterceptor`. Interceptors that need to observe individual
messages can wrap the `connect.ClientStream` or `connect.ServerStream` before
passing it along.

## A complete example

Let's put the pieces together in a complete program, amending the
`GreetService` we defined in [Getting Started](/docs/go/getting-started/) to
make the `Greet` method use client streaming:

```protobuf
syntax = "proto3";

package greet.v1;

import "buf/validate/validate.proto";

message GreetRequest {
  string name = 1 [(buf.validate.field).string = {
    min_len: 1,
    max_len: 50,
  }];
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
	"io"
	"log"
	"net/http"
	"strings"

	"connectrpc.com/connect/v2"
	"connectrpc.com/connect/v2/connecthttp"
	"connectrpc.com/validate/v2"

	greetv1 "example/gen/greet/v1"
	"example/gen/greet/v1/greetv1connect"
)

type GreetServer struct{}

func (s *GreetServer) Greet(
	ctx context.Context,
	stream greetv1connect.GreetServiceGreetServerStream,
) (*greetv1.GreetResponse, error) {
	callInfo, ok := connect.CallInfoForServerContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeInternal, "no call info in context")
	}
	log.Println("Request headers: ", callInfo.RequestHeader())
	var greeting strings.Builder
	for {
		req, err := stream.Receive()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, err
		}
		g := fmt.Sprintf("Hello, %s!\n", req.Name)
		if _, err := greeting.WriteString(g); err != nil {
			return nil, connect.NewError(connect.CodeInternal, "failed to build greeting").WithCause(err)
		}
	}
	callInfo.ResponseHeader().Set("Greet-Version", "v1")
	res := &greetv1.GreetResponse{
		Greeting: greeting.String(),
	}
	return res, nil
}

func main() {
	greeter := &GreetServer{}
	server := connect.NewServer(
		// Validation via Protovalidate is almost always recommended
		validate.NewServerInterceptor(),
	)
	greetv1connect.RegisterGreetServiceHandler(server, greeter)
	mux := http.NewServeMux()
	connecthttp.Mount(mux, server)
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

Our [simple authentication interceptor](/docs/go/interceptors/) needs no
changes to support the new client streaming RPC. The same interceptors run
for every RPC, and we apply them just as we did before, passing them to
`connect.NewClient` and `connect.NewServer`.
