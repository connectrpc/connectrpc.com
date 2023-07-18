---
title: Multi-Protocol Support
sidebar_position: 990
---

Connect supports multiple protocols by switching on HTTP Content-Types: each
protocol uses a distinct set of types, so servers know which protocol the
client expects and respond appropriately. Because gRPC, gRPC-Web, and Connect's
own protocol have the same semantics, switching protocols doesn't require code
changes.

Assuming that you're using Protobuf schemas, the gRPC protocol uses the
`application/grpc`, `application/grpc+proto`, and `application/grpc+json`
Content-Types. The gRPC-Web protocol uses `application/grpc-web`,
`application/grpc-web+proto`, and `application/grpc-web+json`.

Again assuming Protobuf schemas, the [Connect protocol](protocol.md) uses the
`application/proto` and `application/json` Content-Types for unary RPCs. For
streaming, it uses `application/connect+proto` and `application/connect+json`.

## Compatible Semantics

This approach relies on all three protocols having compatible semantics:
they're communicating the same information using different HTTP conventions, so
the protocol is just an implementation detail. In particular, all three
protocols support:

- Pluggable serialization and compression.
- Unary RPCs and all three types of streaming.
- Timeouts.
- Headers and trailers (though gRPC-Web and the Connect protocol encode
  trailers into the last portion of the response body).
- Errors composed of a code, message, and strongly-typed details.

By organizing their APIs around these concepts and avoiding references to the
protocols themselves, Connect implementations let you switch protocols freely.
