---
title: Observability
sidebar_position: 65
---

Connect stays close to `net/http`, which means any logging, tracing, or metrics that work with an `http.Handler` or `http.Client` will also work with Connect. In particular, the [otelhttp](https://pkg.go.dev/go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp) OpenTelemetry package and the [ochttp](https://pkg.go.dev/go.opencensus.io/plugin/ochttp) OpenCensus package both integrate seamlessly with Connect servers and clients.

For more detailed, RPC-focused metrics, use the [otelconnect] package. [otelconnect] works with your [OpenTelemetry] metrics and tracing setup to capture information such as:
- `rpc.system`: Was this call gRPC, gRPC-Web, or Connect?
- `rpc.service` and `rpc.method`: What service and method was called?
- `responses_per_rpc`: How many messages were written to streaming responses?
- `error_code`/`status_code`: What specific gRPC or Connect error was returned?

OpenTelemetry can be quite complex, so this guide assumes that readers are familiar with:

- What [observability](https://opentelemetry.io/docs/concepts/observability-primer/) is.
- A basic understanding of [OpenTelemetry metrics and tracing](https://opentelemetry.io/docs/reference/specification/).
- How [TextMapPropagators](https://opentelemetry.io/docs/reference/specification/context/api-propagators/), [MeterProviders](https://opentelemetry.io/docs/reference/specification/metrics/sdk/), and [TraceProviders](https://opentelemetry.io/docs/concepts/signals/traces/) are initialized and used.

## Enabling OpenTelemetry for Connect

Once you have OpenTelemetry set up in your application, enabling OpenTelemetry in a Connect project is as simple as adding the [otelconnect.NewInterceptor] option on Connect handler and client constructors. If you do not have OpenTelemetry in your application, you can refer to the [OpenTelemetry Go getting started guide](https://opentelemetry.io/docs/instrumentation/go/getting-started/).

```go
// highlight-next-line
import "connectrpc.com/otelconnect"

path, handler := greetv1connect.NewGreetServiceHandler(
	greeter,
	// highlight-start
	connect.WithInterceptors(
		otelconnect.NewInterceptor(/* custom options */),
	),
	// highlight-end
)

client := greetv1connect.NewGreetServiceClient(
	http.DefaultClient,
	"http://localhost:8080",
	// highlight-start
	connect.WithInterceptors(
		otelconnect.NewInterceptor(/* custom options */),
	),
	// highlight-end
)
```

By default, this will use:

- TextMapPropagator from `otel.GetTextMapPropagator()`
- MeterProvider from `global.MeterProvider()`
- TracerProvider from `otel.GetTracerProvider()`

## Using custom MeterProvider, TraceProvider and TextMapPropagators

When running multiple applications in a single binary, or if different sections of code should use different exporters, pass the correct exporters to [otelconnect.NewInterceptor] explicitly:
- [otelconnect.WithTracerProvider] to set the TracerProvider
- [otelconnect.WithMeterProvider] to set the MeterProvider
- [otelconnect.WithPropagator] to set the TextMapPropagator


```go
// newInterceptor instruments Connect clients and handlers using custom OpenTelemetry metrics, tracing, and propagation.
func newInterceptor(tp trace.TracerProvider, mp metric.MeterProvider, p propagation.TextMapPropagator) connect.Interceptor {
	return otelconnect.NewInterceptor(
		otelconnect.WithTracerProvider(tp),
		otelconnect.WithMeterProvider(mp),
		otelconnect.WithTextMapPropagator(p),
	)
}
```

## Configuration for internal microservices

By default, [otelconnect]-instrumented servers are conservative and behave as though they're internet-facing. They don't trust any tracing information sent by the client, and will create new trace spans for each request. The new spans are linked to the remote span for reference (using OpenTelemetry's [trace.Link]), but tracing UIs will display the request as a new top-level transaction.

If your server is deployed as an internal microservice, configure [otelconnect] to trust the client's tracing information using [otelconnect.WithTrustRemote]. With this option, servers will create child spans for each request.

## Reducing metrics and tracing cardinality

By default, the [OpenTelemetry RPC conventions](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/semantic_conventions/rpc.md) produce high-cardinality server-side metric and tracing output. In particular, servers tag all metrics and trace data with the server's IP address and the remote port number. To drop these attributes, use [otelconnect.WithoutServerPeerAttributes]. For more customizable attribute filtering, use [otelconnect.WithFilter].

[otelconnect]: https://pkg.go.dev/connectrpc.com/otelconnect
[connect-go]: https://github.com/connectrpc/connect-go
[OpenTelemetry]: https://opentelemetry.io/
[trace.Link]: https://pkg.go.dev/go.opentelemetry.io/otel/trace#Link
[otelconnect.WithTracerProvider]: https://pkg.go.dev/connectrpc.com/otelconnect#WithTracerProvider
[otelconnect.WithMeterProvider]: https://pkg.go.dev/connectrpc.com/otelconnect#WithMeterProvider
[otelconnect.WithPropagator]: https://pkg.go.dev/connectrpc.com/otelconnect#WithPropagator
[otelconnect.NewInterceptor]: https://pkg.go.dev/connectrpc.com/otelconnect#NewInterceptor
[otelconnect.WithTrustRemote]: https://pkg.go.dev/connectrpc.com/otelconnect#WithTrustRemote
[otelconnect.WithFilter]: https://pkg.go.dev/connectrpc.com/otelconnect#WithFilter
[otelconnect.WithoutServerPeerAttributes]: https://pkg.go.dev/connectrpc.com/otelconnect#WithoutServerPeerAttributes
