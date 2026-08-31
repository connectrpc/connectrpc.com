---
title: Get Requests and Caching
---

Connect supports HTTP GET for idempotent, side-effect-free RPCs. This makes
the requests cacheable by browsers, CDNs, and intermediate proxies.

First, configure your server to handle HTTP GET. See the server-side guide
for your backend:

* [Connect Go](/docs/go/get-requests-and-caching/)
* [Connect Node](/docs/node/get-requests-and-caching/)
* [Connect Python](/docs/python/get-requests-and-caching/)

To opt a procedure into GET, mark it as side-effect-free with
[`MethodOptions.IdempotencyLevel`][idempotency-level]:

```protobuf
service ElizaService {
  rpc Say(SayRequest) returns (SayResponse) {
    option idempotency_level = NO_SIDE_EFFECTS;
  }
}
```

GET requests are off by default. Opt in by setting `getConfiguration` on
`ProtocolClientConfig`:

```kotlin
val config = ProtocolClientConfig(
    getConfiguration = GETConfiguration.Enabled,
    ...
)
```

`GETConfiguration.EnabledWithFallback(maxMessageBytes)` is also available; it
sends a GET only when the encoded message fits within `maxMessageBytes` and
falls back to POST otherwise.

[idempotency-level]: https://github.com/protocolbuffers/protobuf/blob/e5679c01e8f47e8a5e7172444676bda1c2ada875/src/google/protobuf/descriptor.proto#L795
