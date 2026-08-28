---
title: "008: Use server preference for compression priority"
---

This RFC proposes amending the Connect protocol to have servers define the
preference for a compression algorithm among the supported set as opposed to
the client. This allows improving compression in scenarios where the client's
ordering cannot be changed, like the browser, and aligns with the commonly
accepted behavior of servers like Envoy and NGINX.

The proposed diff to the protocol specification is in [PR 322][pr322]. This
document focuses on the rationale for the change and the anticipated end user
impact.

## Server preference for compression

The compression algorithm to use for a request is determined by two factors

- The compression methods supported by a server, configured by the user
- The list of compressions in the client's `Accept-Encoding` header, e.g., `gzip, br, zstd`

Currently, it is the order in the `Accept-Encoding` header that determines which
algorithm to prefer, i.e., if all methods are supported by the server, `gzip` is always
used for the above header.

We propose changing so servers are configured with an ordered list of compression methods,
and the first matching method present in the `Accept-Encoding` header is selected.
For the above header, if the server is configured with `gzip, br, zstd`, `gzip` is selected;
if it is configured with `br, zstd, gzip`, `br` is selected.

Because common browsers always send `gzip, deflate, br, zstd`, it is currently impossible for
connect-web users to use the more modern and efficient `br` and `zstd` algorithms.
Moving preference to the server will allow preferring the more efficient algorithms, finally
unlocking them for connect-web. Servers like Envoy and NGINX behave in the same way for the
same reason.

While `br` and `zstd` have come a long way and commonly have similar CPU and RAM usage to
`gzip` now, it can't be confirmed all workloads will see no regression from a change from
`gzip` to e.g., `br`. In an abundance of caution, this RFC is considered a semver breaking
change. It is planned to be introduced to Connect-Go in v2, Connect-Py before v1, and Connect-ES
in v3.

[pr322]: https://github.com/connectrpc/connectrpc.com/pull/322
