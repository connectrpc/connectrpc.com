---
title: FAQ
sidebar_position: 1000
---

## The Connect protocol

### Why special-case unary RPCs?

The Connect protocol is effectively _two_ protocols, one for unary RPC and one
for streaming. This isn't intellectually satisfying &mdash; it would be purer
to treat unary RPCs as a bidirectional stream with exactly one message sent in
each direction. In practice, we've found the loss of purity well worth it. By
using standard HTTP compression negotiation and eliminating binary framing from
the body, the Connect protocol lets us make unary RPCs with web browsers, cURL,
or any other HTTP client.

### Why not use HTTP status codes?

Every taxonomy of errors is flawed, but at least HTTP status codes are
time-tested and widely understood. In a perfect world, we'd have used HTTP
status codes as-is for the Connect protocol. Unfortunately, we want Connect
handlers and clients to support the gRPC wire protocols without code changes.
Since the mapping between gRPC and HTTP status codes is lossy, we can't provide
an acceptable gRPC experience without adopting the same set of codes. C'est la
vie.

### Why not use the Twirp protocol?

We really like [Twirp's protocol][twirp-protocol]! It's simple, doesn't rely on
any HTTP/2-specific framing, and works nicely with general-purpose HTTP tools.
Unfortunately, it didn't fit our needs:

- It doesn't support streaming RPCs. Even if _most_ RPCs are unary, many
  organizations have a handful of APIs that do benefit from streaming.
- It's semantically incompatible with gRPC. Because Twirp doesn't specify how
  to encode timeouts and uses a very different error model, swapping protocols
  requires significant code changes.

In the end, we prioritized gRPC and gRPC-Web compatibility over Twirp support.
We hope that Connect's unary protocol captures most of Twirp's magic while
still allowing your code to interoperate with the larger gRPC ecosystem.

## Serialization & compression

### Why are numbers serialized as strings in JSON?

Javascript's `Number` is an IEEE 754 double-precision float: even though it
occupies 64 bits of memory, some of the space is reserved for the fractional
portion of the number. There's just not enough space left to represent 64-bit
integers! To make absolutely sure that integers are handled correctly, the
Protobuf JSON mapping represents the `int64`, `fixed64`, and `uint64` types as
strings.

This only affects calls made with cURL, the browser's `fetch` API, or other
plain HTTP tools. Connect clients automatically convert numeric values to and
from strings.

### Why are unknown JSON fields ignored?

Following the [proto3 language guide](https://protobuf.dev/programming-guides/proto3/#json-options),
a JSON parser should reject unknown fields by default. However, we found the
behavior to be impractical for RPC because it means that the schema cannot
evolve without breaking existing clients: simply adding a field to a response will break old clients. Therefore,
Connect clients and servers will ignore unknown fields, provided that the
underlying implementation allows us to do so.


## Go

### Why use generics?

Generic code is inherently more complex than non-generic code. Still, introducing
generics to `connect-go` eliminated two significant sources of complexity:

* Generics let us generate less code, especially for streaming RPCs &mdash; if
  you're willing to write out some long URLs, it's now just as easy to use
  Connect without `protoc-gen-connect-go`. The generic stream types, like
  `BidirectionalStream`, are much clearer than the equivalent code generation
  templates.
* We don't need to attach any values to the context, because Connect's generic
  `Request` and `Response` structs can carry headers and trailers explicitly.
  This makes data flow obvious and avoids any confusion about inbound and
  outbound metadata.

On balance, we find `connect-go` simpler with generics.

### Why generate Connect-specific packages?

If you're familiar with Protobuf, you may have noticed that
`protoc-gen-connect-go` behaves a little differently from many other plugins:
rather than adding code alongside the basic message types, it creates a
separate, Connect-specific Go package and imports the base types.

This serves a few purposes:

* It keeps the base types lightweight, so _every_ package that works with
  Protobuf messages doesn't drag along an RPC framework.
* It avoids name collisions. Many Protobuf plugins &mdash; including
  `protoc-gen-go-grpc` &mdash; generate code alongside the base types, so the
  package namespace becomes very crowded.
* It keeps the contents of the base types package constant. This isn't critical
  when generating code locally, but it's critical to making [remote packages] and [remote plugins]
  work.

## TypeScript and JavaScript

### Why do I need a proxy to call gRPC backends?

The HTTP protocol specification has included trailers for decades. In practice,
they were rarely used. Many HTTP implementations &mdash; including web browsers
&mdash; still don't support trailers.

Unfortunately, gRPC makes extensive use of HTTP trailers. Because browsers
don't support trailers, no code running in a browser can speak the gRPC protocol.
To work around this, the gRPC team introduced the gRPC-Web protocol, which
encodes trailers at the end of the response body.

Some gRPC servers (including those built with `connect-go`) support the
gRPC-Web protocol natively, so browsers can communicate directly with your
backend. Most of Google's gRPC implementations don't support gRPC-Web, so you
must run a proxy like Envoy to translate to and from the standard gRPC
protocol.

### Is streaming supported?

While the Connect protocol supports _all_ types of streaming RPCs, web browsers
do not support streaming from the client-side across the board. The fetch API
_does_ specify streaming request bodies, but unfortunately, browser vendors have
not come to an agreement to support streams from the client – see this
[WHATWG issue on GitHub][whatwg-streams-issue]. This means you can use streaming
from the browser, but only server-streaming.

### Does generated code affect bundle size?

Yes, generated code does affect bundle size, but the browser implementation is a
slim library using standard Web APIs, and deliberately generates [very little code](/docs/web/generating-code#output).
For an ELIZA client, the compressed bundle size is [just around 13KiB](https://github.com/bufbuild/connect-es/tree/main/packages/connect-web-bench).

### How does Connect compare to gRPC-web?

With Connect, you don't need a proxy to provide your gRPC service as gRPC-web,
and TypeScript is supported out of the box. Requests are easy to inspect in the
browser, because the JSON format is used by default, where gRPC-web only supports
the binary format.

That said, Connect ships with support for the gRPC-web protocol and is fully
compatible with existing gRPC-web backends. See [Choosing a protocol](/docs/web/choosing-a-protocol).

### What Protobuf runtime does Connect use for TypeScript?

Connect uses the Protobuf runtime provided by [Protobuf-ES](https://github.com/bufbuild/protobuf-es).
Additionally, the code generator plugin used by Connect-ES is based on the plugin
framework also provided by Protobuf-ES.  For any questions you may have about this library,
visit the [Protobuf-ES FAQ page](https://github.com/bufbuild/protobuf-es/blob/main/docs/faq.md).

### How do I provide a type registry for sending or receiving Any?

If a RPC in your schema uses `google.protobuf.Any` in a request or response
message, you can provide a type registry so that they can be parsed from or
serialized to JSON. See [this GitHub discussion](https://github.com/bufbuild/connect-es/discussions/689#discussioncomment-6280653)
for a detailed explanation and an example.

## Deployment

### Missing trailers with Ambassador

If you're using Ambassador for Kubernetes ingress and seeing "server closed the
stream without sending trailers" errors, you may have overlapping gRPC and HTTP
mappings for your backend services. You can work around this problem using the
`cluster_tag` property, as described in
[emissary-ingress/emissary#3112](https://github.com/emissary-ingress/emissary/issues/3112).

[remote packages]: https://buf.build/docs/bsr/remote-packages/overview/
[remote plugins]: https://buf.build/docs/bsr/remote-plugins/overview/
[twirp-protocol]: https://github.com/twitchtv/twirp/blob/main/PROTOCOL.md
[whatwg-streams-issue]: https://github.com/whatwg/fetch/issues/1438
