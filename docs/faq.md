---
title: FAQs
sidebar_position: 1000
---

## The Connect protocol

### Where can I find Connect implementations?

All implementations are listed at the main [ConnectRPC repository][main-repo].

### Why special-case unary RPCs?

The Connect protocol is effectively _two_ protocols, one for unary RPC and one
for streaming. This isn't intellectually satisfying &mdash; it would be purer
to treat unary RPCs as a bidirectional stream with exactly one message sent in
each direction. In practice, we've found the loss of purity well worth it. By
using standard HTTP compression negotiation and eliminating binary framing from
the body, the Connect protocol lets us make unary RPCs with web browsers, cURL,
or any other HTTP client.

### How do I use the Connect protocol to call existing gRPC servers?

Most Connect implementations support the gRPC protocol, so you have a choice:

- Use the Connect runtime, but configure your client to use the gRPC protocol, or
- Use the Connect runtime and Connect protocol, and have Envoy automatically
  handle the Connect-to-gRPC translation. Envoy is a popular and widely used
  proxy.

Envoy v1.26 ships with a Connect-gRPC bridge that allows clients to speak the
Connect protocol (including GET requests) to existing gRPC servers. You can find
a demo here: https://github.com/connectrpc/envoy-demo

### How do I reliably call a server streaming RPC from a web browser?

The answer is highly dependent on all of the networking parties involved. Generally,
make sure that your server or your infrastructure does not apply timeouts within
the expected duration of calls. If possible, pre-empt timeouts by setting short
deadlines and by repeating the call when the deadline is exceeded. Read the
[streaming docs](go/streaming.md) for the Go implementation to get an idea of
the implications.

### How do I proxy the Connect protocol through NGINX?

Request-response (unary) RPCs made with the Connect protocol don't require
end-to-end HTTP/2, so they can be proxied through NGINX. Streaming RPCs typically
require end-to-end HTTP/2, which NGINX doesn't support. Rather than NGINX, we
recommend using Envoy, Apache, or TCP-level load balancers like HAProxy, all of
which support the full Connect protocol.

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

JavaScript's `Number` is an IEEE 754 double-precision float: even though it
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

- Generics let us generate less code, especially for streaming RPCs &mdash; if
  you're willing to write out some long URLs, it's now just as easy to use
  Connect without `protoc-gen-connect-go`. The generic stream types, like
  `BidirectionalStream`, are much clearer than the equivalent code generation
  templates.
- We don't need to attach any values to the context, because Connect's generic
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

- It keeps the base types lightweight, so _every_ package that works with
  Protobuf messages doesn't drag along an RPC framework.
- It avoids name collisions. Many Protobuf plugins &mdash; including
  `protoc-gen-go-grpc` &mdash; generate code alongside the base types, so the
  package namespace becomes very crowded.
- It keeps the contents of the base types package constant. This isn't critical
  when generating code locally, but it's critical to making [generated SDKs] and
  [remote plugins] work.

### Can connect-go clients be used in browser applications with WASM?

It's technically possible, but please be aware that the WASM in Go is quite new,
and the architecture has some fundamental limitations that may be surprising.
We encourage you to give it a try and report any issues you find to Go or
connect-go to help bring WASM in Go forward.

### Why am I seeing a "stream error: stream ID 5; INTERNAL_ERROR; received from peer" error message after X seconds? {#stream-error}

It means that your [http.Server](https://pkg.go.dev/net/http#Server) has a
`ReadTimeout` or `WriteTimeout` field configured. These fields apply
to the entire operation duration, even for streaming calls. If an operation
takes longer than the value specified, the server closes the stream and
clients can see the above error message. The other timeout fields won't cause
this error, and we
ncourage you to set `ReadHeaderTimeout` in particular.

### How do I close a client response stream in connect-go?

On reading the response, a client calling `CloseResponse` will attempt to
gracefully close the connection. `Close` does this by reading all of the
remaining messages sent from the server until the final status message is
received. If the status is in error, `Close` will return the wire error.
Alternatively, if you wish to cancel the operation and immediately stop
the client stream, see [below](#cancel-stream) to cancel the connection.

### How do I cancel a client response stream in Connect-go?

To cancel and abort a stream, call the cancel function of the underlying
context associated with the stream. This context is provided on stream
creation. On cancel, the stream is aborted and any resources are released along with it.

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
For an ELIZA client, the compressed bundle size is [just around 13KiB](https://github.com/connectrpc/connect-es/tree/main/packages/connect-web-bench).

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
framework also provided by Protobuf-ES. For any questions you may have about this library,
visit the [Protobuf-ES FAQ page](https://github.com/bufbuild/protobuf-es/blob/main/docs/faq.md).

### How do I provide a type registry for sending or receiving Any?

If a RPC in your schema uses `google.protobuf.Any` in a request or response
message, you can provide a type registry so that they can be parsed from or
serialized to JSON. See [this GitHub discussion](https://github.com/connectrpc/connect-es/discussions/689#discussioncomment-6280653)
for a detailed explanation and an example.

## Deployment

### How do I use an interceptor to configure CORS?

Interceptors can't be used to configure CORS. CORS is a security feature of the
browsers and involves `OPTIONS` requests. `OPTIONS` requests can't be matched as RPC
requests, and so interceptors can't be used to configure CORS. It's purely an HTTP
concern. Both [connect-go][cors-go] and [connect-es][cors-es] have
docs that show how to configure CORS for their respective HTTP libraries.

### How does vanguard-go integrate with Connect interceptors?

A [connect-go] handler wrapped with [Vanguard](https://github.com/connectrpc/vanguard-go)
can use connect-go interceptors like
any other connect-go handler, whether the incoming request is REST or one of the
supported protocols. connect-go interceptors cannot be applied to gRPC handlers or
proxy handlers. Use gRPC interceptors or net/http middleware instead.

### Missing trailers with Ambassador

If you're using Ambassador for Kubernetes ingress and seeing "server closed the
stream without sending trailers" errors, you may have overlapping gRPC and HTTP
mappings for your backend services. You can work around this problem using the
`cluster_tag` property, as described in
[emissary-ingress/emissary#3112](https://github.com/emissary-ingress/emissary/issues/3112).

### HTTP 464 error with AWS

If you're using the AWS [Application Load Balancer support for gRPC][alp-aws-grpc],
you will likely see an HTTP error response with code 464 for a Connect `GET`
request, or for a web browser making a CORS preflight `OPTIONS` request. The
reason for this behavior is that target groups with "protocol version" set to
"gRPC" only accept `POST` requests. See the [troubleshooting document][alp-aws-troubleshooting]
for reference.

As a simple solution, you can configure the target group to use "HTTP2" instead.
It will support Connect as well as gRPC - you will only give up support for the
gRPC-specific add-on features.

In case you _do_ need the gRPC-specific add-ons, you can use two target groups:
Route HTTP GET requests and anything with the `application/proto`, `application/json`,
`application/connect+proto`, or `application/connect+json` Content-Types to the
HTTP2 target group. Route anything else to the gRPC target group.

[cors-es]: https://connectrpc.com/docs/node/server-plugins/#cors
[cors-go]: https://connectrpc.com/docs/go/deployment#cors
[generated SDKs]: https://buf.build/docs/bsr/generated-sdks/overview/
[main-repo]: https://github.com/connectrpc?view_as=public
[remote plugins]: https://buf.build/docs/bsr/remote-plugins/overview/
[twirp-protocol]: https://github.com/twitchtv/twirp/blob/main/PROTOCOL.md
[whatwg-streams-issue]: https://github.com/whatwg/fetch/issues/1438
[alp-aws-grpc]: https://aws.amazon.com/blogs/aws/new-application-load-balancer-support-for-end-to-end-http-2-and-grpc/
[alp-aws-troubleshooting]: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html#http-464-issues
