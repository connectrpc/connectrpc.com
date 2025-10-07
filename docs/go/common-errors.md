---
title: Common errors
sidebar_position: 110
---

This page explains how to fix common errors when working with `connect-go`.
Where possible, the Connect runtime recognizes these problems and includes a
link to this page in the error message.

## Client missing WithGRPC

If you use a Connect client to call a `grpc-go` server but forget the `WithGRPC`
option, you'll see a long error that looks like this:

```
unavailable: possible missing connect.WithGRPC() client option when talking to
gRPC server, see https://connectrpc.com/docs/go/common-errors: Post
"http://0.0.0.0:3000/buf.ping.v1alpha1.PingService/Ping": http2: Transport:
cannot retry err [stream error: stream ID 3; PROTOCOL_ERROR; received from
peer] after Request.Body was written; define Request.GetBody to avoid this
error
```

You can fix this error by using the `WithGRPC` client option when constructing
your client.

```go
client := greetv1connect.NewGreetServiceClient(
  http.DefaultClient, // though you may also need h2c, see below
  "http://localhost:8080",
  connect.WithGRPC(),
)
```

## Client missing h2c configuration

If you use a Connect client to call a `grpc-go` server that doesn't support
TLS, you'll probably see this error:

```
unavailable: possible h2c configuration issue when talking to gRPC server, see
https://connectrpc.com/docs/go/common-errors: Post
"http://0.0.0.0:3000/buf.ping.v1alpha1.PingService/Ping": net/http: HTTP/1.x
transport connection broken: malformed HTTP response
"\x00\x00\x06\x04\x00\x00\x00\x00\x00\x00\x05\x00\x00@\x00"
```

In some cases, you'll see a more generic error instead:

```
unavailable: possible h2c configuration issue when talking to gRPC server, see
https://connectrpc.com/docs/go/common-errors: Post
"http://0.0.0.0:3000/buf.ping.v1alpha1.PingService/Ping": write tcp
127.0.0.1:64657->127.0.0.1:3000: write: broken pipe
```

In either case, check whether the server expects clients to use HTTP/2 without
TLS. If so, make sure your HTTP client [has h2c enabled](deployment.md#h2c):

```go
client := greetv1connect.NewGreetServiceClient(
  &http.Client{
    Transport: &http2.Transport{
      AllowHTTP: true,
      DialTLS: func(network, addr string, _ *tls.Config) (net.Conn, error) {
        // If you're also using this client for non-h2c traffic, you may want to
        // delegate to tls.Dial if the network isn't TCP or the addr isn't in an
        // allowlist.
        return net.Dial(network, addr)
      },
    },
  },
  "http://localhost:8080",
  connect.WithGRPC(),
)
```
