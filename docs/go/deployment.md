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

## Observability

Because Connect stays close to `net/http`, any logging, tracing, or metrics
that work with an `http.Handler` or `http.Client` also work with Connect. In
particular, the [`otelhttp`][otelhttp] OpenTelemetry package and the
[`ochttp`][ochttp] OpenCensus package both work seamlessly with Connect servers
and clients.

## HTTP/2 without TLS {#h2c}

In many environments, you'll need to use the HTTP/2 protocol _without_ TLS,
usually called h2c. For example, GCP's Cloud Run service only supports
end-to-end HTTP/2 if your server supports h2c. Similarly, you may want to
interoperate with `grpc-go` servers and clients using h2c (via the `insecure`
package). Because `net/http` doesn't expose configuration knobs for h2c
directly, Connect servers and clients must use `golang.org/x/net/http2`.

You can add h2c support to any `http.Handler` by wrapping it in
`h2c.NewHandler`. You'll typically do this when creating your server:

```go
package main

import (
  "net/http"

  "golang.org/x/net/http2"
  "golang.org/x/net/http2/h2c"
)

func main() {
  mux := http.NewServeMux()
  // Mount some handlers here.
  server := &http.Server{
    Addr: ":http",
    Handler: h2c.NewHandler(mux, &http2.Server{}),
    // Don't forget timeouts!
  }
}
```

Configuring your clients to use h2c is only a bit more complex:

```go
package main

import (
  "crypto/tls"
  "net"
  "net/http"

  "golang.org/x/net/http2"
)

func newInsecureClient() *http.Client {
  return &http.Client{
    Transport: &http2.Transport{
      AllowHTTP: true,
      DialTLS: func(network, addr string, _ *tls.Config) (net.Conn, error) {
        // If you're also using this client for non-h2c traffic, you may want
        // to delegate to tls.Dial if the network isn't TCP or the addr isn't
        // in an allowlist.
        return net.Dial(network, addr)
      },
      // Don't forget timeouts!
    },
  }
}
```

[cloudflare-timeouts]: https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/
[go-deadlines]: https://github.com/golang/go/issues/16100
[otelhttp]: https://pkg.go.dev/go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
[ochttp]: https://pkg.go.dev/go.opencensus.io/plugin/ochttp

## CORS

Cross-origin resource sharing (CORS) is needed to support web clients
on other origins other than the server's own.

CORS can be configured outside of Connect's Go APIs by using popular go libraries. The following example
shows how to configure CORS with the [`github.com/rs/cors`](https://github.com/rs/cors) package:

```go
mux := http.NewServeMux()
mux.Handle(pingv1connect.NewPingServiceHandler(&PingServer{}))

corsHandler := cors.New(cors.Options{
	AllowedMethods: []string{
		http.MethodGet,
		http.MethodPost,
	},
	AllowedOrigins: []string{"example.com"},
	AllowedHeaders: []string{
		"Accept-Encoding",
		"Content-Encoding",
		"Content-Type",
		"Connect-Protocol-Version",
		"Connect-Timeout-Ms",
		"Connect-Accept-Encoding",  // Unused in web browsers, but added for future-proofing
		"Connect-Content-Encoding", // Unused in web browsers, but added for future-proofing
		"Grpc-Timeout",             // Used for gRPC-web
		"X-Grpc-Web",               // Used for gRPC-web
		"X-User-Agent",             // Used for gRPC-web
	},
	ExposedHeaders: []string{
		"Content-Encoding",         // Unused in web browsers, but added for future-proofing
		"Connect-Content-Encoding", // Unused in web browsers, but added for future-proofing
		"Grpc-Status",              // Required for gRPC-web
		"Grpc-Message",             // Required for gRPC-web
	},
})
handler := corsHandler.Handler(mux)
http.ListenAndServe(":8080", handler)
```

Make sure to include application-specific request headers in the allowed headers,
and response headers in the exposed headers. If your application uses trailers,
they will be sent as header fields with a `Trailer-` prefix for Connect unary RPCs.
