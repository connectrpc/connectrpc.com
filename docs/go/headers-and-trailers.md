---
title: Headers & trailers
sidebar_position: 50
---

To integrate with other systems, you may need to read or write custom HTTP
headers with your RPCs. For example, distributed tracing, authentication,
authorization, and rate limiting often require working with headers. Connect
also supports trailers, which serve a similar purpose but can be written
_after_ the response body. This document outlines how to work with headers and
trailers for unary (request-response) RPCs. The [streaming
documentation](streaming.md) covers headers and trailers for streaming RPCs.

## Headers

Connect headers are just HTTP headers, modeled using the familiar `Header`
type from `net/http`. Access to the headers is done via context, which should be
familiar to Go developers. On the server, the `CallInfoForHandlerContext` function
can be used, which returns a `CallInfo` type providing methods for header operations:

```go
func (s *greetServer) Greet(
  ctx context.Context,
  req *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
  callInfo, ok := connect.CallInfoForHandlerContext(ctx)
  fmt.Println(callInfo.RequestHeader().Get("Acme-Tenant-Id"))
  res := &greetv1.GreetResponse{}
  callInfo.ResponseHeader().Set("Greet-Version", "v1")
  return res, nil
}
```

From the client's perspective, use the `NewClientContext` function, which creates
the `CallInfo` type in context:

```go
func call() {
  client := greetv1connect.NewGreetServiceClient(
    http.DefaultClient,
    "https://api.acme.com",
  )
  ctx, callInfo := connect.NewClientContext(context.Background())
  callInfo.RequestHeader().Set("Acme-Tenant-Id", "1234")
  res, err := client.Greet(ctx, &greetv1.GreetRequest{})
  if err != nil {
    fmt.Println(err)
    return
  }
  fmt.Println(callInfo.ResponseHeader().Get("Greet-Version"))
}
```

When sending or receiving errors, handlers and clients may use `Error.Meta()`
to access headers:

```go
func (s *greetServer) Greet(
  ctx context.Context,
  req *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
  err := connect.NewError(
    connect.CodeUnknown,
    errors.New("oh no!"),
  )
  err.Meta().Set("Greet-Version", "v1")
  return nil, err
}

func call() {
  _, err := greetv1connect.NewGreetServiceClient(
    http.DefaultClient,
    "https://api.acme.com",
  ).Greet(
    context.Background(),
    &greetv1.GreetRequest{},
  )
  if connectErr := new(connect.Error); errors.As(err, &connectErr) {
    fmt.Println(connectErr.Meta().Get("Greet-Version"))
  }
}
```

Keep in mind that Connect headers are just HTTP headers, so it's perfectly fine
to work them in `net/http` middleware!

Both the gRPC and Connect protocols [require](../protocol.md#unary-request)
that header keys contain only ASCII letters, numbers, underscores, hyphens, and
periods, and the protocols reserve all keys beginning with "Connect-" or
"Grpc-". Similarly, header values may contain only printable ASCII and spaces.
In our experience, application code writing reserved or non-ASCII headers is
unusual; rather than wrapping `net/http.Header` in a fat validation layer, we
rely on your good judgment.

## Binary headers

To send non-ASCII values in headers, the gRPC and Connect protocols require
base64 encoding. Suffix your key with "-Bin" and use Connect's
`EncodeBinaryHeader` and `DecodeBinaryHeader` functions:

```go
func (s *greetServer) Greet(
  ctx context.Context,
  req *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
  callInfo, ok := connect.CallInfoForHandlerContext(ctx)
  fmt.Println(callInfo.RequestHeader().Get("Acme-Tenant-Id"))
  callInfo.ResponseHeader().Set(
    "Greet-Emoji-Bin",
    connect.EncodeBinaryHeader([]byte("👋")),
  )
  return &greetv1.GreetResponse{}, nil
}

func call() {
  ctx, callInfo := connect.NewClientContext(context.Background())
  res, err := greetv1connect.NewGreetServiceClient(
    http.DefaultClient,
    "https://api.acme.com",
  ).Greet(
    ctx,
    &greetv1.GreetRequest{},
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
func (s *greetServer) Greet(
  ctx context.Context,
  req *greetv1.GreetRequest,
) (*greetv1.GreetResponse, error) {
  callInfo, ok := connect.CallInfoForHandlerContext(ctx)
  // Sent as the HTTP header Trailer-Greet-Version.
  callInfo.ResponseTrailer().Set("Greet-Version", "v1")
  return &greetv1.GreetResponse{}, nil
}

func call() {
  ctx, callInfo := connect.NewClientContext(context.Background())
  res, err := greetv1connect.NewGreetServiceClient(
    http.DefaultClient,
    "https://api.acme.com",
  ).Greet(
    ctx,
    &greetv1.GreetRequest{},
  )
  if err != nil {
    fmt.Println(err)
    return
  }
  // Empty, because any HTTP headers prefixed with Trailer- are treated as
  // trailers.
  fmt.Println(callInfo.ResponseHeader())
  // Prefixes are automatically stripped.
  fmt.Println(callInfo.ResponseTrailer().Get("Greet-Version"))
}
```
