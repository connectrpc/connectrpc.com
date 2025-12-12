---
title: Serialization & compression
sidebar_position: 10
---

Connect can work with any schema definition language, but it comes with
built-in support for Protocol Buffers. Because the Protocol Buffer
specification includes [mappings to and from JSON][protojson], any Connect API
defined with a Protobuf schema also supports JSON. This is especially
convenient for web browsers and ad-hoc debugging with cURL.

Connect handlers automatically accept JSON-encoded requests &mdash; there's no
special configuration required. Connect clients default to using binary
Protobuf. To configure your client to use JSON instead, pass
`proto_json=True` during client construction.

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
library's `compress/gzip` at the default compression level. Connect clients
default to sending uncompressed requests and asking for gzipped responses. If
you know that the server supports gzip, you can also compress requests by passing
`send_compression="gzip"` during client construction.

It's worth noting that clients using the Connect protocol for unary
RPCs ask for compressed responses using the `Accept-Encoding` HTTP header. This
matches standard HTTP semantics, so browsers can easily make efficient Connect
RPCs: they automatically ask for compressed responses, and the network
inspector tab automatically decompresses the data if necessary. Connect's
`Accept-Encoding` support also works well with cURL's `--compressed` flag.

[protojson]: https://developers.google.com/protocol-buffers/docs/proto3#json
[iana-compression]: https://www.iana.org/assignments/http-parameters/http-parameters.xml#content-coding
