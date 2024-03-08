# 003: Amend Connect HTTP codes

This RFC proposes amending the Connect protocol to translate back and forth
between RPC error codes and HTTP codes more correctly. This fixes some
transport-level bugs and improves interoperability with gRPC, but does change
how Connect clients interpret malformed responses.

The proposed diff to the protocol specification is in [PR 130][pr130]. This
document focuses on the rationale for the change and the anticipated end user
impact.

## RPC &rarr; HTTP mappings

We propose changing the mappings from RPC error codes to HTTP codes for two
reasons:

* In two cases, Connect's current use of HTTP 408 codes is categorically
  incorrect - it indicates that the client may retry the request. Using this
  code for non-idempotent RPCs is a potentially severe bug.
* In an additional two cases, the current protocol diverges from the mappings
  suggested in [`code.proto`][code.proto]. The `code.proto` mapping isn't used
  by gRPC, but it _is_ used by the Google Cloud Platform front-ends,
  gRPC-Gateway, Envoy, and a variety of other projects in the Protobuf
  ecosystem.

Most Connect users won't notice these changes, since clients read explicit RPC
error codes from the response body. Servers will stop encouraging clients and
proxies to auto-retry, which fixes a severe bug. Since it changes the wire
representation of errors, this portion of the proposal will visibly affect any
HTTP-level observability that users have in place today.

## HTTP &rarr; RPC mappings

We propose removing some of the mappings from HTTP codes to RPC codes, so that
Connect's mapping becomes _identical_ to gRPC's. This helps to deliver on
Connect's promise that users can switch RPC protocols without code changes.

Again, most Connect users won't notice these changes, because clients read RPC
error codes from the response body. However, this will change clients'
interpretation of malformed responses (usually coming from a misbehaving
proxy).

[code.proto]: https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto
[pr130]: https://github.com/connectrpc/connectrpc.com/pull/130
