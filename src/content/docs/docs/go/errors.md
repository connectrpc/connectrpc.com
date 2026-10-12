---
title: Errors
---

Similar to the familiar "404 Not Found" and "500 Internal Server Error" status
codes you may have seen in HTTP, Connect uses a set of [16 error
codes](/docs/protocol/#error-codes). The Go APIs for creating and inspecting
errors work identically for all three supported protocols: gRPC, gRPC-Web, and
the Connect protocol.

## Working with errors

At their simplest, `connect-go` errors attach an [error
code](/docs/protocol/#error-codes) and a message to a standard Go error. The
error code and the message are sent over the network to the client, which may
handle different codes with different retry or fallback logic. If you're
familiar with gRPC status codes, Connect's error codes use the same names and
have the same semantics.

Connect handlers create errors with the `NewError` and `Errorf` functions,
which take the code and a message. Only the explicit message is serialized to
the wire, so text sent to callers is always written on purpose. To keep an
underlying error for local inspection and logging, attach it as a cause with
`WithCause`. Causes are visible to `errors.Is` and `errors.As` on the server
but are never serialized.

Handlers should return coded errors. If they don't, Connect will use the
`deadline_exceeded` code for `context.DeadlineExceeded`, `canceled` for
`context.Canceled`, and `unknown` for all other errors, without serializing
the error's text. For example:

```go
func (s *GreetServer) Greet(
	ctx context.Context,
	req *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err // automatically coded correctly
	}
	if err := validateGreetRequest(req); err != nil {
		return nil, connect.Errorf(connect.CodeInvalidArgument, "invalid greeting: %v", err)
	}
	greeting, err := doGreetWork(ctx, req)
	if err != nil {
		// The cause stays on the server for logging and errors.Is/As;
		// only the code and message are sent to the client.
		return nil, connect.NewError(connect.CodeUnknown, "failed to greet").WithCause(err)
	}
	return &greetv1.GreetResponse{
		Greeting: greeting,
	}, nil
}
```

Regardless of the protocol in use, Connect clients automatically unmarshal
response data into a standard Go error. Use Connect's `CodeOf` function and the
standard library's `errors.As` to inspect errors:

```go
client := greetv1connect.NewGreetServiceClient(
	connect.NewClient(
		connecthttp.NewTransport(http.DefaultClient, "http://localhost:8080"),
	),
)
_, err := client.Greet(
	context.Background(),
	&greetv1.GreetRequest{
		Name: "Jane",
	},
)
if err != nil {
	fmt.Println(connect.CodeOf(err))
	if connectErr := new(connect.Error); errors.As(err, &connectErr) {
		fmt.Println(connectErr.Message())
		fmt.Println(connectErr.Details())
	}
}
```

These APIs work for all three supported protocols, even if the server isn't
built with Connect.

Errors received from an RPC are marked remote. `IsRemote` distinguishes the
server's verdict from errors created locally, replacing v1's `IsWireError`.
A handler that returns a remote error unchanged sends the client a bare
`internal` code, so translate downstream failures into explicit local errors.

## Error Details

Like `grpc-go`, `connect-go` allows servers to enrich errors with more than
just a code and a string. Since Connect focuses on schema-first APIs, this
additional data &mdash; called error details &mdash; is a slice of
self-describing `ErrorDetail` values. On the Connect, gRPC, and gRPC-Web
protocols, details are Protobuf messages. Details are commonly used to send
backoff parameters for transient failures, localized error messages, or other
structured data. The `google.golang.org/genproto/googleapis/rpc/errdetails`
package contains a variety of Protobuf messages often used as error details.
Regardless of the RPC protocol in use, servers construct details with
`connectproto.NewErrorDetail` and add them to any `*Error` with `WithDetail`:

```go
package example

import (
	"time"

	"connectrpc.com/connect/v2"
	"connectrpc.com/connect/v2/connectproto"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/protobuf/types/known/durationpb"
)

func newTransientError() error {
	err := connect.NewError(
		connect.CodeUnavailable,
		"overloaded: back off and retry",
	)
	retryInfo := &errdetails.RetryInfo{
		RetryDelay: durationpb.New(10 * time.Second),
	}
	if detail, detailErr := connectproto.NewErrorDetail(retryInfo); detailErr == nil {
		err = err.WithDetail(detail)
	}
	return err
}
```

`WithDetail` returns a cloned error. The `ErrorDetail` struct carries the
message type name and the serialized message, which keeps the core free of a
Protobuf dependency and lets other transports define their own detail
encodings. Clients receive details as `*ErrorDetail` values and decode them
with `connectproto.UnmarshalErrorDetail`, which uses the global type
registry:

```go
package example

import (
	"errors"

	"connectrpc.com/connect/v2"
	"connectrpc.com/connect/v2/connectproto"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
)

func extractRetryInfo(err error) (*errdetails.RetryInfo, bool) {
	var connectErr *connect.Error
	if !errors.As(err, &connectErr) {
		return nil, false
	}
	for _, detail := range connectErr.Details() {
		msg, unmarshalErr := connectproto.UnmarshalErrorDetail(detail)
		if unmarshalErr != nil {
			// Usually, errors here mean that we don't have the schema for this
			// Protobuf message.
			continue
		}
		if retryInfo, ok := msg.(*errdetails.RetryInfo); ok {
			return retryInfo, true
		}
	}
	return nil, false
}
```

To bridge to gRPC-style APIs that expect an `*anypb.Any`, use
`connectproto.ErrorDetailToAny`.

Error details work best if they're limited to a small set of stable types used
by all APIs within your organization. Used sparingly, they're safer, more
extensible, and more efficient than ad-hoc HTTP header microformats.

Again, the handler and client APIs for working with error details work the same
for gRPC, gRPC-Web, and the Connect protocol.

## HTTP representation

While the Go APIs for working with errors are protocol-agnostic, each protocol
produces a differently-shaped HTTP response. You can consult the [gRPC HTTP/2
protocol][grpc-protocol], the [gRPC-Web protocol][grpcweb-protocol], and the
[Connect protocol](/docs/protocol/) for details, but it's helpful to understand
the broad strokes of each protocol's approach.

gRPC responses nearly always have an HTTP status of 200 OK, even when the
server returns an error. The error's code and message are sent as separate HTTP
trailers. The code, message, and error details are also serialized with
Protobuf, base64-encoded, and put into a third HTTP trailer. This approach is
the same for unary and streaming RPCs, and because trailers are part of the
HTTP standard, it's theoretically possible for any HTTP library to work with
the error code and message. Unfortunately, trailer support is spotty &mdash;
even web browsers don't support them.

gRPC-Web responses use nearly the same approach, but encode all the trailers
into the last portion of the response body. This works even when clients don't
support HTTP trailers, but still leaves failed responses with an HTTP 200
status code.

For unary (request-response) RPCs, the Connect protocol puts error codes,
messages, and details in the response body as human-readable JSON. The
response's HTTP status code is inferred from the Connect code, and is always in
the 4xx or 5xx range if the RPC fails. The response body for a unary Connect
error might look like this:

```json
{
  "code": "invalid_argument",
  "message": "data cannot be empty"
}
```

For streaming RPCs, the Connect protocol handles errors similarly to gRPC-Web.
This two-pronged approach sacrifices consistency between streaming and unary
RPCs, but it stays as close as possible to standard HTTP semantics and works
with the broadest array of HTTP libraries and tools.

[grpc-protocol]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
[grpcweb-protocol]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md
