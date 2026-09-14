---
title: In-process transport
---

Generated Connect clients dispatch RPCs through a `connect.Transport`,
usually the HTTP transport created by `connecthttp.NewTransport`. The
`connectrpc.com/connect/v2/connectinprocess` package provides an alternative
transport that dispatches every RPC directly to a `connect.Server` in the
same process, without any networking.

Because transports are interchangeable, clients using the in-process
transport behave like clients using an HTTP transport. Interceptors run on
both the client and the server, headers and trailers flow between them, and
errors arrive marked as remote. This makes it ideal for
[testing](/docs/go/testing/). It's also useful in production: services that
call each other through Connect clients can be deployed in a single process,
choosing between the in-process and HTTP transports at startup.

## Constructing clients

`connectinprocess.New` wraps a `connect.Server`. Pass the returned transport
to `connect.NewClient`:

```go
server := connect.NewServer()
greetv1connect.RegisterGreetServiceHandler(server, &GreetServer{})

client := greetv1connect.NewGreetServiceClient(
	connect.NewClient(connectinprocess.New(server)),
)

res, err := client.Greet(ctx, &greetv1.GreetRequest{Name: "Jane"})
```

The server doesn't need to be mounted on a mux or listen on a port. Register
your handlers, wrap the server in the transport, and call it.

## Delegating between API versions

A common production use is serving a legacy API version alongside its
replacement. The legacy handler adapts each request to the new schema, then
invokes the new RPC through an in-process client:

```go
// GreetV1Server implements the legacy API by delegating to the v2 service.
type GreetV1Server struct {
	v2 greetv2connect.GreetServiceClient
}

func (s *GreetV1Server) Greet(
	ctx context.Context,
	req *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
	// Adapt the v1 request to the v2 schema, then invoke the v2 RPC.
	res, err := s.v2.Greet(ctx, &greetv2.GreetRequest{Name: req.Name})
	if err != nil {
		return nil, err
	}
	return &greetv1.GreetResponse{Greeting: res.Greeting}, nil
}

func main() {
	server := connect.NewServer()
	greetv2connect.RegisterGreetServiceHandler(server, &GreetV2Server{})

	v2client := greetv2connect.NewGreetServiceClient(
		connect.NewClient(connectinprocess.New(server)),
	)
	greetv1connect.RegisterGreetServiceHandler(server, &GreetV1Server{v2: v2client})
	// Mount the server and serve as usual.
}
```

Delegate through the client rather than calling the v2 service's methods
directly. A direct method call runs on the v1 RPC's context: the v2 handler
would read the v1 call's `CallInfo`, and any response metadata it sets would
leak into the v1 response. Invoking the RPC through the in-process client
gives the inner call its own `CallInfo` and runs interceptors, just like a
network call.

## Message copying

A network transport serializes each message, so the client and the server
never share memory. The in-process transport preserves this property by deep
copying each request and response with `connectinprocess.ProtoCopy`, which
uses the Protobuf runtime to reset the destination and merge the source. A
handler that mutates its request can't affect the client's copy.

Copying is much faster than serialization, but it's not free. To replace the
strategy, pass `connectinprocess.WithCopyFunc` to the constructor:

```go
transport := connectinprocess.New(server, connectinprocess.WithCopyFunc(copyFunc))
```

## Streaming

Streaming handlers run on their own goroutine. Messages flow through
unbuffered channels, so each send blocks until the other side receives the
message. This gives streams the same backpressure as a network transport,
without any buffering. Unary RPCs skip the goroutine and dispatch
synchronously.

## Differences from HTTP

The RPC never leaves the process, so there is no HTTP request:
`connecthttp.ServerInfoForContext` reports false, and transport-specific
`CallInfo` fields like `Protocol` and `PeerAddr` are empty. The [error
semantics](/docs/go/errors/) match the wire protocols:

- Errors returned by the handler arrive at the client marked as remote, just
  like errors decoded from a network response.
- Bare errors surface as `unknown` without their message text. Context
  cancellation and deadline expiry keep their `canceled` and
  `deadline_exceeded` codes.
- A handler that returns a remote error unchanged sends the client a bare
  `internal` code, exactly as over the network.
