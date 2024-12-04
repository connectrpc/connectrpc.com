# 005: Dart Implementation

This RFC proposes adding a Dart implementation of Connect starting with clients.
This will be similar in scope to Connect-Swift and Connect-Kotlin implementations.

Dart is a popular programming language powering frameworks like Flutter which
is used for cross-platform app development. This will help grow Connect's
adoption.

Clients should support all three protocols (Connect, gRPC, and gRPC-Web) and all 
RPC types (Unary, Server streaming, Client streaming, and Bidi streaming) when possible.
Support can vary based on execution platform (native vs web).

Clients should also support ancillary features, including but not limited to interceptors,
 compression, and pluggable HTTP stack.
