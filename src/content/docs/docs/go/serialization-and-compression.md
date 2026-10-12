---
title: Serialization & compression
---

Connect can work with any schema definition language, but it comes with
built-in support for Protocol Buffers. Because the Protocol Buffer
specification includes [mappings to and from JSON][protojson], any Connect API
defined with a Protobuf schema also supports JSON. This is especially
convenient for web browsers and ad-hoc debugging with cURL.

Connect handlers automatically accept JSON-encoded requests &mdash; there's no
special configuration required. Connect clients default to using binary
Protobuf. To configure your client to use JSON instead, use the
`connecthttp.WithProtoJSON()` option during transport construction.

## Replacing standard Protobuf

By default, Connect uses `google.golang.org/protobuf` to serialize and
deserialize Protobuf messages. The built-in binary and JSON codecs live in the
`connectproto` package, and `connecthttp` installs them by default. To use a
different Protobuf runtime, implement the `Codec` interface using the
`"proto"` name. Then pass your implementation to your transports and servers
using the `connecthttp.WithCodecs` option, which registers a codec by its
`Name()` and replaces any default with the same name. Connect will use
your custom codec to marshal and unmarshal a variety of unexported,
protocol-specific messages, so take care to fall back to the standard Protobuf
runtime if necessary.

## Custom serialization

To support a completely different serialization mechanism, you'll first need
to implement `Codec`. The interface is stream-oriented and context-aware:
`MarshalWrite` encodes a message to an `io.Writer`, and `UnmarshalRead`
decodes one from an `io.Reader`. To support [HTTP GET
requests](/docs/go/get-requests-and-caching/), also implement `StableCodec`,
which adds a deterministic `MarshalWriteStable` encoding. If your new
serialization mechanism uses a schema, you'll
also need to write a binary to generate RPC code from the schema. Typically,
this binary is a plugin for the appropriate compiler (for example,
`thriftrw-go` for Thrift). This isn't as complex as it may sound! Connect
doesn't require much generated code.

## Compression

Connect clients and handlers support compression. Usually, compression is
helpful &mdash; the small increase in CPU usage is more than offset by the
reduction in network I/O.

In particular, Connect encourages _asymmetric_ compression: clients can send
uncompressed requests while asking for compressed responses. Because responses
are usually larger than requests, this approach compresses most of the data on
the network without requiring the client to make any assumptions about the
server.

By default, Connect handlers support gzip compression using the standard
library's `compress/gzip` at the default compression level. The gzip
implementation lives in the `connectgzip` package, and `connecthttp` installs
it by default. Connect clients
default to sending uncompressed requests and asking for gzipped responses. If
you know that the server supports gzip, you can also compress requests by using
the `connecthttp.WithSendGzip` option during transport construction.

Like most compression schemes, gzip _increases_ the size of very small
messages. By default, Connect handlers (and clients using `WithSendGzip`)
compress messages without considering their size. To only compress messages
larger than some threshold, use `connecthttp.WithCompressMinBytes` during
transport and server construction. In most cases, this improves overall
performance.

Finally, it's worth noting that clients using the Connect protocol for unary
RPCs ask for compressed responses using the `Accept-Encoding` HTTP header. This
matches standard HTTP semantics, so browsers can easily make efficient Connect
RPCs: they automatically ask for compressed responses, and the network
inspector tab automatically decompresses the data if necessary. Connect's
`Accept-Encoding` support also works well with cURL's `--compressed` flag.

## Custom compression

In Go, Connect comes with gzip support because it's widely used and included in
the standard library. To support newer compression algorithms, like Brotli or
Zstandard, first implement the `Compressor` interface. It acts as a factory:
`Name()` returns the registration name, `Compress` returns a writer that
compresses to an `io.Writer`, and `Decompress` returns a reader for the
decompressed form of an `io.Reader`.
Configure your servers and transports with `connecthttp.WithCompressors`.
Where appropriate, take care to use the [IANA name for
your compression algorithm][iana-compression] (for example, `br` for Brotli and
`zstd` for Zstandard). To have your client also send compressed requests, use
`connecthttp.WithSendCompression`.

[protojson]: https://developers.google.com/protocol-buffers/docs/proto3#json
[iana-compression]: https://www.iana.org/assignments/http-parameters/http-parameters.xml#content-coding
