# 004: Dart Implementation

This RFC proposes adding a Dart implementation of Connect starting with support for clients.
This will be similar in scope to Connect-Swift and Connect-Kotlin implementations.

## Why

Dart is a popular programming language powering frameworks like Flutter which
is used for cross-platform app development. This project will bring Connect support to the growing Flutter and Dart ecosystem.

## Anticipated complications

Dart runs on several platforms: Web, Android, and iOS to name a few. Most of the platforms
have their own HTTP stack with varying levels of support for HTTP specs. It doesn't have a
unified abstraction and APIs for common HTTP constructs like headers and cancellation.

We have to create a minimal HTTP abstraction to support various platforms. We can then have concrete
implementations using the following:

- [`HttpClient`][dart-io-client] from `dart:io`. This is part of the std library and runs on native platforms.
  This only supports HTTP/1.
- [`package:http2`][pub-http2]. This is a HTTP/2 implementation maintained by the Dart team. This can be used
  to support bidirectional streaming and gRPC. Connection management has to be implemented on top of this.
- [`dart:js_interop`][dart-js-interop]: This is part of the std library and can be used to create
  bindings for web APIs. We can use the `fetch` APIs to support Connect and gRPC-Web.

Platforms like Android and iOS have their own HTTP stack, and it is desirable to use them. [`package:http`][pub-http]
can be used as a cross platform client to support both. It is maintained by the Dart team. The only blocker
is the missing support for [aborting requests][http-abort-issue]. The `dart:io` based client will run on these devices.
Depending on the how the issue progresses we may have to provide ancillary packages to support native stacks.
This however, need not block v1 as we won't need API changes to support them.

## Supported features

Clients should support all three protocols and four RPC kinds where possible:

- Connect, gRPC-Web:
  - Should be supported on all platforms.
  - On the web, unary and server stream can be supported.
- gRPC:
  - Can be supported on native platforms with support for HTTP/2

These should be continuously tested using the [conformance suite][conformance] on both native and web platforms.

### Others

Clients should also support ancillary features, including but not limited to interceptors,
compression, mocking support, and a pluggable HTTP stack.

## Maintainers

The project can be maintained by:

- [Peter Edge](https://github.com/bufdev), [Buf](https://buf.build)
- [Steve Ayers](https://github.com/smaye81), [Buf](https://buf.build)
- [Sri Krishna Paritala](https://github.com/srikrsna-buf), [Buf](https://buf.build)

[conformance]: https://github.com/connectrpc/conformance
[dart-io-client]: https://dart.dev/libraries/dart-io#http-client
[dart-js-interop]: https://api.dart.dev/dart-js_interop/dart-js_interop-library.html
[http-abort-issue]: https://github.com/dart-lang/http/issues/424
[pub-http2]: https://pub.dev/packages/http2
[pub-http]: https://pub.dev/packages/http
