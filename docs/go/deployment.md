---
title: Deployment & h2c
sidebar_position: 80
---

After building a Connect API, you still need to deploy it to production. This
guide covers how to configure timeouts, observability, HTTP/2 without TLS and
CORS.

## Timeouts and connection pools

Connect stays close to `net/http`, so you should configure your servers and
clients as you normally would. (If you're not sure what all the different
timeouts mean, [this Cloudflare blog post][cloudflare-timeouts] is a good place
to start.) There are a few RPC-specific nuances, though:

- RPC clients tend to make many requests to relatively few hosts. On your HTTP
  client, you may want to increase `Transport.MaxIdleConnsPerHost`.
- Most RPC servers don't use HTTP redirects, so you may want to configure your
  clients to never follow them:
  ```go
  client := &http.Client{
    CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
      return http.ErrUseLastResponse
    }
  }
  ```
- Connect always sets the `Accept-Encoding` HTTP header, so the client's
  `Transport.DisableCompression` has no effect on Connect RPCs.
- Timeouts for streaming RPCs apply to the whole message exchange. Servers must
  strike a balance between keeping timeouts reasonable for unary RPCs while
  still leaving enough time for streaming RPCs. Clients can use a compromise
  configuration or use separate HTTP clients for streaming and unary calls.

Especially if you're setting long server timeouts to accommodate streaming
RPCs, remember that under the hood `net/http` implements timeouts by calling
`SetDeadline` on a `net.Conn`. We'd really like something like an idle timeout
instead: "if no data is sent or received for N ms, close this connection."
Sadly, this API doesn't exist &mdash; and without it, any read or write can
block until the whole stream times out. This opens all `net/http` servers up to
abuse by clients who open a stream and don't send any data, but the problem is
magnified with long timeouts. You may want to keep timeouts short and avoid
streaming RPCs if your API is exposed to untrusted clients. For more detail,
see [this Go issue][go-deadlines].

Also, if your [http.Server](https://pkg.go.dev/net/http#Server) has the
`ReadTimeout` or `WriteTimeout` field configured, it applies to the entire
operation duration, even for streaming calls. See the [FAQ](../faq.md#stream-error)
for more information.

## Observability

Check out our [Observability page](./observability.md).

## HTTP/2 without TLS {#h2c}

In many environments, you'll need to use the HTTP/2 protocol _without_ TLS,
usually called h2c. For example, GCP's Cloud Run service only supports
end-to-end HTTP/2 if your server supports h2c. Similarly, you may want to
interoperate with `grpc-go` servers and clients using h2c (via the `insecure`
package).

You can add h2c support to any `http.Server` and client `http.Transport` using
[`http.Protocols`][http-protocols]. You'll typically do this when creating
your server:

```go
package main

import (
  "net/http"
)

func main() {
  mux := http.NewServeMux()
  // Mount some handlers here.
  p := new(http.Protocols)
  p.SetHTTP1(true)
  p.SetUnencryptedHTTP2(true)
  server := &http.Server{
    Addr:      ":http",
    Handler:   mux,
    Protocols: p,
    // Don't forget timeouts!
  }
}
```

Then configure your clients to use h2c:

```go
package main

import (
  "net/http"
)

func newInsecureClient() *http.Client {
  p := new(http.Protocols)
  p.SetUnencryptedHTTP2(true)
  // This client will not work for HTTP/1-only servers.
  // And if HTTP/1 is enabled, H2C will not be used, as the deprecated
  // `Upgrade: h2c` is not supported.
  return &http.Client{
    Transport: &http.Transport{
      Protocols: p,
    },
    // Don't forget timeouts!
  }
}
```

[cloudflare-timeouts]: https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/
[go-deadlines]: https://github.com/golang/go/issues/16100
[http-protocols]: https://pkg.go.dev/net/http#Protocols

## CORS

Cross-origin resource sharing (CORS) is needed to support web clients
on other origins other than the server's own. In Go, servers may configure CORS
by using any popular third-party library or by writing a small `net/http`
middleware to handle `OPTIONS` requests. In either case, the
[`connectrpc.com/cors`](https://github.com/connectrpc/cors-go) package provides
some useful helper functions.

The following example shows how to add CORS support to a Connect handler with
the [`github.com/rs/cors`](https://github.com/rs/cors) package:

```go
import (
	"net/http"

	connectcors "connectrpc.com/cors"
	"github.com/rs/cors"
)

// withCORS adds CORS support to a Connect HTTP handler.
func withCORS(h http.Handler) http.Handler {
	middleware := cors.New(cors.Options{
		AllowedOrigins: []string{"example.com"},
		AllowedMethods: connectcors.AllowedMethods(),
		AllowedHeaders: connectcors.AllowedHeaders(),
		ExposedHeaders: connectcors.ExposedHeaders(),
	})
	return middleware.Handler(h)
}
```

Make sure to include application-specific request headers in the allowed headers,
and response headers in the exposed headers. If your application uses trailers,
they will be sent as header fields with a `Trailer-` prefix for unary Connect
RPCs.
