---
title: Headers & trailers
---

To integrate with other systems, you may need to read or write custom HTTP
headers with your RPCs. For example, distributed tracing, authentication,
authorization, and rate limiting often require working with headers. Connect
also supports trailers, which serve a similar purpose but can be written
_after_ the response body. This document outlines how to work with headers and
trailers for unary (request-response) RPCs. The [streaming
documentation](/docs/go/streaming/) covers headers and trailers for streaming RPCs.

## Headers

Connect headers are just HTTP headers, modeled using the transport-agnostic
`connect.Header` type &mdash; a case-insensitive multi-map mirroring
`net/http.Header`, with methods like
`Get`, `Set`, `Add`, and `Values`. Access to the headers is done via context,
which should be familiar to Go developers. On the server, the
`CallInfoForServerContext` function can be used, which returns a `CallInfo`
type providing methods for header operations. Always check the second return
value: it's false when the method isn't invoked through a `connect.Server`,
such as a direct method call in a test, and accessing the nil `CallInfo`
panics:

```go
func (s *GreetServer) Greet(
	ctx context.Context,
	_ *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
	callInfo, ok := connect.CallInfoForServerContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeInternal, "no call info in context")
	}
	fmt.Println(callInfo.RequestHeader().Get("Acme-Tenant-Id"))
	res := &greetv1.GreetResponse{}
	callInfo.ResponseHeader().Set("Greet-Version", "v1")
	return res, nil
}
```

From the client's perspective, use the `NewClientContext` function, which creates
the `CallInfo` type in context:

```go
func main() {
	client := greetv1connect.NewGreetServiceClient(
		connect.NewClient(
			connecthttp.NewTransport(http.DefaultClient, "http://localhost:8080"),
		),
	)
	ctx, callInfo := connect.NewClientContext(context.Background())
	callInfo.RequestHeader().Set("Acme-Tenant-Id", "1234")
	_, err := client.Greet(ctx, &greetv1.GreetRequest{
		Name: "Jane",
	})
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(callInfo.ResponseHeader().Get("Greet-Version"))
}
```

HTTP-specific request information, like the TLS state, HTTP method, and URL,
lives on `connecthttp.ServerInfoForContext` and
`connecthttp.ClientInfoForContext`. The peer address and protocol are fields
on `CallInfo` itself.

Metadata sent alongside an error works the same way. Handlers set response
headers or trailers before returning the error, and clients read them from
the `CallInfo`:

```go
// Handler
func (s *GreetServer) Greet(
	ctx context.Context,
	_ *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
	callInfo, ok := connect.CallInfoForServerContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeInternal, "no call info in context")
	}
	callInfo.ResponseHeader().Set("Greet-Version", "v1")
	return nil, connect.NewError(connect.CodeUnknown, "oh no!")
}
```

```go
// Client
func main() {
	ctx, callInfo := connect.NewClientContext(context.Background())
	_, err := greetv1connect.NewGreetServiceClient(
		connect.NewClient(
			connecthttp.NewTransport(http.DefaultClient, "http://localhost:8080"),
		),
	).Greet(
		ctx,
		&greetv1.GreetRequest{
			Name: "Jane",
		},
	)
	if err != nil {
		fmt.Println(callInfo.ResponseHeader().Get("Greet-Version"))
	}
}
```

Keep in mind that Connect headers are just HTTP headers, so it's perfectly fine
to work with them in `net/http` middleware!

Both the gRPC and Connect protocols [require](/docs/protocol/#unary-request)
that header keys contain only ASCII letters, numbers, underscores, hyphens, and
periods, and the protocols reserve all keys beginning with "Connect-" or
"Grpc-". Similarly, header values may contain only printable ASCII and spaces.
In our experience, application code writing reserved or non-ASCII headers is
unusual; rather than wrapping `Header` in a fat validation layer, we
rely on your good judgment.

## Binary headers

To send non-ASCII values in headers, the gRPC and Connect protocols require
base64 encoding. Suffix your key with "-Bin" and use Connect's
`EncodeBinaryHeader` and `DecodeBinaryHeader` functions:

```go
// Handler
func (s *GreetServer) Greet(
	ctx context.Context,
	req *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
	callInfo, ok := connect.CallInfoForServerContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeInternal, "no call info in context")
	}
	fmt.Println(callInfo.RequestHeader().Get("Acme-Tenant-Id"))
	callInfo.ResponseHeader().Set(
		"Greet-Emoji-Bin",
		connect.EncodeBinaryHeader([]byte("👋")),
	)
	return &greetv1.GreetResponse{}, nil
}
```

```go
// Client
func main() {
	ctx, callInfo := connect.NewClientContext(context.Background())
	_, err := greetv1connect.NewGreetServiceClient(
		connect.NewClient(
			connecthttp.NewTransport(http.DefaultClient, "http://localhost:8080"),
		),
	).Greet(
		ctx,
		&greetv1.GreetRequest{
			Name: "Jane",
		},
	)
	if err != nil {
		fmt.Println(err)
		return
	}
	encoded := callInfo.ResponseHeader().Get("Greet-Emoji-Bin")
	if emoji, err := connect.DecodeBinaryHeader(encoded); err == nil {
		fmt.Println(string(emoji))
	}
}
```

Use this mechanism sparingly, and consider whether error details are a better
fit for your use case.

## Trailers

Connect's Go APIs for manipulating response trailers work identically for the
gRPC, gRPC-Web, and Connect protocols, even though each of the three protocols
encodes trailers differently. Trailers are most useful in streaming handlers,
which may need to send some metadata to the client after sending a few
messages. Unary handlers should nearly always use headers instead.

If you find yourself needing trailers, unary handlers and clients can access
them much like headers:

```go
// Handler
func (s *GreetServer) Greet(
	ctx context.Context,
	req *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
	callInfo, ok := connect.CallInfoForServerContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeInternal, "no call info in context")
	}
	// Sent as the HTTP header Trailer-Greet-Version.
	callInfo.ResponseTrailer().Set("Greet-Version", "v1")
	return &greetv1.GreetResponse{}, nil
}
```

```go
// Client
func main() {
	ctx, callInfo := connect.NewClientContext(context.Background())
	_, err := greetv1connect.NewGreetServiceClient(
		connect.NewClient(
			connecthttp.NewTransport(http.DefaultClient, "http://localhost:8080"),
		),
	).Greet(
		ctx,
		&greetv1.GreetRequest{
			Name: "Jane",
		},
	)
	if err != nil {
		fmt.Println(err)
		return
	}
	// Doesn't contain "Greet-Version" because any HTTP headers prefixed with
	// Trailer- are treated as trailers.
	fmt.Println(callInfo.ResponseHeader())
	// Prefixes are automatically stripped.
	fmt.Println(callInfo.ResponseTrailer().Get("Greet-Version"))
}
```
