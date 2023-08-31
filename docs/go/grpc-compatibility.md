---
title: gRPC compatibility
sidebar_position: 90
---

Connect fully supports the gRPC and gRPC-Web protocols, including streaming. We
validate our implementation of these protocols using [an extended
version][connect-conformance] of Google's own interoperability tests.

## Handlers

Handlers support the gRPC protocol by default: they work with `grpc-go`,
`grpcurl`, and any other gRPC client using TLS without any special
configuration. To support gRPC clients using HTTP/2 without TLS, use
`golang.org/x/net/http2/h2c` as described in [the deployment
documentation](deployment.md#h2c).

Handlers also automatically support the binary gRPC-Web protocol directly,
without a translating proxy like Envoy. Since modern browsers all support
binary payloads, Connect doesn't support gRPC-Web's text mode: if you're using
`protoc-gen-grpc-web`, you must use `mode=grpcweb` when generating code.

Many gRPC-specific tools depend on server reflection, which lets callers
access your service's Protobuf schema at runtime. Connect supports server
reflection with the `connectrpc.com/grpcreflect` package. Keep
in mind that there are two versions of the gRPC server reflection API, and many
tools (including `grpcurl`) still use the older one &mdash; most services
should mount handlers from both `grpcreflect.NewHandlerV1` and
`grpcreflect.NewHandlerV1Alpha`.

Container orchestration and health-checking systems often support the gRPC
health checking API. If you'd prefer gRPC-style health checks instead of more
traditional HTTP checks, use `connectrpc.com/grpchealth`.

## Clients

Clients default to using the Connect protocol. To use the gRPC or gRPC-Web
protocols, use the `WithGRPC` or `WithGRPCWeb` options during client
construction. If the gRPC server is using TLS, Connect clients work with no
further configuration. If the gRPC server is using HTTP/2 without TLS,
configure your HTTP client using `golang.org/x/net/http2` as described in the
[deployment documentation](deployment.md#h2c).

## Migration

There's no ironclad guide to migrating an existing `grpc-go` service to
`connect-go` &mdash; every codebase uses a different subset of `grpc-go`
features and will need a slightly different approach. Unlike many RPC framework
migrations, remember that you do _not_ need to modify your service's clients:
they can continue to use their current gRPC clients. Your current Protobuf
schema will also work without modification.

The particulars of your codebase will be unique, but most migrations include a
few common steps:

1. Begin generating code with `protoc-gen-connect-go`. During the migration,
   your code can import `connect-go` and `grpc-go` code without any problems.
1. Change your service implementations to accept `connect.Request`-wrapped
   Protobuf messages, and wrap your returned response messages using
   `connect.NewResponse`. Rather than using context-based APIs for reading and
   writing metadata, use the `connect.Request` and `connect.Response` types
   directly.
1. Where necessary, change your service implementations to return Connect
   errors. Connect and gRPC use the same error codes, so this is often a
   straightforward replacement of `status.Error` with `connect.NewError`.
1. Migrate any streaming handlers to use the Connect stream types. These are
   broadly similar to their `grpc-go` equivalents.
1. Once you've migrated your service implementations to Connect, switch your
   `main` function to use a `net/http` server instead of `grpc-go`. Remember to
   [use h2c](deployment.md#h2c) if your service's clients aren't using TLS. At
   this point, you're halfway done: your service should compile, and you could
   deploy it without migrating your calls to downstream services.
1. Next, tackle your downstream calls. Switch to Connect's generated client
   types, and wrap their request messages using `connect.NewRequest`. Rather
   than using context-based APIs, set request headers directly on the request.
   Rather than using call options, read response metadata directly from the
   `connect.Response`. Don't forget to use `WithGRPC` when constructing your
   client, and if necessary [configure your HTTP clients to use
   h2c](deployment.md#h2c).
1. Where necessary, switch from `status.Code` and `status.FromError` to
   `connect.CodeOf` and the standard library's `errors.As`.
1. Migrate any streaming calls to the Connect stream types.
1. You're done! Unless your service is in the same repository as its clients,
   you can stop generating code with `protoc-gen-go-grpc`.

[connect-conformance]: https://github.com/connectrpc/conformance
