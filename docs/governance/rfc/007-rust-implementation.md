# 007: Rust Implementation

This RFC proposes an official Rust implementation of Connect, covering both
client and server, with all three supported protocols (Connect, gRPC, gRPC-Web),
and all four RPC types. Unlike most implementation RFCs, this proposal is
backed by a working implementation that already passes the full conformance
suite; the RFC seeks adoption of that codebase as `connectrpc.com/connect-rust`.

The implementation can be found at https://github.com/anthropics/connect-rust.
The implementation also utilizes a new, from-scratch implementation of protobuf
for Rust, called [buffa] - this implementation is pure Rust, and leverages
Rust's strengths to offer zero-copy views and other features to achieve high
performance and strict type safety.

## Why

Rust is increasingly used for network services, data infrastructure, and
performance-critical backends. It has a mature HTTP stack ([hyper], [h2]) and a
de-facto standard service abstraction ([Tower]) that powers Axum, Linkerd,
Vector, and many others — yet there is no Connect implementation in the
ecosystem.

The only widely-used RPC option in Rust today is [tonic], a gRPC-only
implementation. Teams that adopt Connect elsewhere in their stack must either
fall back to gRPC for Rust services (losing Connect's HTTP/1.1 compatibility,
JSON support, and simpler unary framing) or maintain a bespoke integration.

Unlike Python (RFC 005) and Dart (RFC 004), Rust's HTTP ecosystem is a good
fit for full-fidelity Connect *and* gRPC: hyper exposes the low-level HTTP/2
control (trailers, half-close, bidirectional streams) that a correct gRPC
implementation needs, and Tower's middleware model maps naturally to
interceptors. There is no reason a Rust implementation should settle for a
feature subset — the scope proposed here is parity with connect-go.

## Goals

Fully pass the conformance suite for both client and server, with the
following configuration (already achieved by the reference implementation):

```yaml
features:
  versions:
    - HTTP_VERSION_1
    - HTTP_VERSION_2
  protocols:
    - PROTOCOL_CONNECT
    - PROTOCOL_GRPC
    - PROTOCOL_GRPC_WEB
  codecs:
    - CODEC_PROTO
    - CODEC_JSON
  compressions:
    - COMPRESSION_IDENTITY
    - COMPRESSION_GZIP
    - COMPRESSION_ZSTD
  stream_types:
    - STREAM_TYPE_UNARY
    - STREAM_TYPE_CLIENT_STREAM
    - STREAM_TYPE_SERVER_STREAM
    - STREAM_TYPE_HALF_DUPLEX_BIDI_STREAM
    - STREAM_TYPE_FULL_DUPLEX_BIDI_STREAM
  supports_h2c: true
  supports_tls: true
  supports_tls_client_certs: true
  supports_trailers: true
  supports_connect_get: true
  supports_message_receive_limit: true
  supports_half_duplex_bidi_over_http1: true
```

Current conformance counts against [connectconformance v1.0.5][conformance-v105],
with reference implementation v0.2.1:

| Suite | Tests | Pass rate |
|---|---:|---:|
| Server (default, all protocols) | 3600 | 100% |
| Server Connect+TLS (incl. mTLS) | 2396 | 100% |
| Client Connect | 2580 | 100% |
| Client gRPC | 1454 | 100% |
| Client gRPC-Web | 2838 | 100% |

### Non-goals

- **HTTP/3** — blocked on hyper support ([hyperium/hyper#1818]); revisit when
  the ecosystem stabilizes.
- **gRPC server reflection** — useful but orthogonal to the core RPC
  implementation; can ship as an ancillary crate later.
- **Runtime-agnostic async** — the implementation targets Tokio. See
  *Anticipated complications* for why this trade-off is reasonable.

### MSRV policy

The crates use Rust edition 2024 and target **latest stable Rust** at the time
of each release. We do not commit to an N-minus policy for 0.x releases, but
will adopt one (likely N-2, with an explicit `rust-version` in `Cargo.toml` and
CI enforcement) at 1.0.

## Anticipated complications

### Protobuf library choice

Rust has no single dominant protobuf library. [prost] is the most widely used
(and what tonic generates against); [protobuf-rust-v3] is EOL — its `protobuf`
crate name has passed to Google's official [protobuf-rust-v4], which is
currently in beta. The google implementation wraps a C kernel ([upb]) and
requires both a C toolchain at build time and a protoc binary whose version
exactly matches the crate's.

The reference implementation is built on [buffa], a new protobuf implementation
with zero-copy view types — string and bytes fields borrow directly from the
request buffer, map fields are flat vecs rather than `HashMap`s. Benchmarks
against tonic (same hyper/h2 stack, same workload) show this is where most of
the performance advantage comes from: ~33% faster on decode-heavy workloads
with many strings, and ~3× lower allocator pressure.

This coupling to a specific proto library is the single largest adoption risk.
Two mitigations:

1. The runtime's dependency on buffa is narrow (encode/decode trait bounds);
   a prost or protobuf-rust-v4 adapter crate is feasible if ecosystem pressure
   demands it.
2. buffa is itself Apache-2.0 licensed, published on crates.io, and has
   editions support — there is no licensing or availability obstacle.

We propose shipping with buffa as the default and documenting the trait
boundary that a prost adapter would need to satisfy.

### Async runtime

The Rust async ecosystem is split between Tokio — the dominant runtime in
production use and what hyper, tonic, and Axum all target — and smaller
runtimes (smol, async-std, Glommio). Writing truly runtime-agnostic async Rust
requires significant API compromises and tends to produce worse ergonomics for
the majority Tokio case.

Following tonic's precedent, the implementation targets Tokio directly. Hyper
itself is runtime-agnostic, so a sufficiently motivated user can wire the core
`tower::Service` to a different runtime — but the batteries-included server and
client transports assume Tokio.

### Framework integration vs. standalone server

Rust web frameworks (Axum, Actix, Warp) each have their own router and
middleware abstractions. Rather than pick a winner, the server is a
`tower::Service<http::Request, Response = http::Response>` that plugs into any
Tower-compatible framework as a fallback route. A thin Axum integration helper
and a standalone hyper server are provided as optional features.

## General design

### Crate layout

| Crate | Purpose |
|---|---|
| `connectrpc` | Runtime library (client, server, protocol handling) |
| `connectrpc-codegen` | Descriptor → Rust source library, protoc plugin binary |
| `connectrpc-build` | `build.rs` integration |

Two code generation paths are offered, matching the patterns established by
tonic/prost:

- **Pre-build** via the protoc plugin (`protoc-gen-connect-rust`), typically
  driven by `buf generate` or other harnesses around `protoc`. Generated code
  is checked in, or produced by an external build step to an ignored directory.
- **Build-time** via `connectrpc-build` in `build.rs`, writing to `OUT_DIR`
  and consumed via `include!`.

Buffa provides a utility plugin to generate `mod.rs` files for generated
protobuf messages and service stubs. The plugin structure is also intended to
support Buf Schema Registry SDK generation, though this is currently unverified.

### Server

The core server type is `ConnectRpcService<D>`, a `tower::Service` that
performs content-negotiation (protocol, codec, compression) and dispatches to a
`Dispatcher`. Two dispatcher implementations ship:

- A generated **monomorphic dispatcher** per service: `FooServiceServer<T>`
  with compile-time `match` on method name. No vtables, no `Arc<dyn Handler>`.
  This is the recommended path and is what drives the performance numbers.
- A dynamic **`Router`** with runtime handler registration, for multi-service
  binaries or cases that need runtime flexibility (e.g., reflection).

A standalone hyper server with TLS (rustls) and graceful shutdown is provided
behind a feature flag.

### Client

Generated clients are thin wrappers over a `ClientTransport` trait. Two
transports ship:

- `HttpClient` — pooled hyper client, HTTP/1.1 + HTTP/2 via ALPN. The default
  choice for Connect and gRPC-Web.
- `Http2Connection` — single raw h2 connection with honest `poll_ready`
  backpressure. Composes with `tower::balance` for N-connection load spreading;
  the recommended choice for gRPC and Connect at high throughput.

Both transports have explicit plaintext-vs-TLS constructors (no bare
`::new()`); TLS accepts `Arc<rustls::ClientConfig>` to preserve users' cert
rotation setups.

### High- and low-level client APIs

Generated clients emit dual methods per RPC:

```rust
// High-level: uses ClientConfig defaults (timeout, headers, etc.)
async fn greet(&self, req: GreetRequest) -> Result<GreetResponse, ConnectError>;

// Low-level: per-call CallOptions (timeout, headers, max size, compression)
async fn greet_with_options(&self, req: GreetRequest, opts: CallOptions)
    -> Result<GreetResponse, ConnectError>;
```

For streaming RPCs, the low-level return types expose response headers,
trailers, and per-message iteration via `ServerStream<T>` / `BidiStream<T>`.

### Feature flags

Compression codecs (`gzip`, `zstd`), framework integrations (`axum`), and
transports (`client`, `server`, `client-tls`, `server-tls`) are all
feature-gated so the default dependency footprint is small.

## Alternatives

- **Contribute a Connect mode to tonic**: tonic's internals are tightly
  coupled to gRPC framing (envelope headers, trailers-in-h2-frames). Adding
  Connect's unary path — plain HTTP body, error as JSON body, no envelope —
  would require forking most of its codec and transport layers. A standalone
  implementation is simpler and does not constrain tonic's roadmap.
- **Generate a prost-backed implementation**: feasible, but loses the
  zero-copy decode advantage that is this implementation's main performance
  differentiator, and loses buffa's full conformance against the protobuf
  conformance suite. This is better offered as an optional adapter or fork of
  the implementation.
- **Do nothing**: Rust services continue to use gRPC-only or hand-rolled
  HTTP+JSON for Connect interop. The ecosystem gap persists.

## Maintainers

The project will be maintained by:

- [Iain McGinniss](https://github.com/iainmcgin), [Anthropic](https://anthropic.com)
- [Drew Sacamano](https://github.com/asacamano), [Anthropic](https://anthropic.com)

Additional maintainers welcome; we expect the project to follow Connect's
standard governance model once adopted.

## References

- Reference implementation: [anthropics/connect-rust](https://github.com/anthropics/connect-rust)
- Conformance suite: [connectrpc/conformance](https://github.com/connectrpc/conformance)
- [tonic](https://github.com/hyperium/tonic) — the existing Rust gRPC implementation
- [Tower](https://docs.rs/tower/) — the service abstraction this implementation is built on

[hyper]: https://hyper.rs
[h2]: https://docs.rs/h2
[Tower]: https://docs.rs/tower
[tonic]: https://github.com/hyperium/tonic
[prost]: https://github.com/tokio-rs/prost
[protobuf-rust-v3]: https://github.com/stepancheg/rust-protobuf
[protobuf-rust-v4]: https://github.com/protocolbuffers/protobuf/tree/main/rust
[upb]: https://github.com/protocolbuffers/protobuf/tree/main/upb
[buffa]: https://github.com/anthropics/buffa
[conformance-v105]: https://github.com/connectrpc/conformance/releases/tag/v1.0.5
[hyperium/hyper#1818]: https://github.com/hyperium/hyper/issues/1818
