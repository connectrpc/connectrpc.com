# 005: Dart Implementation

This RFC proposes adding a Dart implementation of Connect starting with support for clients.
This will be similar in scope to Connect-Swift and Connect-Kotlin implementations.

## Why

Dart is a popular programming language powering frameworks like Flutter which
is used for cross-platform app development. This will help grow Connect's
adoption.

## Anticipated complications

Dart runs on several platforms: Web, Android, and iOS to name a few. Most of the platforms
have their own HTTP stack with varying levels of support for HTTP specs. It doesn't have a
unified abstration and APIs for common HTTP constructs like headers and cancellation.

We have to create a minimal HTTP abstraction to support various platforms.

### Supported protocols

Clients should support all three protocols: Connect, gRPC, and gRPC-Web, when possible. On the
On the web only Connect and gRPC-Web protocols can be supported.

### Supported RPCs

Clients should support all RPC types: Unary, Server streaming, Client streaming, and Bidi streaming.
On the web only Unary and Server streaming RPCs can be supported.

### Other features

Clients should also support ancillary features, including but not limited to interceptors,
compression, and a pluggable HTTP stack.
