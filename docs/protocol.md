---
title: Connect Protocol Reference
sidebar_label: Connect Protocol
sidebar_position: 990
---

This document specifies the Connect protocol for making RPCs over HTTP. The
protocol does _not_ depend on framing details specific to a particular HTTP
version.

Rules use [ABNF syntax](https://datatracker.ietf.org/doc/html/rfc5234.html),
but the design goals and summary are approachable for casual readers. There
are also examples of [unary](#unary-examples) and [streaming](#streaming-examples)
RPCs.

## Design Goals

This protocol aims to:

* Be human-readable and debuggable with general-purpose HTTP tools, especially
  for unary RPCs.
* Remain conceptually close to [gRPC's HTTP/2 protocol][], so Connect
  implementations can support both protocols.
* Depend only on widely-implemented HTTP features and specify behavior in terms
  of [high-level semantics][rfc-http-semantics], so that Connect
  implementations can easily use off-the-shelf networking libraries.

## Summary

When used with Protocol Buffer schemas, the Connect protocol supports unary,
client streaming, server streaming, and bidirectional streaming RPCs, with
either binary Protobuf or JSON payloads. Bidirectional streaming requires
HTTP/2, but the other RPC types also support HTTP/1.1. The protocol doesn't use
HTTP trailers at all, so it works with any networking infrastructure.

Unary RPCs use the `application/proto` and `application/json` Content-Types and
look similar to a stripped-down REST dialect. Most requests are POSTs, paths are
derived from the Protobuf schema, request and response bodies are valid
Protobuf or JSON (without gRPC-style binary framing), and responses have
meaningful HTTP status codes. For example:

```
> POST /connectrpc.greet.v1.GreetService/Greet HTTP/1.1
> Host: demo.connectrpc.com
> Content-Type: application/json
>
> {"name": "Buf"}

< HTTP/1.1 200 OK
< Content-Type: application/json
<
< {"greeting": "Hello, Buf!"}
```

For RPCs that have no side effects, it is possible to use GET requests instead:

```
> GET /connectrpc.greet.v1.GreetService/Greet?encoding=json&message=%7B%22name%22%3A%22Buf%22%7D HTTP/1.1
> Host: demo.connectrpc.com

< HTTP/1.1 200 OK
< Content-Type: application/json
<
< {"greeting": "Hello, Buf!"}
```

A request is considered to have no side effects if the associated RPC is
annotated as such with the `IdempotencyLevel` option:

```protobuf
service ElizaService {
  rpc Say(stream SayRequest) returns (SayResponse) {
    option idempotency_level = NO_SIDE_EFFECTS;
  }
}
```

The unary ABNF rules describe how metadata (like timeouts and
compression schemes) are encoded into HTTP headers and explain the details of
the error model. The [examples below](#unary-examples) also show a wider
variety of scenarios.

Streaming RPCs are naturally a bit more complex: they use the
`application/connect+proto` and `application/connect+json` Content-Types and
look similar to gRPC-Web. Requests are still POSTs and paths are still derived
from the Protobuf schema, but each request and response message is wrapped in a
few bytes of binary framing data. Responses always have an HTTP status of 200
OK, with any errors sent in the last portion of the body. For example, a client
streaming call might look like this:

```
> POST /connectrpc.greet.v1.GreetService/GreetGroup HTTP/1.1
> Host: demo.connectrpc.com
> Content-Type: application/connect+json
>
> <binary framing: standard message>{"name": "Buf"}
> <binary framing: standard message>{"name": "Connect"}

< HTTP/1.1 200 OK
< Content-Type: application/connect+json
<
< <binary framing: standard message>{"greeting": "Hello, Buf and Connect!"}
< <binary framing: error and trailers>{}
```

Again, the ABNF rules describe the streaming HTTP headers, error model, and
framing data. The [examples below](#streaming-examples) show both successes and
errors.

## Outline

* **Request** &rarr; Unary-Request / Unary-Get-Request / Streaming-Request
* **[Unary-Request](#unary-request)** &rarr; Unary-Request-Headers Bare-Message
* **[Unary-Get-Request](#unary-get-request)** &rarr; Unary-Get-Request-Headers
* **[Streaming-Request](#streaming-request)** &rarr; Streaming-Request-Headers \*Enveloped-Message

Clients send HTTP requests to servers. Unary requests contain exactly one
message, while streaming requests contain zero or more messages.

* **Response** &rarr; Unary-Response / Streaming-Response
* **[Unary-Response](#unary-response)** &rarr; Unary-Response-Headers Bare-Message
* **[Streaming-Response](#streaming-response)** &rarr; Streaming-Response-Headers 1\*Enveloped-Message

Servers return HTTP responses to clients. Unary responses contain exactly one
message, while streaming responses contain one or more messages.

The rules in this document use HTTP/2-style notation (for example, ":method
POST" and ":path /foo/bar" instead of "POST /foo/bar HTTP/1.1"). On the wire,
Connect implementations must represent these semantics appropriately for the
HTTP version in use.

## Unary (Request-Response) RPCs

Most RPCs are unary (or request-response). Structurally, unary RPC is similar
to the resource-oriented model of the web. The Connect protocol takes special
care to make unary RPCs easy to work with using web browsers, cURL, and other
general-purpose HTTP tools.

### Unary-Request

* **Unary-Request** &rarr; Unary-Request-Headers Bare-Message
* **Unary-Request-Headers** &rarr; Unary-Call-Specification \*Leading-Metadata
* **Unary-Call-Specification** &rarr; Method-Post Path Unary-Content-Type \[Connect-Protocol-Version\] \[Timeout\] \[Content-Encoding\] \[Accept-Encoding\]
* **Method-Post** &rarr; ":method POST"
* **Path** &rarr; ":path" "/" [Routing-Prefix "/"] Procedure-Name ; case-sensitive
* **Routing-Prefix** &rarr; \{_arbitrary prefix_\}
* **Procedure-Name** &rarr; \{_IDL-specific service &amp; method name_\} ; see [Protocol Buffers](#protobuf)
* **Message-Codec** &rarr; ("proto" / "json" / \{_custom_\})
* **Unary-Content-Type** &rarr; "content-type" "application/" Message-Codec
* **Connect-Protocol-Version** &rarr; "connect-protocol-version" "1"
* **Timeout** &rarr; "connect-timeout-ms" Timeout-Milliseconds
* **Timeout-Milliseconds** &rarr; \{_positive integer as ASCII string of at most 10 digits_\}
* **Content-Encoding** &rarr; "content-encoding" Content-Coding
* **Content-Coding** &rarr; "identity" / "gzip" / "br" / "zstd" / \{_custom_\}
* **Accept-Encoding** &rarr; "accept-encoding" Content-Coding \*("," [" "] Content-Coding) ; subset of HTTP quality value syntax
* **Leading-Metadata** &rarr; Custom-Metadata
* **Custom-Metadata** &rarr; ASCII-Metadata / Binary-Metadata
* **ASCII-Metadata** &rarr; Header-Name ASCII-Value
* **Binary-Metadata** &rarr; \{Header-Name "-bin"\} \{base64-encoded value\}
* **Header-Name** &rarr; 1\*( %x30-39 / %x61-7A / "\_" / "-" / ".") ; 0-9 a-z \_ - .
* **ASCII-Value** &rarr; 1\*( %x20-%x7E ) ; space &amp; printable ASCII
* **Bare-Message** &rarr; *\{binary octet\}

**Unary-Request-Headers** are sent as &mdash; and have the same semantics as
&mdash; HTTP headers. Servers may respond with an error if the client sends too
many headers.

If the server doesn't support the specified **Message-Codec**, it must respond
with an HTTP status code of 415 Unsupported Media Type.

The **Connect-Protocol-Version** header distinguishes unary Connect RPC traffic
from other requests that may use the same Content-Type. (In the future, it may
also be used to support revisions to this protocol.) Clients, especially
generated clients, should send this header. Servers and proxies may reject
traffic without this header with an HTTP status code of 400.

Following standard HTTP semantics, servers must assume "identity" if the client
omits **Content-Encoding**.

If the client omits **Accept-Encoding**, servers must assume that the client
accepts the **Content-Encoding** used for the request if present. Servers must
assume that all clients accept "identity" as their least preferred encoding,
even when **Accept-Encoding** is omitted. Servers should treat **Accept-Encoding**
as an ordered list, with the client's most preferred encoding first and least
preferred encoding last. This is a simplification fo standard HTTP semantics
that excludes quality values. If the client uses an unsupported **Content-Encoding**,
servers should return an error with code "unimplemented" and a message listing the
supported encodings.

If **Timeout** is omitted, the server should assume an infinite timeout. The
protocol accommodates timeouts of more than 100 days. Client implementations
may set a default timeout for all RPCs, and server implementations may clamp
timeouts to an appropriate maximum.

HTTP doesn't allow header values to be arbitrary binary blobs, so Connect
differentiates between **ASCII-Metadata** and **Binary-Metadata**. Binary
headers must use keys ending in "-bin", and implementations should emit
unpadded base64-encoded values. Implementations must accept both padded and
unpadded values. Because binary and non-ASCII headers are relatively uncommon,
implementations may represent HTTP headers using an off-the-shelf type rather
than reifying these rules in a custom type. Implementations using an
off-the-shelf type should prominently document these rules. For both ASCII and
binary metadata, keys beginning with "connect-" are reserved for use by the
Connect protocol.

**Bare-Message** is the RPC request payload, serialized using the codec
indicated by **Unary-Content-Type** and possibly compressed using
**Content-Encoding**. It's sent on the wire as the HTTP request content (often
called the body). Servers must not attempt to decompress zero-length HTTP request 
content.

### Unary-Get-Request

* **Unary-Get-Request** &rarr; Unary-Get-Request-Headers
* **Unary-Get-Request-Headers** &rarr; Unary-Get-Call-Specification \*Leading-Metadata
* **Unary-Get-Call-Specification** &rarr; Method-Get Path "?" Query-Get \[Timeout\] \[Accept-Encoding\]
* **Method-Get** &rarr; ":method GET"
* **Query-Get** &rarr; Message-Query Encoding-Query \[Base64-Query\] \[Compression-Query\] \[Connect-Version-Query\]
* **Message-Query** &rarr; "message=" (*\{percent-encoded octet\})
* **Base64-Query** &rarr; "&base64=1"
* **Encoding-Query** &rarr; "&encoding=" Message-Codec
* **Compression-Query** &rarr; "&compression=" Content-Coding
* **Connect-Version-Query** &rarr; "&connect=v1"

**Unary-Get-Request** is a special variant of the unary request designed to
utilize only ordinary HTTP GET requests, for side-effect-free RPCs such as
simple queries. These requests do not require any special HTTP headers, and can
be viewed in a browser tab. They are designed to be easy to make and easy to
cache in browsers, proxies, and CDNs.

**Unary-Get-Request-Headers** are sent as &mdash; and have the same semantics as
&mdash; HTTP headers. Servers may respond with an error if the client sends too
many headers.

**Query-Get** is sent as the query part of the URI for the request and has the
same semantics as HTTP URI query parameters. Servers should accept query
parameters in any order and allow unknown query parameters alongside the Connect
query parameters. Servers may respond with an error if the query parameter is
too long to fit in a header or results in a path or URL that is too long.

Message payloads in Get requests should be encoded in a deterministic fashion.
Not all codecs can provide a single "canonical" encoding for any given
semantically-identical message; however, when a codec is used for an HTTP GET
request, it should at least use deterministic encoding such that a given domain
object will encode to the same exact message where possible. This is important
for the use case of cached HTTP GET requests, where multiple distinct message
encodings could lead to sub-optimal cache behavior.

**Message-Query** is the RPC request payload, serialized using the codec
indicated by **Encoding-Query** and possibly compressed using the encoding
specified in **Compression-Query**. If **Base64-Query** is specified, the raw
binary octets will be encoded with the RFC 4648 §5 "URL-safe" base64 data
encoding, otherwise a text payload can be encoded as UTF-8 using the
percent-encoding scheme specified in RFC 1738. Optionally, the base64-encoded
message may contain padding characters, but these characters must be
percent-encoded if present.

Note that base64 encoding must be used if the message payload contains binary
data. Payloads using percent-encoding without base64 are only permitted to have
bytes that form valid UTF-8 codepoints. Clients should not send requests with
percent-encoded binary data, and servers may reject requests with
percent-encoded binary data. Therefore, requests with any compression other
than `identity` and any encoding that uses binary data (such as `proto`)
should use base64 encoding. Also, note that clients are still required to
explicitly specify **Base64-Query** even when base64 encoding is required.

If **Base64-Query** is present, the value of the parameter should be one. Other
values for the "base64" parameter will simply be ignored. Generally, a request
with a payload that is not base64-encoded shouldn't need a "base64" parameter.

If the server doesn't support the specified **Message-Codec**, it must respond
with an HTTP status code of 415 Unsupported Media Type.

Servers must assume "identity" if the client omits **Compression-Query**. If
the client omits **Accept-Encoding**, servers must assume that the client
accepts the **Compression-Query** value used for the request. Servers must
assume that all clients accept "identity" as their least preferred encoding.
Server implementations may choose to accept the full HTTP quality value syntax
for **Accept-Encoding**, but client implementations must restrict themselves to
sending the easy-to-parse subset outlined above. Servers should treat
**Accept-Encoding** as an ordered list, with the client's most preferred
encoding first and least preferred encoding last. If the client uses an
unsupported **Compression-Query** value, servers should return an error with
code "unimplemented" and a message listing the supported encodings.
Servers must not attempt to decompress zero-length **Message-Query**.

If **Timeout** is omitted, the server should assume an infinite timeout. The
protocol accommodates timeouts of more than 100 days. Client implementations
may set a default timeout for all RPCs, and server implementations may clamp
timeouts to an appropriate maximum. Note that timeouts, if specified, remain
specified using HTTP headers rather than query parameters.

The **Connect-Version-Query** parameter distinguishes Connect Get requests from
other HTTP GET requests. (In the future, it may also be used to support
revisions to this protocol.) Clients, especially generated clients, should send
this header. Servers and proxies may reject traffic without this parameter with
an HTTP status code of 400.

### Unary-Response

* **Unary-Response** &rarr; Unary-Response-Headers Bare-Message
* **Unary-Response-Headers** &rarr; HTTP-Status Unary-Content-Type \[Content-Encoding\] \[Accept-Encoding\] \*Leading-Metadata \*Prefixed-Trailing-Metadata
* **HTTP-Status** &rarr; ":status" ("200" / \{_error code translated to HTTP_\})
* **Prefixed-Trailing-Metadata** &rarr; Prefixed-ASCII-Metadata / Prefixed-Binary-Metadata
* **Prefixed-ASCII-Metadata** &rarr; Prefixed-Header-Name ASCII-Value
* **Prefixed-Binary-Metadata** &rarr; \{Prefixed-Header-Name "-bin"\} \{base64-encoded value\}
* **Prefixed-Header-Name** &rarr; "trailer-" Header-Name

**Unary-Response-Headers** are sent as &mdash; and have the same semantics as
&mdash; HTTP headers. This includes **Prefixed-Trailing-Metadata**: though it's
sent on the wire alongside **Leading-Metadata**, support for trailing metadata
lets Connect implementations use common interfaces for streaming and unary RPC.
Implementations must transparently prefix trailing metadata keys with
"trailer-" when writing data to the wire and strip the prefix when reading data
from the wire. As noted above, **Leading-Metadata** keys beginning with
"connect-" and **Prefixed-Trailing-Metadata** keys beginning with
"trailer-connect-" are reserved for use by the Connect protocol.

If **Content-Encoding** is omitted, clients must assume "identity". Servers
must either respond with an error or use a **Content-Encoding** supported by
the client.

Successful responses have an **HTTP-Status** of 200. In those cases,
**Unary-Content-Type** is the same as the request's **Unary-Content-Type**.
**Bare-Message** is the RPC response payload, serialized using the codec indicated
by **Unary-Content-Type** and possibly compressed using **Content-Encoding**.
It's sent on the wire as the HTTP response content (often called the body).
Clients must not attempt to decompress zero-length HTTP response content.

Errors are sent with a non-200 **HTTP-Status**. In those cases,
**Unary-Content-Type** _must_ be "application/json". **Bare-Message** is either
omitted or a JSON-serialized [Error](#error-end-stream), possibly compressed
using **Content-Encoding** and sent on the wire as the HTTP response content.
Clients must not attempt to decompress zero-length HTTP response content. If 
**Bare-Message** is an Error, **HTTP-Status** should match Error.code as specified
in [the table below](#error-codes). When reading data from the wire, client 
implementations must use the [HTTP-to-Connect mapping](#http-to-error-code) to infer a Connect 
error code if **Bare-Message** is missing or malformed.

### Examples {#unary-examples}

Using HTTP/1.1 notation, a simple request and successful response:

```
> POST /connectrpc.greet.v1.GreetService/Greet HTTP/1.1
> Host: demo.connectrpc.com
> Content-Type: application/json
>
> {"name": "Buf"}

< HTTP/1.1 200 OK
< Content-Type: application/json
<
< {"greeting": "Hello, Buf!"}
```

The same RPC, but sent as a unary GET request instead:

```
> GET /connectrpc.greet.v1.GreetService/Greet?message=%7B%22name%22%3A%22Buf%22%7D&encoding=json&connect=v1 HTTP/1.1
> Host: demo.connectrpc.com

< HTTP/1.1 200 OK
< Content-Type: application/json
<
< {"greeting": "Hello, Buf!"}
```

(Note that when typing into a browser URL bar, most characters will
automatically be encoded for you.)

The same RPC, but with a 5s timeout, asymmetric compression, and some
custom leading and trailing metadata.

```
> POST /connectrpc.greet.v1.GreetService/Greet HTTP/1.1
> Host: demo.connectrpc.com
> Content-Type: application/json
> Accept-Encoding: gzip, br
> Connect-Timeout-Ms: 5000
> Acme-Shard-Id: 42
>
> {"name": "Buf"}

< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Encoding: gzip
< Trailer-Acme-Operation-Cost: 237
<
< <gzipped JSON>
```

The same RPC again, but with a Protobuf-encoded request and an error response:

```
> POST /connectrpc.greet.v1.GreetService/Greet HTTP/1.1
> Host: demo.connectrpc.com
> Content-Type: application/proto
>
> <uncompressed binary Protobuf>

< HTTP/1.1 501 Not Implemented
< Content-Type: application/json
<
< {
<   "code": "unimplemented",
<   "message": "connectrpc.greet.v1.GreetService/Greet is not implemented"
< }
```

## Streaming RPCs

Streaming RPCs may be half- or full-duplex. In server streaming RPCs, the
client sends a single message and the server responds with a stream of
messages. In client streaming RPCs, the client sends a stream of messages and
the server responds with a single message. In bidirectional streaming RPCs,
both the client and server send a stream of messages. Depending on the Connect
implementation, IDL, and HTTP version in use, some or all of these streaming
RPC types may be unavailable.

### Streaming-Request

* **Streaming-Request** &rarr; Streaming-Request-Headers \*Enveloped-Message
* **Streaming-Request-Headers** &rarr; Streaming-Call-Specification \*Leading-Metadata
* **Streaming-Call-Specification** &rarr; Method-Post Path Streaming-Content-Type \[Connect-Protocol-Version\] \[Timeout\] \[Streaming-Content-Encoding\] \[Streaming-Accept-Encoding\]
* **Streaming-Content-Type** &rarr; "content-type" "application/connect+" ("proto" / "json" / \{_custom_\})
* **Streaming-Content-Encoding** &rarr; "connect-content-encoding" Content-Coding
* **Streaming-Accept-Encoding** &rarr; "connect-accept-encoding" Content-Coding \*("," [" "] Content-Coding)
* **Enveloped-Message** &rarr; Envelope-Flags Message-Length Message
* **Envelope-Flags** &rarr; %d0-255 ; 8 bitwise flags encoded as 1 byte unsigned integer
* **Message-Length** &rarr; \{_length of Message_\} ; encoded as 4 byte unsigned integer, big-endian
* **Message** &rarr; *\{binary octet\}

If **Streaming-Content-Type** does not begin with "application/connect+",
servers should respond with an HTTP status of 415 Unsupported Media Type. This
prevents HTTP clients unaware of Connect's semantics from interpreting a
streaming error response, which uses an HTTP Status of 200 OK, as successful.

Servers must interpret **Streaming-Content-Encoding** and
**Streaming-Accept-Encoding** using the same inference and error-reporting
rules as **Content-Encoding** and **Accept-Encoding**.

The HTTP request content is a sequence of zero or more **Enveloped-Message**.
The first byte is **Envelope-Flags**, a set of 8 bitwise flags.

* If the least significant bit is 1, the **Message** is compressed using the
  algorithm specified in **Streaming-Content-Encoding**. If
  **Streaming-Content-Encoding** is omitted or "identity", this bit must be 0.
  Compression contexts are not maintained over message boundaries.
* If the next least significant bit is 1, the **Message** is an
  [EndStreamResponse](#error-end-stream) rather than the response type
  defined in the service's IDL. Response streams must set this bit on the final
  **Enveloped-Message** in the stream, and must leave this bit unset on all
  other messages in the stream. Request streams must always leave this bit
  unset. (Note that this is not the same as the gRPC-Web protocol, which uses
  the _most_ significant bit to mark trailers.)
* The six most significant bits are reserved for future protocol extensions.

### Streaming-Response

* **Streaming-Response** &rarr; Streaming-Response-Headers 1\*Enveloped-Message
* **Streaming-Response-Headers** &rarr; ":status 200" Streaming-Content-Type \[Streaming-Content-Encoding\] \[Streaming-Accept-Encoding\] \*Leading-Metadata

Streaming responses always have an HTTP status of 200 OK. As noted above,
server implementations must send an [EndStreamResponse](#error-end-stream)
as the final message in the stream, and must not send an EndStreamResponse
earlier in the stream.

### Examples {#streaming-examples}

Using HTTP/1.1 notation and putting each **Enveloped-Message** on a separate
line for readability, a successful client streaming RPC:

```
> POST /connectrpc.greet.v1.GreetService/GreetGroup HTTP/1.1
> Host: demo.connectrpc.com
> Content-Type: application/connect+json
>
> <flags: 0><length: 15>{"name": "Buf"}
> <flags: 0><length: 19>{"name": "Connect"}

< HTTP/1.1 200 OK
< Content-Type: application/connect+json
<
< <flags: 0><length: 39>{"greeting": "Hello, Buf and Connect!"}
< <flags: 2><length: 2>{}
```

A failed server streaming RPC:

```
> POST /connectrpc.greet.v1.GreetService/GreetIndividuals HTTP/1.1
> Host: demo.connectrpc.com
> Content-Type: application/connect+proto
>
> <flags: 0><length: 8><binary proto>

< HTTP/1.1 200 OK
< Content-Type: application/connect+proto
<
< <flags: 2><length: 58>{"error": {"code": "unavailable", "message": "overloaded"}}
```

## Error Codes {#error-codes}

Connect represents categories of errors as codes, and each code maps to a
specific HTTP status code. The codes and their semantics were chosen to match
gRPC. Only the codes below are valid &mdash; there are no user-defined codes.

| Code | HTTP Status | Description |
| ---- | ----------- | ----------- |
| `canceled` | 499 Client Closed Request | RPC canceled, usually by the caller. |
| `unknown` | 500 Internal Server Error | Catch-all for errors of unclear origin and errors without a more appropriate code. |
| `invalid_argument` | 400 Bad Request | Request is invalid, regardless of system state. |
| `deadline_exceeded` | 504 Gateway Timeout | Deadline expired before RPC could complete or before the client received the response. |
| `not_found` | 404 Not Found | User requested a resource (for example, a file or directory) that can't be found. |
| `already_exists` | 409 Conflict | Caller attempted to create a resource that already exists. |
| `permission_denied` | 403 Forbidden | Caller isn't authorized to perform the operation. |
| `resource_exhausted` | 429 Too Many Requests | Operation can't be completed because some resource is exhausted. Use unavailable if the server is temporarily overloaded and the caller should retry later. |
| `failed_precondition` | 400 Bad Request | Operation can't be completed because the system isn't in the required state. |
| `aborted` | 409 Conflict | The operation was aborted, often because of concurrency issues like a database transaction abort. |
| `out_of_range` | 400 Bad Request | The operation was attempted past the valid range. |
| `unimplemented` | 501 Not Implemented | The operation isn't implemented, supported, or enabled. |
| `internal` | 500 Internal Server Error | An invariant expected by the underlying system has been broken. Reserved for serious errors. |
| `unavailable` | 503 Service Unavailable | The service is currently unavailable, usually transiently. Clients should back off and retry idempotent operations. |
| `data_loss` | 500 Internal Server Error | Unrecoverable data loss or corruption. |
| `unauthenticated` | 401 Unauthorized | Caller doesn't have valid authentication credentials for the operation. |

When choosing between `invalid_argument`, `failed_precondition`, and `out_of_range`,
use `invalid_argument` if the failure is independent of the system state. For
example, attempting to seek to a file offset larger than 2^32-1 on a 32-bit
system should return `invalid_argument`. Use `out_of_range` as a common
sub-category of `failed_precondition`, so clients iterating through a space can
detect when they're done. For example, attempting to seek past the
end of a particular file should return `out_of_range`.

When choosing between `unauthenticated`, `permission_denied`, `resource_exhausted`, and
`not_found`, use `unauthenticated` if the user can't be identified or presents
invalid credentials. Use `resource_exhausted` if a per-user quota (for example, a
rate limit) is exhausted. Use `not_found` if an operation is denied for a class
of users (for example, because of a gradual rollout or an undocumented
allowlist). Use `permission_denied` for other authorization-based rejections.

When choosing between `failed_precondition`, `aborted`, and `unavailable`, use
`unavailable` if the client can back off and retry the operation. Use `aborted` if
the client should retry at a higher level (for example, restarting a
read-modify-write cycle). Use `failed_precondition` if the client must explicitly
fix the system state before retrying (for example, by emptying a directory
before attempting to remove it).

Clients must exercise judgment when deciding which errors to retry &mdash;
there's no set of error codes which are safe to retry for all applications.
Typically, services explicitly identify idempotent methods in their IDL.

If clients receive a response with non-200 HTTP status codes and no explicit
Connect error code, they should infer a Connect code using the following table.
This mapping is a superset of gRPC's: in all cases where gRPC maps an HTTP
status code to a specific gRPC status code (that is, something other than
unknown or internal), Connect maps to the semantically-equivalent error code.

#### HTTP to Error Code {#http-to-error-code}

| HTTP Status | Inferred Code |
| ----------- | ------------- |
| 400 Bad Request | `internal` |
| 401 Unauthorized | `unauthenticated` |
| 403 Forbidden | `permission_denied` |
| 404 Not Found | `unimplemented` |
| 429 Too Many Requests | `unavailable` |
| 502 Bad Gateway | `unavailable` |
| 503 Service Unavailable | `unavailable` |
| 504 Gateway Timeout | `unavailable` |
| _all others_ | `unknown` |

## Error and EndStreamResponse {#error-end-stream}

Connect serializes errors and the block of data at the end of each response
stream using JSON. This keeps errors human-readable and easy to debug.

An `Error` is a code, an optional message, and an optional array of details.
Code and message (if present) are UTF-8 strings. When message is omitted or the
empty string, clients may synthesize a user-facing message (and thereby avoid
representing the message as an optional or nullable type, if such types exist
in the implementation language). `{"code": null}` and `{}` are invalid. The
simplest form of `Error` contains just a code:

```json
{
  "code": "unavailable"
}
```

Details are an optional mechanism for servers to attach strongly-typed messages
to errors. Each detail is an object with "type" and "value" properties and any
number of other properties. The "type" field contains the fully-qualified
Protobuf message name as a UTF-8 string, and the "value" field contains
unpadded, base64-encoded binary Protobuf data. For readability on the wire,
server implementations may also serialize the detail to JSON and include the
resulting value under the "debug" key. Clients must not depend on data in the
"debug" key when deserializing details.

```json
{
  "code": "unavailable",
  "message": "overloaded: back off and retry",
  "details": [
    {
      "type": "google.rpc.RetryInfo",
      "value": "CgIIPA",
      "debug": {"retryDelay": "30s"}
    }
  ]
}
```


An `EndStreamMessage` is the final message in streaming response. It conveys
whether or not the RPC succeeded and any trailing metadata. Trailing metadata
is modeled as an object: keys follow **Header-Name**, and values are arrays of
UTF-8 strings. Each string is either an **ASCII-Value** or a base64-encoded
binary value. Keys beginning with "connect-" are reserved for use by the
Connect protocol. Semantically, trailing metadata should be treated as HTTP
headers: keys are case-insensitive, values for the same key can be joined with
commas, and so on. (In practice, Connect implementations typically deserialize
trailing metadata into the same data structure used for HTTP headers.)

```json
{
  "error": {
    "code": "unavailable"
  },
  "metadata": {
    "acme-operation-cost": ["237"]
  }
}
```

Failed RPCs must provide an `Error` in the "error" property, and successful
RPCs must omit the property. `{"error": null}`, `{"error": {}}`, and
`{"error": {"code": null}}` are invalid. The "metadata" property is optional.
After a successful RPC, `EndStreamResponse` can be as simple as `{}`.

## Protocol Buffers {#protobuf}

When used with Protocol Buffer IDL,

* **Procedure-Name** &rarr; ?( \{_proto package name_\} "." ) \{_service name_\} "/" \{_method name_\}
* **Unary-Content-Type** &rarr; "content-type application/" ("proto" / "json")
* **Streaming-Content-Type** &rarr; "content-type application/connect+" ("proto" / "json")

Choose the "proto" content types for binary serialization and the "json" types
to use the canonical JSON mapping.

Protocol Buffers support unary RPCs and all three types of streaming.

[gRPC's HTTP/2 protocol]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
[rfc-http-semantics]: https://www.rfc-editor.org/rfc/rfc9110.html
[anypb-json]: https://github.com/protocolbuffers/protobuf/blob/main/src/google/protobuf/any.proto#L97
