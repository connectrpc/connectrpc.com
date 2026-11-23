---
title: "008: Connect-over-WebSocket Protocol"
---

This RFC proposes Connect-over-WebSocket, a binding that carries the Connect
protocol over a WebSocket connection. It lets browser clients make
client-streaming and bidirectional-streaming RPCs, which browser clients cannot
do over Connect-over-HTTP.

Status: **Proposal**, unratified.

## Why

Connect-over-HTTP provides unary and server-streaming RPCs to browsers, but
client streaming and bidirectional streaming need a request body that is still
being written while the response is read. Browsers do not provide that over
`fetch`: request streaming is half-duplex where it exists at all, and it is not
available in every major browser.

WebSocket is the full-duplex transport that every major browser supports. Most
proxies and load balancers already pass it through. Carrying Connect over it
gives browser clients all four RPC types with the same service definitions,
codecs, and error model they already use. Non-browser clients gain a
bidirectional transport that works over HTTP/1.1 infrastructure.

## Anticipated complications

- **New protocol surface.** Every implementation that adopts this binding needs
  new client and server code, and needs to meet the Connect-over-WebSocket
  conformance suite.
- **Browser limits.** The browser WebSocket API cannot set handshake headers,
  so request metadata travels in-band [§7]. A browser cannot see why a
  handshake failed [§4.5].
- **Security.** A browser attaches ambient credentials to a handshake and
  applies no CORS, so servers must check `Origin` [§4.4]. Shared compression
  contexts leak secrets, so compression is restricted [§10].
- **Close code registration.** The close code `3102` must be registered with
  IANA [§14].

## Alternatives

- **WebTransport.** Full duplex over HTTP/3, but support across browsers and
  proxies is still incomplete, and it requires HTTP/3 from end to end.
- **Do nothing.** Browser clients stay limited to unary and server streaming,
  and users who need more keep building their own WebSocket protocols.

## 1. Conventions

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be
interpreted as described in RFC 2119 and RFC 8174.

*Sender* and *receiver* denote the two ends of one RPC. *Client* is the peer
that initiated the WebSocket handshake; *server* is the peer that accepted it.

Byte values are written in hexadecimal, and Unicode scalar values in the usual
`U+XXXX` form.

## 2. Scope

This document specifies how the [Connect
protocol](https://connectrpc.com/docs/protocol/) is carried over a WebSocket
connection ([RFC 6455](https://datatracker.ietf.org/doc/html/rfc6455)). It
covers connection establishment, message framing, metadata, deadlines,
compression, and termination.

It does not specify service definitions, codec behavior, or error semantics
beyond their wire encoding; those are unchanged from Connect.

## 3. Relationship to the Connect protocol

### 3.1 Normative divergences

A Connect-over-WebSocket message stream is **not** a conforming Connect
streaming body. It keeps Connect's `EndStreamResponse` schema and its error
model. It departs from Connect in the following ways:

| #  | Divergence                                                     | Reason                                                                                                                                                |
| -- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Messages carry a marker, not a flags byte and length           | Each frame in a WebSocket message includes a length field, so a user-specified length only restates it with a possibly erroneous value. [§5]          |
| 2  | The frame type specifies the message encoding                  | The WebSocket protocol includes a mechanism for specifying the message type. Most messages are JSON, but binary Protobufs can be sent as well. [§6.1] |
| 3  | Client end-of-stream is an in-band message                     | WebSocket has no half-close, so request EOF cannot be a transport event                                                                               |
| 4  | Request metadata is an in-band message                         | The browser WebSocket API cannot set headers on a handshake                                                                                           |
| 5  | No `Streaming-Content-Encoding`, no message-level compression  | The WebSocket layer compresses whole messages [§10]                                                                                                   |
| 6  | A deadline travels only as a query parameter                   | Browsers cannot set request headers, and metadata cannot bound its own read                                                                           |
| 7  | One connection carries exactly one RPC                         | The procedure is selected by the handshake URI                                                                                                        |
| 8  | The handshake requires HTTP/1.1                                | RFC 6455 defines it there; RFC 8441 is not adopted [§4.1]                                                                                             |
| 9  | Every stream opens with a metadata message, in both directions | The client's is consumed before dispatch, so request metadata is complete for interceptors                                                            |
| 10 | A server SHOULD impose its own deadline                        | A server waits for the opening message, so an unbounded RPC could park a connection [§11]                                                             |
| 11 | Metadata values may contain a horizontal tab or be empty       | Values are RFC 9110 field values, which allow both; Connect's ASCII-Value allows neither [§7.3.1]                                                     |

A client that sends an HTTP request with a `Connection: Upgrade` header, an
`Upgrade: websocket` header, and a `Sec-WebSocket-Protocol` header offering
`connectrpc.1+proto`, `connectrpc.1+json`, or both [§4.3] is asking to use
Connect-over-WebSocket instead of Connect-over-HTTP.

### 3.2 What this binding does not borrow

The envelope header used for Connect streaming (a flags byte plus a length) is
not used for Connect-over-WebSocket. Connect-over-WebSocket makes no changes to
the existing Connect streaming protocol.

### 3.3 What this binding does borrow

The `EndStreamResponse` schema [§9] and the error model are both identical on
the wire to Connect-over-HTTP. That sharing is deliberate: an implementation of
one can decode the other's terminal message unchanged, and the two should not
drift.

## 4. Connection establishment

### 4.1 HTTP version

The handshake MUST be an HTTP/1.1 request. [RFC
6455](https://datatracker.ietf.org/doc/html/rfc6455) defines it over HTTP/1.1,
and this document does not adopt [RFC
8441](https://datatracker.ietf.org/doc/html/rfc8441)'s Extended CONNECT, which
carries WebSocket over HTTP/2.

A **client** whose HTTP stack uses HTTP/2 MUST ensure the handshake goes over
HTTP/1.1. This is usually automatic: a client library that recognizes
`Connection: Upgrade` with `Upgrade: websocket` routes that request to an
HTTP/1.1 connection. The request MUST be a GET request. Other tokens MAY appear
in the `Connection` header alongside `Upgrade` and the upgrade is still
recognized. All token and header matches MUST be case-insensitive.

A **server** MUST offer HTTP/1.1 on the listener that accepts handshakes. It
MAY offer HTTP/2 as well. Only the handshake requires HTTP/1.1, so RPCs that a
client routes over plain HTTP can still use HTTP/2 connections.

A server that offers only HTTP/2 (including h2c) cannot accept a handshake,
because there is no HTTP/1.1 connection to take over. An implementation SHOULD
report that as a server configuration fault rather than a client error.

A server MUST refuse an Extended CONNECT request for a Connect procedure rather
than answer it as an HTTP RPC.

### 4.2 Handshake URI

The RPC's procedure is the path of the handshake URI. A client MUST form the
handshake URI by joining the base URL's path with the procedure path:

```
wss://api.example.com/connect.sample.v1.SampleService/Echo
```

A trailing `/` on the base path MUST NOT produce a doubled separator. The
scheme MUST be `ws` or `wss`, corresponding to the `http` or `https` scheme the
same service would be reached at over Connect-over-HTTP.

One connection carries exactly one RPC. A peer MUST NOT begin a second RPC on a
connection.

A server MAY serve both Connect-over-HTTP and Connect-over-WebSocket on any
registered Connect endpoint.

The initial HTTP request for Connect-over-WebSocket MUST contain the
`Connection: Upgrade` and `Upgrade: websocket` headers. A request without those
headers is a Connect-over-HTTP RPC. The `Sec-WebSocket-Protocol` header holds
the requested supported protocols [§4.3]. The protocol negotiation decides
whether the handshake is accepted.

A deployment that wants WebSocket traffic on its own path, for example to
route it to a different pool of servers, can give WebSocket clients a base URL
that includes that path. With a base URL of `https://api.example.com/ws`, the
handshake URI above becomes
`wss://api.example.com/ws/connect.sample.v1.SampleService/Echo`. Implementations
can offer an option to restrict an endpoint to Connect-over-HTTP or
Connect-over-WebSocket.

An endpoint restricted to Connect-over-HTTP MUST reject a handshake with a
`400 Bad Request`. An endpoint restricted to Connect-over-WebSocket MUST reject
any other request with `426 Upgrade Required` and an `Upgrade: websocket`
header, as [RFC 9110
§15.5.22](https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.22)
defines.

### 4.3 Subprotocol negotiation

The codec is selected by the WebSocket subprotocol.

| Token                | Codec           |
| -------------------- | --------------- |
| `connectrpc.1+proto` | Protobuf binary |
| `connectrpc.1+json`  | Protobuf JSON   |

This specification defines these two codecs. A client or server MAY also
support other codecs. The token for another codec is `connectrpc.1+<codec>`,
where `<codec>` is the name Connect-over-HTTP uses for the same codec in the
`application/connect+<codec>` content type. A codec name MUST be lower-case,
MUST be a valid HTTP token, and MUST NOT be `proto` or `json`.

The definition of another codec MUST state whether it encodes messages as text
or as binary [§6.1]. A peer that does not recognize a token ignores it, so a
client that also offers `connectrpc.1+json` can always connect.

A client MUST offer one or more of these tokens in `Sec-WebSocket-Protocol`,
most preferred first, using the standard negotiation of [RFC 6455
§4.1](https://datatracker.ietf.org/doc/html/rfc6455#section-4.1). A client
MUST NOT offer the same token twice.

A server MUST support Protobuf JSON and SHOULD support Protobuf binary. A
server MUST ignore offered tokens it does not recognize, select the first
offered token whose codec it supports, and echo exactly that token in its
response. A server that supports none of the offered tokens MUST reject the
handshake with `400 Bad Request`. Since every server supports JSON, a client
that offers `connectrpc.1+json` can always connect.

A client MUST encode with the codec of the token the server echoed. A client
MUST check the echoed token. If the server echoes a token the client did not
offer, or echoes no token, the handshake has failed. Some browsers fail the
connection itself in these cases, and the RPC fails as described in [§4.5].
If the socket opens anyway, a browser client MUST close it with `3102` and
report the RPC as failed with the code `internal`. Any other client MUST fail
the connection without a Close frame and report the RPC as failed with the
code `internal`.

`Connect-Protocol-Version` is implied by the subprotocol and MUST NOT be sent
as a header.

### 4.4 Origin

A server MUST reject a cross-origin handshake with HTTP `403 Forbidden` unless
it has been configured to permit one. A handshake carrying no `Origin` header
is not from a browser and MUST NOT be rejected on origin grounds.

**Same-origin means the same host.** A server MUST compare the host and port of
the `Origin` header, exactly as written, with the `Host` header,
case-insensitively. A server MUST NOT include a scheme inferred from the
connection or from proxy headers in the comparison. A deployment that terminates
TLS at a proxy receives `https` in the `Origin` on a plaintext connection, and a
comparison that included the connection's scheme would reject its own pages.

As a result, a page that is served over plain HTTP from the same host passes
this check. A deployment that serves plain HTTP on that host SHOULD use HSTS,
or SHOULD configure the server to accept only `https` origins.

The comparison does not remove default ports. If a proxy adds an explicit
default port to `Host` (for example, `:443`), the comparison fails, and the
deployment MUST configure its permitted origins explicitly.

A browser attaches the user's ambient credentials to a WebSocket handshake and
performs no CORS preflight, so an accept-all default would let any origin open
an authenticated stream.

### 4.5 Handshake failures

A browser does not tell a script why a handshake failed. The WHATWG WebSockets
Standard requires that a script cannot distinguish a rejected handshake from an
unreachable host, a refused connection, or a failed TLS handshake. In all of
these cases, the close code is `1006`. Thus, a browser client cannot read the
status code, the headers, or the body of a rejected handshake. Browser
developer tools and non-browser clients can read them.

A browser client whose connection fails before it opens MUST report the RPC as
failed with the code `unavailable`. The error message SHOULD say that the
reason is not available to the client.

A non-browser client that receives a response other than `101 Switching
Protocols` MUST report the RPC as failed. If the response body is a Connect
error, the client MUST report its code and message. Otherwise, the client MUST
infer the code from the HTTP status, using Connect-over-HTTP's [HTTP to error
code](https://connectrpc.com/docs/protocol/#http-to-error-code) mapping.

**Connection failures use HTTP status codes.** A server MUST reject the
handshake with an HTTP status, and MUST NOT complete the upgrade, when the
failure concerns the connection:

- the handshake offers no token the server supports (`400`, [§4.3]);
- the endpoint is restricted to Connect-over-HTTP (`400`, [§4.2]);
- the handshake is cross-origin (`403`, [§4.4]).

**RPC failures are reported in-band.** When a server accepts the handshake but
rejects the RPC, it MUST complete the upgrade, send `M[]`, send an `S` message
with the error, and close with `1000`. It MUST NOT dispatch the RPC. This
applies to:

- an invalid `connect-timeout-ms` value, reported as `invalid_argument` [§11];
- a `connect-timeout-ms` value of `0`, reported as `deadline_exceeded` [§11].

**An unknown procedure is reported either way.** A server MUST either refuse a
handshake whose URI names a procedure it does not serve with `404`, or complete
the upgrade and report `unimplemented` in-band, as above. A server SHOULD report
it in-band when its routing reaches the Connect handler, because a browser
client can read an `S` message but not a refused handshake. A router in front
of Connect that does not know the path answers `404` before Connect runs, and a
non-browser client infers `unimplemented` from that status, using the mapping
above.

`M` and `S` are always JSON text messages [§6.1], so a server can send those
messages knowing the client will always be able to parse them.

### 4.6 PING/PONG frames

Either peer MAY send PING frames. A server SHOULD send them at a configurable
interval, so that intermediaries which close idle connections keep the
connection open. [RFC 6455
§5.5.2](https://datatracker.ietf.org/doc/html/rfc6455#section-5.5.2) already
requires the receiver to answer each PING with a PONG, including after a client
has sent `C`. Connect-over-WebSocket MUST NOT put application data in PING
frames.

A peer MAY configure an idle timeout. A peer that receives no frame of any kind
(a Connect-over-WebSocket message, PING, or PONG) for that period MUST treat the
connection as ended. A server cancels the RPC and closes with `1011`. A client
fails the RPC with the code `unavailable` and closes with `3102`.

A PONG counts as a received frame, so a stream that is silent at the RPC level
but answers pings stays open. The idle timeout checks that the transport is
alive; it is not the deadline, which [§11.1] does not let messages extend.

## 5. Message markers

Every message begins with one marker: a single byte that specifies the type of
the message. The payload follows it immediately, with nothing in between.

The valid markers and message types are:

| Marker | Name              | Direction       | Payload                       |
| ------ | ----------------- | --------------- | ----------------------------- |
| `B`    | Body              | either          | an RPC message                |
| `M`    | Leading-Metadata  | either          | JSON metadata [§7.3]          |
| `S`    | Server-End-Stream | server → client | `EndStreamResponse` JSON [§9] |
| `C`    | Client-End-Stream | client → server | none [§8]                     |

A receiver MUST treat a message whose marker it does not recognize as a
protocol error, and MUST NOT guess at the payload. A receiver MUST treat a
marker valid only in the opposite direction as a protocol error: `S` from a
client, `C` from a server.

An empty message or a message without a marker is a protocol error.

**A protocol error ends the stream.** Wherever this document says that
something is a protocol error, the receiver MUST end the stream. A server does
so by sending an `S` message whose error has the code `internal`, and then
closing with `1002` [§13]. A client does so by failing the RPC with the code
`internal` and closing with `3102`. The one exception to the code is a `B`
payload that fails to decode, which is reported as `invalid_argument` [§6.1].
The error message SHOULD describe the violation. A receiver MUST NOT skip the
offending message and carry on.

Two conditions end the stream without an `S` message: invalid UTF-8 in a text
message [§6.1], and a message that exceeds the receiver's size limit [§12.1].

This applies to an unknown marker in particular: a receiver MUST NOT accept one.
An unknown marker means the peer uses a protocol version that the receiver does
not support. A receiver that skipped it would misread the messages that follow.

If a server detects a protocol error before it sends its `M` message, it MUST
send its `M` message before sending the `S` message.

### 5.1 The marker space

The four markers listed above are the only valid values in this revision. Any
other first byte is an unknown marker.

Any marker defined in a future revision of this specification SHOULD be
printable ASCII, for the same reason the first four are: it provides a
mnemonic name for the message which is easily viewable in a browser client's
developer tools. In addition, most messages are sent as text messages, and a
byte in the range `0x00`–`0x7F` is a valid one-byte UTF-8 sequence, as a text
message requires.

## 6. Message framing

Each WebSocket message MUST contain exactly one marker and its payload.

The unit is a WebSocket *message*, not a frame. A sender MAY fragment one
across continuation frames ([RFC 6455
§5.4](https://datatracker.ietf.org/doc/html/rfc6455#section-5.4)) and a
receiver MUST reassemble before interpreting the marker: a marker is not a
per-frame tag, and a fragment is not a message. Fragmentation is otherwise
invisible to this binding, which neither requires nor forbids it.

### 6.1 Text and binary

The WebSocket frame type says how the payload is encoded. `M`, `S`, and `C`
are always text. A `B` uses the frame type of the codec the subprotocol
selected [§4.3]:

| Codec                                  | `B` frame type           |
| -------------------------------------- | ------------------------ |
| Protobuf binary (`connectrpc.1+proto`) | binary                   |
| Protobuf JSON (`connectrpc.1+json`)    | text                     |
| Another codec                          | as its definition states |

A message MUST be sent as a binary frame if and only if it is a `B` and the
negotiated codec is binary; every other message MUST be a text frame. Stated
per marker:

- `M` and `S` are always JSON, so always text.
- `B` follows the codec the subprotocol selected [§4.3].
- `C` has no payload and is always text. A `C` with a payload is a protocol
  error.
- A `B` payload, including an empty one, is decoded by the negotiated codec.
  Under Protobuf binary, an empty payload is the empty message. Under Protobuf
  JSON, an empty payload fails to decode, as any other malformed JSON does,
  because the empty message is `{}`.
- `M` and `S` without any payload are protocol errors. An `M` payload is
  a JSON array, and empty metadata is `[]` [§7.3]. An `S` payload is a JSON
  object, and the empty object is `{}` [§9].

A connection therefore mixes frame types when the codec is Protobuf: bodies
arrive binary while metadata and end-of-stream messages arrive text. That is
intended. The frame type is a type tag the transport supplies for free, and a
receiver knows how to parse a payload before it has looked at anything but the
frame.

A message in a frame type that does not match its marker and the negotiated
codec is a protocol error: a `B` in a frame type its codec does not use, or an
`M`, `S`, or `C` in a binary frame. The error message MUST name the frame type
that was expected.

A `B` payload that the negotiated codec fails to decode is a protocol error
[§5], but it is reported as `invalid_argument` rather than `internal`, to match
the behavior of Connect-over-HTTP. A server still closes with `1002` and a
client with `3102`. An `M` or `S` payload that fails to decode is reported as
`internal`, like any other protocol error.

A text message MUST contain valid UTF-8, which [RFC
6455](https://datatracker.ietf.org/doc/html/rfc6455) §8.1 requires of every
text message and which a browser enforces. The four markers are ASCII and JSON
is UTF-8, so a conforming message satisfies this by construction. A text codec
MUST produce valid UTF-8.

A receiver MUST validate the UTF-8 encoding of every text message before it
reads the marker. A receiver that finds invalid UTF-8 MUST fail the connection
with the close code `1007`, as RFC 6455 §8.1 requires, without sending `S`
first. A client that validates UTF-8 itself reports the RPC as failed with the
code `internal`.

A client built on the WebSocket API, in a browser or in another runtime that
implements it, cannot report `internal`. The API validates text messages itself
and fails the connection on invalid UTF-8. Some implementations close with
`1002` instead of `1007`, and some drop the connection without a Close frame,
which RFC 6455 §7.1.7 permits and a server sees as `1006`. Either way, the close
code is `1006`, the same as a dropped connection. A client reports the RPC with
the code `unavailable`, as it does for any connection that ends without `S`
[§13.1].

### 6.2 Message ordering

The client MUST send exactly one `M`, then zero or more `B`, then exactly one
`C`, unless it has already received `S` [§8]. The server MUST send exactly one
`M`, then zero or more `B`, then exactly one `S`. Each side sends its `M` first,
even when it has no metadata.

A server tracks the client's messages as follows:

| Server state          | Valid next message from the client | Any other message |
| --------------------- | ---------------------------------- | ----------------- |
| Awaiting `M`          | `M`, then Open                     | protocol error    |
| Open                  | `B`, stay Open; `C`, then Closed   | protocol error    |
| Closed (`C` received) | none                               | protocol error    |
| Done (`S` sent)       | none                               | discarded         |

After a server sends `S`, client messages that were already in flight can still
arrive. The server MUST discard them rather than treat them as a protocol
error.

A client tracks the server's messages as follows:

| Client state         | Valid next message from the server | Any other message |
| -------------------- | ---------------------------------- | ----------------- |
| Awaiting `M`         | `M`, then Open                     | protocol error    |
| Open                 | `B`, stay Open; `S`, then Done     | protocol error    |
| Done (`S` received)  | none                               | discarded         |

After a client receives `S`, it MUST NOT send anything more except a Close
frame. That includes its own `M` or `C` if it has not sent them yet.

A server MUST NOT send any message after `S`. A client that receives one MUST
discard it rather than treat it as a protocol error.

**Cardinality.** Unary and server-streaming RPCs take exactly one request, and
unary and client-streaming RPCs return exactly one response.

- For a unary or server-streaming RPC, a server that receives zero `B`
  messages or more than one `B` message before `C` MUST end the RPC with an
  `S` carrying an error, and SHOULD use the code `unimplemented`.
- For a unary or client-streaming RPC, a client that receives zero `B`
  messages or more than one `B` message before an `S` without an error MUST
  fail the RPC, and SHOULD use the code `unimplemented`.

### 6.3 A worked exchange

A unary `Echo` under `connectrpc.1+json`, every message a text frame:

```
client →  text    M[]
client →  text    B{"number":"7"}
client →  text    C
server →  text    M[]
server →  text    B{"number":"7"}
server →  text    S{}
server →  close 1000
```

The same call under `connectrpc.1+proto`, mixing frame types:

```
client →  text    M[]
client →  binary  B<protobuf>
client →  text    C
server →  text    M[]
server →  binary  B<protobuf>
server →  text    S{}
server →  close 1000
```

The `M`, `C`, and `S` messages are identical in both: metadata and
end-of-stream messages are text regardless of the codec. Each side opens with
its own `M` even though neither has metadata here [§7.3].

## 7. Metadata

Metadata reaches an application through the call-scoped object its
implementation exposes. Because metadata arrives as the first WebSocket
message, an implementation can populate that object as part of a receive. If
it does, reading the object concurrently with a receive on the same stream is
not safe.

There are three mechanisms for sending metadata in Connect-over-WebSocket:
HTTP headers, query parameters, and the Leading-Metadata message.

### 7.1 Request HTTP headers

The initial upgrade request can include headers with metadata. For
browser-initiated connections, the client application is unable to add
additional headers. Only headers set by the browser or by proxies between the
client and the server will be populated. While it is possible for standalone
client applications to add their own HTTP headers to the initial upgrade
request, HTTP headers SHOULD be limited to those generated by infrastructure,
whether the client is a browser or a standalone application.

The RPC's effective headers [§7.3] start from the handshake request headers,
minus `Connection`, `Upgrade`, every header whose name begins with
`Sec-WebSocket-`, and every header whose name begins with `Connect-`. Handshake
header names are case-insensitive, so a server lower-cases them when it builds
the effective headers.

The first message sent by both the client and the server MUST be a
Leading-Metadata message. This message provides a way for the client and server
business logic to exchange request and response headers. Browser WebSocket
clients are unable to specify additional HTTP headers. A WebSocket server can
add headers to its handshake response, but a browser client cannot read them,
and the server's handler and interceptors have not yet run to add response
headers.

### 7.2 Request query parameters

The handshake URI carries one query parameter, `connect-timeout-ms`. It allows
a browser or standalone client to specify a shorter deadline than the server
provides. Details on the valid values and treatment of this query parameter are
in [§11].

### 7.3 Leading-Metadata message

The `M` message carries leading metadata. [§7.3.1] defines its payload, and
[§6.2] defines when each peer sends it.

It is a protocol error if a key in a Leading-Metadata message matches a key
in the upgrade request header.

A reserved key MUST NOT appear in a Leading-Metadata message [§7.3.2].

The result is the RPC's *effective headers*: what the business logic and its
interceptors see, and what authentication and authorization MUST be based on.

#### 7.3.1 Rules for keys and values in a Leading-Metadata message

**The payload of an `M` message.** The body is a JSON array of entries. Each
entry is a JSON array of strings: the first string is the key, and the strings
after it are that key's values, in order. It is always a text frame:

```json
[
  ["acme-tenant", "tenant-42"],
  ["authorization", "Bearer ..."],
  ["accept-language", "en", "fr"]
]
```

The payload MUST be an array, and every entry MUST be an array of strings with
at least two elements: the key and at least one value. A JSON object, `null`,
an entry that is not an array, an entry with fewer than two elements, or an
element that is not a string is a protocol error. If there is no metadata,
`[]` MUST be sent; an empty body is invalid.

The order of entries carries no meaning. The order of the values within an
entry MUST be preserved.

As in Connect-over-HTTP, and as [RFC 9110
§5.3](https://datatracker.ietf.org/doc/html/rfc9110#section-5.3) allows for HTTP
fields, a key's values are equivalent to one value that joins them with `, `. A
receiver MAY combine them, so `["accept-language", "en", "fr"]` can reach an
application as `["accept-language", "en, fr"]`. An application MUST NOT rely on
the boundary between values, and MUST NOT put a comma inside a value it needs to
read back as one value.

An array is used rather than a JSON object because JSON parsers disagree about
a repeated object key: some keep the first, some keep the last, and many cannot
report the repetition at all. In an array every entry survives parsing, so a
receiver can always detect a repeated key and reject it.

**Keys MUST be valid HTTP field names.** Metadata keys are meant to be a
replacement for HTTP headers and might be passed on to other services as HTTP
headers.

**Keys MUST be lower-case.** A key that contains an upper-case character
(`A`–`Z`) is a protocol error. This matches HTTP/2 and HTTP/3, where a field
name that contains an upper-case character makes the message malformed ([RFC
9113 §8.2.1](https://datatracker.ietf.org/doc/html/rfc9113#section-8.2.1)).
With lower-case keys, comparing two keys is a plain string comparison.

**Values MUST be valid HTTP field values.** A value for a key that does not end
in `-bin` MUST be a field value as [RFC 9110
§5.5](https://datatracker.ietf.org/doc/html/rfc9110#section-5.5) defines it,
limited to visible ASCII characters (`0x21`–`0x7E`), space (`0x20`), and
horizontal tab (`0x09`). RFC 9110 also allows the bytes `0x80`–`0xFF`
(`obs-text`). This binding does not, because a JSON string cannot represent
them as bytes. A value that needs any other character MUST be sent
base64-encoded under a key that ends in `-bin`.

**Leading and trailing whitespace is not part of a value.** As RFC 9110 §5.5
requires, a receiver MUST remove leading and trailing space and horizontal tab
from a value before it delivers the value. A sender SHOULD NOT send them.
Whitespace inside a value is preserved.

**A value MAY be empty.** An empty string is a valid value, so
`["acme-tenant", ""]` is how a sender says that a key is present but empty. A
value that holds only spaces and tabs is empty once trimmed.

**Be careful with commas.** When metadata is passed on as HTTP
headers, a key's values can be joined into one comma-separated field value, as
[RFC 9110 §5.3](https://datatracker.ietf.org/doc/html/rfc9110#section-5.3)
allows and as the Fetch `Headers` object does. A receiver then cannot tell a
comma inside a value from a comma between values. For metadata values that are
always interpreted as a single value (such as a date), there is no issue using
commas.

**Every key has at least one value.** An entry that holds only a key, such as
`["acme-tenant"]`, is a protocol error.

**No duplicate keys.** An `M` message MUST NOT contain two entries with the
same key; all of a key's values belong in its one entry. While HTTP allows a
field to be repeated and treats the repetitions as one comma-joined value,
Connect-over-WebSocket does not allow a key to appear in more than one entry.
There is also no `Set-Cookie` exception. Two entries with the same key are a
protocol error.

**Binary values are base64.** A key that ends in `-bin` carries arbitrary
bytes. Its values MUST be base64-encoded with the standard alphabet. A sender
MUST NOT pad base64-encoded values, and a receiver MUST accept both padded and
unpadded values. A receiver SHOULD NOT treat a value that is not valid base64
as a protocol error when it parses the `M` message, and SHOULD instead report
it when the application decodes the value.

The encoding is required because the carrier is JSON, whose strings are
Unicode: a byte sequence that is not valid UTF-8 cannot be represented, so an
unencoded `-bin` value is corrupted in transit rather than rejected.
Connect-over-HTTP uses the same technique to address this issue.

Apart from invalid base64, as described above, a message that breaks any of
these rules is a protocol error [§5].

#### 7.3.2 Reserved header names

A key in a Leading-Metadata message sent by a client MUST NOT be any of the
following names.

1. A **forbidden request-header name** as defined by the [Fetch
   standard](https://fetch.spec.whatwg.org/#forbidden-request-header):
   `accept-charset`, `accept-encoding`, `access-control-request-headers`,
   `access-control-request-method`, `connection`, `content-length`, `cookie`,
   `cookie2`, `date`, `dnt`, `expect`, `host`, `keep-alive`, `origin`,
   `referer`, `set-cookie`, `te`, `trailer`, `transfer-encoding`, `upgrade`,
   `via`, any name beginning `proxy-` or `sec-`, and `x-http-method`,
   `x-http-method-override` and `x-method-override`. Fetch forbids the last
   three only for certain values; this binding forbids them outright, since the
   method they would override has no meaning here.
2. A name on the **server's infrastructure deny list**. This SHOULD include
   `forwarded`, any `x-forwarded-*`, and `x-real-ip`, and any other headers
   that are set by proxies and infrastructure. Clients must not be able to
   forge these headers. A deployment SHOULD configure the deny list to match
   the headers that are set by an organization's infrastructure.
3. A name **this protocol controls**: any name beginning `connect-`, which
   includes `connect-protocol-version` [§4.3] and `connect-timeout-ms` [§11],
   as well as `content-type` and `content-encoding`. The `sec-` prefix in (1)
   already covers the WebSocket handshake's own headers.

A Leading-Metadata message from a client that carries a reserved name is a
protocol error [§5]. A server MUST NOT ignore the key and continue. Ignoring it
would leave the two ends disagreeing about the effective headers with nothing
on the wire to show it: the client believes it set a value the server does not
have.

**Identity headers set by infrastructure.** A Leading-Metadata key that matches
a handshake header is a protocol error [§7.3], but that check covers only the
headers the handshake carries. Infrastructure often sets an identity header
only for some requests, for example only once a user has authenticated, and a
client can send that header in its M message when the handshake lacks it. Any
header that a deployment's infrastructure sets to convey identity MUST
therefore be on its deny list. Examples are the user headers an authenticating
proxy adds and the client-certificate headers a TLS-terminating proxy adds. The
default list covers only the headers that nearly every proxy sets.

**Ambient credentials and `Origin`.** The upgrade request can carry ambient
credentials when a page from a different origin starts the connection, such
as cookies, HTTP authentication, and TLS client certificates. A server MUST
validate the upgrade request's `Origin` [§4.4].

**Middleware sees only the upgrade.** HTTP middleware in front of the server
runs once, on the handshake, and never sees a Leading-Metadata message.
Authentication and authorization for an RPC MUST therefore be performed against
the effective headers, either in a Connect interceptor or in the business
logic, and not in HTTP middleware. Middleware can authorize the connection;
only the RPC layer can authorize the RPC.

### 7.4 Response metadata

Connect-over-HTTP distinguishes leading metadata (response headers, readable
before the first message) from trailing metadata (readable after the last).
WebSocket has no response header block after the handshake: the 101 response is
written before the RPC handler runs, so a server cannot know at that point what
the handler will set.

Leading response metadata is therefore carried in `M` messages, and trailing
response metadata in the `metadata` field of the `EndStreamResponse` [§9].

The Leading-Metadata message and the End of Server Stream message are separate
namespaces. A key MAY appear in both, and carry unrelated values in each;
neither shadows the other, and a receiver MUST surface both. This mirrors
Connect-over-HTTP, where a header and a trailer of the same name are likewise
distinct.

A receiver MUST surface Leading-Metadata as response *headers* and
`EndStreamResponse.metadata` as response *trailers*, preserving the distinction
its Connect-over-HTTP counterpart would.

A server MUST NOT send a key beginning with `connect-` in its `M` message. If
there is an attempt to send a key beginning with `connect-`, the server fails
the RPC with `internal`, leaves the key out of the `M` and `S` messages it
sends, and closes with `1000`.

**Late metadata.** The server sends `M` when the handler first sends `B` or `S`,
or on an explicit flush before the first `B` message or the `S` message is
sent. Any headers set after `M` are considered late. Any response headers set
on a server after its first `B` or `S` has already been sent MUST be dropped by
the server rather than sent.

## 8. End of client stream

A client MUST end its request stream with exactly one `C` message, unless it
has already received an `S` message. `C` has no payload and is always a text
frame [§6.1].

A server MUST treat `C` as end-of-stream.

A client MUST NOT send a message after `C`. A server MUST NOT deliver one that
arrives anyway, and MUST treat it as a protocol error. A client API SHOULD
report an attempt to send after `C` as an error rather than accept a message
that will not be delivered.

A client that closes the connection before it receives `S`, without having
sent `C`, cancels the RPC. A server whose connection ends before it sends `S`
MUST treat the RPC as canceled by the client, whether or not it received `C`.
The client can no longer receive a response, so the server MUST NOT attempt to
send `S`. A server that has already sent its `S` MUST NOT treat the end of the
connection as a cancellation.

When a browser is navigated away from a page with a WebSocket connection, the
browser sends a 1001 close code. This code MUST be treated by a server as a
cancellation by the client.

### 8.1 Distinguishing between end of client stream and a dropped connection

A `C` and a connection that simply ended are different outcomes, and an
implementation MUST provide a way for an RPC endpoint to distinguish between
the two cases. One says the client finished sending and is waiting for an
answer; the other says there could be no one left to answer.

To detect the end of the connection after `C`, a server implementation MUST
continue to read from the connection until it sends `S`. After `C`, the only
frames that it can receive are Close, Ping, and Pong frames; any message is a
protocol error [§6.2]. Reads of the request stream after `C` return
end-of-stream, and the end of the connection appears to the handler as a
cancellation.

## 9. End of server stream

A server MUST end its response stream with exactly one `S` message. It MUST NOT
send more than one. The payload for an `S` message is a JSON
`EndStreamResponse`, which is identical to the message described in [the
Connect protocol's section on Error and
EndStreamResponse](https://connectrpc.com/docs/protocol/#error-end-stream). It
is always a text frame.

The `metadata` field of `EndStreamResponse` stays a JSON object that maps each
key to an array of values, as in Connect-over-HTTP. It does not use the array
form of an `M` message [§7.3.1]: `S` reuses Connect's schema unchanged so that
one decoder serves both bindings [§3.3], and it therefore carries the same
ambiguity about repeated keys that Connect-over-HTTP has. A server MUST NOT
send a key beginning `connect-` in that metadata. Its keys SHOULD be
lower-case, as in an `M` message; Connect's grammar for these keys allows only
lower-case letters. A receiver MUST compare them case-insensitively, since
Connect specifies that they are case-insensitive.

An `S` with no payload at all is a protocol error. An `EndStreamResponse` is
JSON, and the smallest valid one is `{}`.

A server MUST NOT send a key beginning with `connect-` in its `S` message. If
there is an attempt to send a key beginning with `connect-`, the server fails
the RPC with `internal`, leaves the key out of the `S` it sends, and closes
with `1000`.

A client that sees the connection close without an `S` message MUST treat the
RPC as failed [§13.1].

### 9.1 Closing after `S`

After a server sends the `S` message, it SHOULD send a Close frame with the
code that [§13] assigns, and then close the connection as [§13.2] describes.

## 10. Compression

Compression is performed by the WebSocket layer, using the `permessage-deflate`
extension ([RFC 7692](https://datatracker.ietf.org/doc/html/rfc7692)).

A server MUST require `no_context_takeover` in both directions, imposing the
parameter unilaterally under RFC 7692 §7.1.1 if the client did not offer it. A
compression context shared across messages leaks plaintext across trust
boundaries (the CRIME/BREACH family) whenever attacker-influenced and secret
data travel on one connection.

A server that cannot negotiate `permessage-deflate` with `no_context_takeover`
MUST leave compression disabled rather than fall back to a shared context.

A client SHOULD verify the negotiated compression parameters. A browser exposes
them as `WebSocket.extensions`. If the handshake response negotiates
`permessage-deflate` without both `client_no_context_takeover` and
`server_no_context_takeover`, the client SHOULD fail the RPC with the code
`internal` and close the connection with `3102`, with a reason that names the
compression parameters. Some browsers report only the extension name in
`WebSocket.extensions`. A client running in such a browser cannot verify the
negotiated parameters, and SHOULD skip this check. Be aware that a client that
skips this check cannot detect a misconfigured server or proxy, and data on
such a connection leaks through the shared compression context.

There is no message-level compression and no marker for it.

A proxy can negotiate its own compression with the browser. If it uses context
takeover, a client that checks the parameters fails the RPC with the code
`internal` and closes with `3102` as soon as the socket opens. The client's
error message is the only explanation; the browser itself reports nothing. A
client that does not check leaks data as described above.

## 11. Deadlines

A client expresses a deadline with a `connect-timeout-ms` query parameter on
the handshake URI. The value is in milliseconds and MUST be zero or a positive
integer of at most ten digits.

It is OPTIONAL for a client to send a deadline. An RPC without a deadline is
bounded by the server's own timeout, which every server SHOULD have.

A server MUST treat each of these forms as invalid, and report
`invalid_argument` in-band [§4.5]:

- an empty value;
- any character that is not a digit, including a sign or a decimal point;
- more than ten digits;
- the parameter appearing more than once.

As in Connect-over-HTTP, a timeout of `0` means the RPC is not dispatched. The
server reports `deadline_exceeded` in-band [§4.5].

There are two reasons why the deadline is specified in the query string rather
than in HTTP request headers or Leading-Metadata. First, a browser cannot set
request headers on a handshake, so the URI is its only channel. Second, a
deadline carried in an `M` message cannot be applied to that initial message.

### 11.1 What the deadline bounds

The deadline bounds the **whole RPC**, not the gap between messages. It starts
when the server accepts the handshake and expires once. A stream exchanging a
message every second ends at the same instant as one that has been silent since
it opened.

This is the same behavior as Connect-over-HTTP, but the Connect protocol
specification does not make this explicit.

A receiver MUST NOT extend or reset the deadline when a message arrives. A
receiver MUST NOT treat it as an inactivity timeout.

**Expiry at the server.** When the deadline expires, the server MUST send `M`
if it has not yet sent it, then an `S` with the code `deadline_exceeded`, and
then close with `1000`. This applies whether or not the client's `M` has
arrived.

**Expiry at the client.** A client's timer starts when it sends the handshake
request. If the timer expires before `S` arrives, the client reports the RPC as
failed with the code `deadline_exceeded` and closes with `1000`. The server
treats this as a cancellation [§8].

### 11.2 Server timeout

A server SHOULD impose a deadline of its own. The effective deadline is the
**shorter** of the two.

Specifying a server timeout protects the server against a client that stops
participating. A server waits for the `M` message that opens a stream [§7.3]
before it dispatches the RPC; without a deadline, a peer that upgrades and then
goes silent would hold that connection indefinitely.

Implementations SHOULD make the maximum configurable and SHOULD default it
generously. Connect-over-WebSocket is intended for long-lived streams.

## 12. Size limits

A receiver (both client and server) MAY impose a maximum message size. It MUST
apply the limit to the decompressed size of a whole WebSocket message,
reassembled across continuation frames, as [§6] requires. A limit applied per
frame would be ineffective, since a sender could send multiple frames to work
around it.

The marker byte MUST NOT count toward the limit. The limit is the size of the
RPC message itself.

The rest of this section applies to receivers that control their own framing.
A browser receives whole, decompressed messages, and cannot bound compressed
bytes or stop reading part-way through a message.

A receiver with a maximum message size MUST bound both the compressed bytes it
receives and the decompressed data.

A receiver that rejects a message for exceeding its limit MUST stop reading
that message rather than consume it, and SHOULD NOT read more of it than the
limit plus a bounded margin. Usually, one byte past the limit is enough to know
the message overran. The abandoned bytes are discarded with the connection. A
receiver MUST NOT attempt to resume the stream after rejecting a message.

### 12.1 Reporting an oversized message

A **server** that rejects an oversized client message closes with `1009`. It
MAY first send an `S` message that specifies the limit:

```json
{
  "error": {
    "code": "resource_exhausted",
    "message": "message exceeds the 4194304 byte limit"
  }
}
```

It MAY instead close with `1009` immediately, without `S`, which is what most
WebSocket libraries do when a read limit is exceeded. This is one of the two
exceptions to the protocol-error rule in [§5].

A client that sees a `1009` close before `S` MUST report the RPC as failed
with the code `resource_exhausted`.

A **client** that rejects an oversized server message has no message to send:
`S` is server-only and this binding defines no client error marker [§5], so a
client's only channel is the close frame. A non-browser client SHOULD close
with `1009`. Browser-based applications cannot send `1009`, because
`close(1009)` throws an `InvalidAccessError` [§14], so a browser client that
enforces its own limit closes with `3102`. (Firefox sends `1009` itself when
a message exceeds its internal limit.) Either way, the client reports the RPC
as failed with the code `resource_exhausted`. The close reason SHOULD specify
the limit and MUST be no more than 123 UTF-8 bytes.

## 13. Connection closure

| Condition                                   | Server sends                                | Client sends                          | Section |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------- | ------- |
| Normal completion                           | 1000                                        | 1000                                  | §9      |
| Client cancels before `S`                   | —                                           | 1000                                  | §8      |
| Page navigates away                         | —                                           | 1001 (sent by the browser)            | §8      |
| Client deadline expires                     | —                                           | 1000                                  | §11.1   |
| Server deadline expires                     | 1000 (after `S` with `deadline_exceeded`)   | —                                     | §11.1   |
| Server shuts down                           | 1001 (after `S` with `unavailable`)         | —                                     | §13     |
| Protocol error                              | 1002 (after `S`)                            | 3102                                  | §5      |
| Message in the wrong frame type             | 1002 (after `S`)                            | 3102                                  | §6.1    |
| Invalid UTF-8                               | 1007 (no `S`)                               | 1007 (browsers: 1002, or no Close)    | §6.1    |
| Message exceeded size limit                 | 1009 (`S` optional)                         | 1009, or 3102 from browser script     | §12.1   |
| Compression parameters not acceptable       | —                                           | 3102                                  | §10     |
| Idle timeout                                | 1011                                        | 3102                                  | §4.6    |
| Server tried to send a `connect-` key       | 1000 (after `S` with `internal`)            | —                                     | §7.4, §9 |
| Server could not marshal its `S` message    | 1011                                        | —                                     | §13     |
| Internal client error                       | —                                           | 3102                                  | §13     |
| Peer terminated without a closing handshake | (none)                                      | (none)                                | §13.1   |

Browsers do not allow application-level code to send close codes in the
1001–2999 range. For any abnormal completion, a browser client sends a `3102`
protocol error code and a reason in a string.

A browser surfaces an absent close message as code `1006`. A client MUST NOT
report `1006` as a transport failure without first checking whether an `S`
message arrived.

After a protocol error, a server closes with `1002`. A client MUST take the
RPC's outcome from `S`, or from its absence [§13.1], and MUST NOT derive it from
the close code. The exceptions are the two cases that close without `S`: `1007`
(invalid UTF-8, reported as `internal`) and `1009` (size limit, reported as
`resource_exhausted`).

A server that shuts down while an RPC is in progress SHOULD send `M` if it has
not yet sent it, then an `S` with the code `unavailable`, and then close with
`1001`, which [RFC 6455
§7.4.1](https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1) defines
for an endpoint that is going away.

### 13.1 Closing without a terminal message

A client MUST treat a connection that closes without `S` as a failed RPC, and
MUST NOT infer success from close code `1000` [§9]. The RPC did not complete,
irrespective of the close code.

A client MUST report such an RPC as failed with the code `unavailable`, unless
this document assigns another code. This includes close code `1006`, whether
the network dropped the connection or the client's WebSocket API failed it.
The other codes are:

- `canceled` when the client canceled the RPC [§8];
- `deadline_exceeded` when the client's deadline expired [§11.1];
- `invalid_argument` when the client could not decode a `B` payload [§6.1];
- `internal` when the client detected any other protocol error [§5];
- `internal` when the server closed with `1007` [§6.1];
- `resource_exhausted` when the server closed with `1009` [§12.1].

A server closing without sending an `S` message is always an error state. It
could be caused by:

- the upgrade never completed, so there is no WebSocket and the failure is an
  HTTP status [§4], which a browser client cannot read [§4.5];
- a failure in the RPC code caused it to exit without sending a message;
- the peer had already closed the connection.

A client that has received `S` MAY close without sending `C`, and the RPC is
complete. A client that closes before `S` without sending `C` cancels the RPC
[§8].

A client MUST specify a valid close code when closing a connection. If this is
due to an unexpected condition in the client, the close code MUST be 3102.

A server MUST NOT require `C` after it has sent `S` to complete an RPC, and
MUST NOT report its absence as an error once it has sent `S`.

### 13.2 Draining before closing

Whenever a server sends a Close frame, whether after `S` or without it
[§6.1, §12.1], it SHOULD stop interpreting incoming messages. It MAY then
close the write side of the transport. It SHOULD continue to read incoming
frames, discarding any data frames, until it receives the client's Close frame
or a byte limit or a time limit is reached. Only then does it close the
connection. A server SHOULD NOT close the connection while unread data can
remain and neither limit has been reached, because a TCP reset can destroy the
`S` message, if one was sent, and the Close frame before the peer reads them.

The server closes the TCP connection first, as [RFC 6455
§7.1.1](https://datatracker.ietf.org/doc/html/rfc6455#section-7.1.1)
recommends. It does not wait for the client to close it: a client following
RFC 6455 waits for the server.

After a message that exceeded the size limit, the byte limit is what keeps the
drain within the bounded margin that [§12] allows.

## 14. IANA considerations

Browser clients are unable to set codes other than 1000 and values in the range
3000–4999 ([WHATWG WebSockets
Standard](https://websockets.spec.whatwg.org/#dom-websocket-close)). A browser
can set other values itself, but calling `close()` with an out-of-range value
produces an `InvalidAccessError`.

Values in the range 3000–3999 MUST be registered with IANA and the close code
`3102`
referenced in this RFC has been [registered](https://www.iana.org/assignments/websocket).

## References

- [The Connect protocol](https://connectrpc.com/docs/protocol/)
- [RFC 6455: The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [RFC 7692: Compression Extensions for WebSocket](https://datatracker.ietf.org/doc/html/rfc7692)
- [RFC 8441: Bootstrapping WebSockets with HTTP/2](https://datatracker.ietf.org/doc/html/rfc8441)
- [RFC 9113: HTTP/2](https://datatracker.ietf.org/doc/html/rfc9113)
- [WHATWG WebSockets Standard](https://websockets.spec.whatwg.org/)
- [WHATWG Fetch Standard](https://fetch.spec.whatwg.org/)
