---
title: Get Requests and Caching
sidebar_position: 4
---

Connect supports performing idempotent, side-effect free requests using an HTTP
GET-based protocol. This makes it easier to cache certain kinds of requests in
the browser, on your CDN, or in proxies and other middleboxes.

First, configure your server to handle HTTP GET requests using Connect. Refer
to the documentation that corresponds to your server:

- [Connect Go](../go/get-requests-and-caching.md)
- [Connect Node](../node/get-requests-and-caching.md)

If you are using clients to make query-style requests, you may want the ability
to use Connect HTTP GET request support. To opt-in for a given procedure, you
must mark it as being side-effect free using the
[`MethodOptions.IdempotencyLevel`][idempotency-level] option:

```protobuf
service ElizaService {
  rpc Say(stream SayRequest) returns (SayResponse) {
    option idempotency_level = NO_SIDE_EFFECTS;
  }
}
```

Clients will not automatically use GET requests by default.
To do that, you'll need to update your `ProtocolClientConfig` with
the enabled `GETConfiguration`.

```kotlin
val config = ProtocolClientConfig(
  getConfiguration = GETConfiguration.Enabled,
  ...
)
```

[idempotency-level]: https://github.com/protocolbuffers/protobuf/blob/e5679c01e8f47e8a5e7172444676bda1c2ada875/src/google/protobuf/descriptor.proto#L795
