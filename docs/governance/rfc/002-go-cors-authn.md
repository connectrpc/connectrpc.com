# 002: CORS and authn for Go

This RFC proposes adding two ancillary Go projects to the Connect Github
organization:

* `connectrpc.com/cors`, which eases server-side CORS configuration, and
* `connectrpc.com/authn`, which provides flexible server-side authentication
  middleware.

## CORS

[Cross-origin resource sharing][cors], commonly called CORS, allows servers to
indicate whether web browsers should allow scripts to load resources from other
domains. This is a common concern for single-page web applications, where the
API and app are often hosted on different origins &mdash; for example,
`app.acme.com` may need to call APIs hosted on `api.acme.com`. As part of the
CORS flow, servers must be able to list their expected HTTP request and
response header keys.

For backend-to-backend communication (where CORS isn't involved), the Connect
runtime abstracts away protocol-specific headers. But to correctly configure
CORS for browser-to-backend communication, server authors must explicitly list
most of the headers used by the gRPC, gRPC-Web, and Connect protocols. The
[resulting configuration][explicit-cors] is verbose and difficult to evolve
with the underlying protocols.

To make development of browser-facing Connect APIs easier in Go, we propose
creating a small Go package of CORS helpers. This package will help users
configure existing CORS packages (for example, [`github.com/rs/cors`][rs-cors])
without needing to explicitly list all the HTTP headers used by each RPC
protocol.

## Authentication

HTTP servers use a variety of authentication schemes: mutual TLS, cookies, and
various types of bearer tokens are particularly common. Often, the
authentication logic also requires some knowledge of the service schema &mdash;
at least the name of the service and method, but sometimes more detailed
information too.

In Go, authentication checks are best implemented as `net/http` middleware.
This approach lets servers reject unauthenticated requests early, before
spending cycles decompressing and unmarshaling the payload, and it works
equally well for all authentication schemes. However, experience has shown that
many users attempt to implement their checks using Connect interceptors, which
run _after_ decompression and unmarshaling and don't have access to transport
details like TLS state.

To make it easier for users to secure their servers, we propose creating a Go
package for authenticating requests. Users will supply the actual
authentication function, which will have access to both low-level transport
information and some high-level RPC information. Additionally, it will
standardize a mechanism for propagating authenticated callers' identity to
subsequent middlewares, interceptors, and service implementations.

[cors]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
[explicit-cors]: https://connectrpc.com/docs/cors/#allowing-methods-and-headers
[rs-cors]: https://github.com/rs/cors
