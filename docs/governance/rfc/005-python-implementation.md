# 005: Python Implementation

The RFC proposes an official Python implementation of Connect.
This should include both the client and server side.

## Why

Python is a major language used heavily in web development.
Adding an official implementation will help the Connect community focus its efforts.

## Anticipated Complications


The Python ecosystem has a big split between asynchronous and synchronous I/O, which will complicate the implementation story.
Supporting both is important; Python applications tend to commit to one of the two sides of the split and have difficulty using the other.

Further complicating matters is the Python community is divided regarding the right asynchronous implementation.
[asyncio](https://docs.python.org/3/library/asyncio.html) is the standard library's answer, but you can find adherents of [trio](https://trio.readthedocs.io/en/stable/) and other asynchronous event loops.

Python's immature support for http/2 is also a major challenge, particularly for servers.

## Non-goals

In order to make incremental progress, we explicitly cross off certain features in the initial pass at a Python implementation:

1. *No cross-protocol support*: this will only be a client and server of the Connect protocol, not gRPC or grpc-web.
2. *No full-duplex streams*: http/2 transport is hard to support on both client and server; half-duplex is fine though

### Justification for not supporting gRPC on the server

gRPC is a poor match to Python's most commonly used asynchronous server framework, ASGI.
A correct gRPC implementation requires control over very low-level details of the connection state and http/2 transport.
These details are not exposed by ASGI, so supporting them would prevent this library's servers from being ASGI applications.

That's an unacceptable trade-off to make because ASGI interoperability is important for integrating connect servers into larger applications, like those running on Django, Starlette or FastAPI.

### Justification for not supporting gRPC on the client

Implementing a correct gRPC client again requires low-level control over the transport stack.
The connect client would need to accept an extremely low-level and generic transport, even when contacting connect servers, just to support gRPC.

This is more acceptable than the server case, but still unpleasant.
Users will expect that they can pass an httpx.Client or similar to configure instrumentation, authentication, and so on.
If we use a low-level library like hyper-h2 to implement the client, we'd likely need to build a bespoke abstraction supporting features like authentication which would be quite a bit more scope to cover.

### Justification for not support grpc-web

The grpc-web project lacks a standalone specification.
It is defined [only in relation to gRPC](https://github.com/grpc/grpc/blob/6c7e2a94f99747950397258a8de005a3d90210a1/doc/PROTOCOL-WEB.md).

As a result, most Connect implementations of grpc-web do so by treating it as a special case of gRPC.
But without a gRPC implementation to base off of, a Python Connect library would need to implement grpc-web "from scratch" which is much more complex.

The benefits of doing this are outweighed by its complexity for now.
grpc-web users choose it because it is compatible with browsers, but so is Connect.
grpc-web could be a useful later addition to the features provided by a Python implementation, but it need not be in the initial implementation.

### Justification for only supporting half-duplex streams

This is related to the previous justifications on gRPC: http/2 is poorly supported in Python today.

## Goals

Fully pass conformance tests, with the following configuration:
```
features:
  versions:
    - HTTP_VERSION_1
  protocols:
    - PROTOCOL_CONNECT
  codecs:
    - CODEC_PROTO
    - CODEC_JSON
  compressions:
    - COMPRESSION_IDENTITY
    - COMPRESSION_GZIP
    - COMPRESSION_BR
    - COMPRESSION_ZSTD
  stream_types:
    - STREAM_TYPE_UNARY
    - STREAM_TYPE_CLIENT_STREAM
    - STREAM_TYPE_SERVER_STREAM
    - STREAM_TYPE_HALF_DUPLEX_BIDI_STREAM
  supports_half_duplex_bidi_over_http1: true
  supports_h2c: false
```

## General design

Most of the code for both servers and clients will be in a runtime library, installable with `pip install connectrpc`.

A code generator, written in Python and installable with `pip install connectrpc[compiler]`, will be available to generate a few functions:

1. Synchronous and asynchronous client constructors
2. Synchronous and asynchronous `typing.Protocol` that defines the method set that server implementations must follow
3. Synchronous server constructor that produces a WSGI application given an implementation
4. Asynchronous server constructor that produces an ASGI application given an implementation

### Full type hinting, checked by mypy

We will make sure the runtime, and all generated code, pass mypy type checks in strict mode.

### Opt-in compression

Compression codecs that are not in the Python standard library (Brotli and zstd) should be supported if their associated libraries are present, but those libraries should not be direct dependencies.

### High- and low-level client APIs

Connect clients are able to send arbitrary headers, and inspect headers sent by servers.
In certain circumstances, they can also inspect or send trailers.
Full support of this is enforced by the conformance test suite.

But these advanced features can cloud the API for typical usage.
Headers and trailers are unused in the majority of RPC usage; the RPC's message types typically encode all the relevant information.

So, we will provide clients with both high-level simple methods which operate directly on the request and response types, and also low-level methods that wrap request and response types in classes that permit handling of headers and trailers.

The low-level RPCs will be named `call_<rpc>`. For example, `call_converse` or `call_say` for an `rpc Converse` or `rpc Say`.
The high-level RPCs will be simply named `<rpc>`. For example, `converse` or `say`.

To make this more concrete, here is a portion of the proposed method set of the synchronous Eliza client:
```python
class ElizaServiceClient:
	def say(self, req: SayRequest) -> SayResponse:
		...
	
	def call_say(self, req: SayRequest, extra_headers: MultiDict[str, str], timeout_seconds: float) -> UnaryOutput[SayResponse]:
		...
		
	def converse(self, reqs: Iterable[ConverseRequest]) -> Iterator[ConverseResponse]:
		...
		
	def call_converse(self, reqs: Iterable[ConverseRequest], extra_headers: MultiDict[str, str], timeout_seconds: float) -> StreamOutput[ConverseResponse]:
		...
```

The `UnaryOutput` and `StreamOutput` generic wrapper types provide access to response headers, trailers, and Connect protocol errors, as well as the wrapped message.

Analagous methods would be available on the asynchronous client.

## Maintainers

The project can be maintained by:

- [Spencer Nelson](https://github.com/spenczar), [Firetiger](https://firetiger.com)
- [Peter Edge](https://github.com/bufdev), [Buf](https://buf.build)
