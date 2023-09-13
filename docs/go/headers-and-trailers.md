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
type from `net/http`. Connect's `Request` and `Response` structs have explicit
access to headers, and the APIs work identically regardless of the RPC protocol
in use. In handlers:

```go
func (s *greetServer) Greet(
  ctx context.Context,
  req *connect.Request[greetv1.GreetRequest],
) (*connect.Response[greetv1.GreetResponse], error) {
  fmt.Println(req.Header().Get("Acme-Tenant-Id"))
  res := connect.NewResponse(&greetv1.GreetResponse{})
  res.Header().Set("Greet-Version", "v1")
  return res, nil
}
```

We find this much simpler than attaching headers to the context. Headers look
similar from the client's perspective:

```go
func call() {
  client := greetv1connect.NewGreetServiceClient(
    http.DefaultClient,
    "https://api.acme.com",
  )
  req := connect.NewRequest(&greetv1.GreetRequest{})
  req.Header().Set("Acme-Tenant-Id", "1234")
  res, err := client.Greet(context.Background(), req)
  if err != nil {
    fmt.Println(err)
    return
  }
  fmt.Println(res.Header().Get("Greet-Version"))
}
```

When sending or receiving errors, handlers and clients may use `Error.Meta()`
to access headers:

```go
func (s *greetServer) Greet(
  ctx context.Context,
  req *connect.Request[greetv1.GreetRequest],
) (*connect.Response[greetv1.GreetResponse], error) {
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
    connect.NewRequest(&greetv1.GreetRequest{}),
  )
  if connectErr := new(connect.Error); errors.As(err, &connectErr) {
    fmt.Println(err.Meta().Get("Greet-Version"))
  }
}
```

Keep in mind that Connect headers are just HTTP headers, so it's perfectly fine
to work them in `net/http` middleware!

Both the gRPC and Connect protocols [require](../protocol.md#unary-request)
that header keys contain only ASCII letters, numbers, underscores, hyphens, and
periods, and the protocols reserve all keys beginning with "Connect-" or
<!-- vale off -->
"Grpc-". Similarly, header values may contain only printable ASCII and spaces.
<!-- vale on -->
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
  req *connect.Request[greetv1.GreetRequest],
) (*connect.Response[greetv1.GreetResponse], error) {
  fmt.Println(req.Header().Get("Acme-Tenant-Id"))
  res := connect.NewResponse(&greetv1.GreetResponse{})
  res.Header().Set(
    "Greet-Emoji-Bin",
    connect.EncodeBinaryHeader([]byte("👋")),
  )
  return res, nil
}

func call() {
  res, err := greetv1connect.NewGreetServiceClient(
    http.DefaultClient,
    "https://api.acme.com",
  ).Greet(
    context.Background(),
    connect.NewRequest(&greetv1.GreetRequest{}),
  )
  if err != nil {
    fmt.Println(err)
    return
  }
  encoded := res.Header().Get("Greet-Emoji-Bin")
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
  req *connect.Request[greetv1.GreetRequest],
) (*connect.Response[greetv1.GreetResponse], error) {
  res := connect.NewResponse(&greetv1.GreetResponse{})
  // Sent as the HTTP header Trailer-Greet-Version.
  res.Trailer().Set("Greet-Version", "v1")
  return res, nil
}

func call() {
  res, err := greetv1connect.NewGreetServiceClient(
    http.DefaultClient,
    "https://api.acme.com",
  ).Greet(
    context.Background(),
    connect.NewRequest(&greetv1.GreetRequest{}),
  )
  if err != nil {
    fmt.Println(err)
    return
  }
  // Empty, because any HTTP headers prefixed with Trailer- are treated as
  // trailers.
  fmt.Println(res.Header())
  // Prefixes are automatically stripped.
  fmt.Println(res.Trailer().Get("Greet-Version"))
}
```
