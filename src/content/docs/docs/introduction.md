---
title: Introduction
description: "Connect is a family of libraries for building browser and gRPC-compatible HTTP APIs from a single Protocol Buffer schema."
---

Connect is a family of libraries for building browser and gRPC-compatible HTTP
APIs: you write a short [Protocol Buffer][protobuf] schema and implement your
application logic, and Connect generates code to handle marshaling, routing,
compression, and content type negotiation. It also generates an idiomatic,
type-safe client in any supported language.

## Production-grade simplicity

Each Connect implementation is _focused_: just the essential features,
built on top of time-tested HTTP libraries and designed to get out of your way.
In Go, Connect is just [one package][connect-go], which is short enough to read
in an afternoon.

Connect is our vision of production-grade RPC. It's simple, reliable, and
unobtrusive, because nobody has time to debug overcomplicated networking or
sift through a hundred esoteric options. Under the hood, it's just Protocol
Buffers and the HTTP client your language already ships: `net/http` in Go,
`fetch` in the browser, `URLSession` on Apple platforms.

Most of all, Connect is stable. We take backward compatibility _very_
seriously: stable implementations follow semantic versioning, so upgrading
within a major version will never break your build.

## Seamless multi-protocol support

Connect servers and clients support three protocols: gRPC, gRPC-Web, and
Connect's own protocol.

- Connect fully supports the [gRPC protocol][grpc-protocol], including
  streaming, trailers, and error details. Any gRPC client, in any language, can
  call a Connect server, and Connect clients can call any gRPC server. We
  validate our gRPC compatibility with an [extended version][connect-conformance]
  of Google's own interoperability tests.
- Connect also offers direct support for the [gRPC-Web
  protocol][grpcweb-protocol] used by [grpc/grpc-web][grpcweb], without relying
  on a translating proxy like Envoy.
- Finally, Connect supports [its own protocol][connect-protocol]: a
  straightforward HTTP-based protocol that works over HTTP/1.1, HTTP/2, and
  HTTP/3. It keeps what gRPC and gRPC-Web are good at, including streaming,
  error details, and metadata, but stays close enough to ordinary HTTP that
  browsers, proxies, and cURL can all work with it, which makes it equally at
  home in browsers, monoliths, and microservices. Implementations support JSON
  and binary Protobuf encodings by default. You can call our live [demo
  service][demo] with cURL:

  ```bash
  curl \
      --header "Content-Type: application/json" \
      --data '{"sentence": "I feel happy."}' \
      https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say
  ```

By default, Connect servers support ingress from all three protocols. Clients
default to using the Connect protocol, but can switch to gRPC or gRPC-Web with
a configuration toggle, requiring no further code changes. The APIs for
errors, headers, trailers, and streaming are all protocol-agnostic.

## Go

Connect's Go implementation is stable, and runs in production at Buf and
several other companies. You can [get started with `connect-go`
now][go-getting-started].

## TypeScript and JavaScript

Connect for ECMAScript is stable and covers both ends of the stack. Get started
in the browser on the [web][web-getting-started], or on the server with
[Node.js][node-getting-started].

## Swift and Kotlin

For mobile applications, [`connect-swift`][connect-swift] (stable) and
[`connect-kotlin`][connect-kotlin] (beta) are available. Get started today
with our [Swift guide][swift-getting-started] and [Kotlin
guide][kotlin-getting-started].

## Dart

[Connect for Dart][connect-dart] is stable, for Flutter applications and
server-side Dart alike. Get started with our [Dart guide][dart-getting-started].

## Python

[Connect for Python][connect-py] is available in beta.
You can get started with our [Python guide][python-getting-started].

## Rust

[Connect for Rust][connect-rust] is pre-1.0, though the runtime already passes
the full conformance suite as both client and server across all three
protocols. It's built on [Tower][tower], so it drops into Axum, hyper, and the
rest of that ecosystem. Get started with our [Rust guide][rust-getting-started].

## What's next?

In addition to improving our current Connect implementations, we'd eventually
like to bring Connect to more languages and frameworks. Our current roadmap is
always pinned to the top of our [GitHub discussions][announcement-discussions],
and we gauge interest in new languages with [GitHub polls][poll-discussions].

[connect-py]: https://github.com/connectrpc/connect-py
[python-getting-started]: /docs/python/getting-started
[connect-conformance]: https://github.com/connectrpc/conformance
[connect-dart]: https://github.com/connectrpc/connect-dart
[dart-getting-started]: /docs/dart/getting-started
[connect-rust]: https://github.com/connectrpc/connect-rust
[rust-getting-started]: /docs/rust/getting-started
[tower]: https://docs.rs/tower
[connect-go]: https://github.com/connectrpc/connect-go
[connect-kotlin]: https://github.com/connectrpc/connect-kotlin
[connect-swift]: https://github.com/connectrpc/connect-swift
[swift-launch-blog-post]: https://buf.build/blog/announcing-connect-swift
[connect-protocol]: /docs/protocol
[demo]: https://github.com/connectrpc/examples-go
[go-getting-started]: /docs/go/getting-started
[kotlin-getting-started]: /docs/kotlin/getting-started
[swift-getting-started]: /docs/swift/getting-started
[web-getting-started]: /docs/web/getting-started
[node-getting-started]: /docs/node/getting-started
[grpcweb]: https://github.com/grpc/grpc-web
[grpcweb-protocol]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md
[grpc-protocol]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
[launch-blog-post]: https://buf.build/blog/connect-a-better-grpc
[web-launch-blog-post]: https://buf.build/blog/connect-web-protobuf-grpc-in-the-browser
[node-launch-blog-post]: https://buf.build/blog/connect-node-preview
[protobuf]: https://developers.google.com/protocol-buffers
[announcement-discussions]: https://github.com/orgs/connectrpc/discussions/categories/announcements
[poll-discussions]: https://github.com/orgs/connectrpc/discussions/categories/polls
