---
title: Godoc
---

Connect's Go API is extensively documented &mdash; see [pkg.go.dev][godoc] for more details.

The `connectrpc.com/connect/v2` module is split into a small set of packages:

- [connectrpc.com/connect/v2][godoc] &mdash; the runtime core, imported by generated code
- [connectrpc.com/connect/v2/connecthttp][godoc-connecthttp] &mdash; the `net/http` transport and server bindings
- [connectrpc.com/connect/v2/connectproto][godoc-connectproto] &mdash; the Protobuf binary and JSON codecs and error-detail helpers
- [connectrpc.com/connect/v2/connectgzip][godoc-connectgzip] &mdash; the gzip compressor
- [connectrpc.com/connect/v2/connectinprocess][godoc-connectinprocess] &mdash; the in-process transport

[godoc]: https://pkg.go.dev/connectrpc.com/connect/v2
[godoc-connecthttp]: https://pkg.go.dev/connectrpc.com/connect/v2/connecthttp
[godoc-connectproto]: https://pkg.go.dev/connectrpc.com/connect/v2/connectproto
[godoc-connectgzip]: https://pkg.go.dev/connectrpc.com/connect/v2/connectgzip
[godoc-connectinprocess]: https://pkg.go.dev/connectrpc.com/connect/v2/connectinprocess
