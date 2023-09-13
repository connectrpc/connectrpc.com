---
title: Introduction
sidebar_position: 1
---

Connect is a family of libraries for building browser and gRPC-compatible HTTP
APIs: you write a short [Protocol Buffer][protobuf] schema and implement your
application logic, and Connect generates code to handle marshaling, routing,
compression, and content type negotiation. It also generates an idiomatic,
type-safe client in any supported language.

## Production-grade simplicity

Each Connect implementation is _focused_: just the essential features,
built on top of time-tested HTTP libraries and designed to get out of your way.
In Go, Connect is just [one package][connect-go] &mdash; short enough to read
in an afternoon.

Connect is our vision of production-grade RPC. It's simple, reliable, and
unobtrusive, because nobody has time to debug overcomplicated networking or
sift through a hundred esoteric options. Under the hood, it's just Protocol
Buffers and `net/http`, `fetch`, `URLSession`, or your language's gold standard
for HTTP.

Most of all, Connect is stable. We take backward compatibility _very_
seriously, and we'll never break your build after tagging a stable release.

## Seamless multi-protocol support

Connect servers and clients support three protocols: gRPC, gRPC-Web, and
Connect's own protocol.

<!-- vale off -->
- Connect fully supports the [gRPC protocol][grpc-protocol], including
<!-- vale on -->
  streaming, trailers, and error details. Any gRPC client, in any language, can
  call a Connect server, and Connect clients can call any gRPC server. We
  validate our gRPC compatibility with an [extended version][connect-conformance]
  of Google's own interoperability tests.
- Connect also offers direct support for the [gRPC-Web
  protocol][grpcweb-protocol] used by [gRPC/gRPC-Web][grpcweb], without relying
  on a translating proxy like Envoy.
- Finally, Connect supports [its own protocol][connect-protocol]: a
  straightforward HTTP-based protocol that works over HTTP/1.1 and HTTP/2. It
  takes the best parts of gRPC and gRPC-Web, including streaming,
  and packages them into a protocol that's equally at home in browsers, monoliths, and
  microservices. The Connect protocol is what we think the gRPC protocol should
  be. By default, JSON- and binary-encoded Protobuf is supported. You can
  call our live [demo service][demo] with cURL:

  ```bash
  curl \
      --header "Content-Type: application/json" \
      --data '{"sentence": "I feel happy."}' \
      https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say
  ```

By default, Connect servers support ingress from all three protocols. Clients
default to using the Connect protocol, but can switch to gRPC or gRPC-Web with
a configuration toggle &mdash; no further code changes required. The APIs for
errors, headers, trailers, and streaming are all protocol-agnostic.

## Go

Connect's Go implementation is stable and used by several companies (including
Buf) in production. You can [get started with `connect-go`
now][go-getting-started].

## TypeScript and JavaScript

Connect for ECMAScript is currently pre-v1, but we have been using it on the web
in production for a while. We plan to release a stable v1 in early 2023. However,
you can [get started now][web-getting-started].

Connect for Node is currently in beta. We plan to release a stable v1
alongside Connect for Web. You can [get started with `connect-node` now][node-getting-started].

## Swift and Kotlin

We believe Protobuf should be the best choice for API development
at every layer of the stack, and this includes mobile clients.

To this end, both [`connect-swift`][connect-swift] and [`connect-kotlin`][connect-kotlin] are now available in beta,
and you can get started today with the [Swift getting started guide][swift-getting-started] and
the [Kotlin getting started guide][kotlin-getting-started]!

## What's next?

In addition to improving our current suite of Connect products and moving
our beta products to a stable v1, eventually, we'd like to release Connect
implementations for Rails, Django, Laravel, and similar frameworks.

You shouldn't have to choose between these productive toolkits and
Protocol Buffers &mdash; they should work seamlessly together.

[connect-conformance]: https://github.com/connectrpc/conformance
[connect-go]: https://github.com/connectrpc/connect-go
[connect-kotlin]: https://github.com/bufbuild/connect-kotlin
[connect-swift]: https://github.com/bufbuild/connect-swift
[swift-launch-blog-post]: https://buf.build/blog/announcing-connect-swift
[connect-protocol]: /docs/protocol
[demo]: https://github.com/bufbuild/examples-go
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
