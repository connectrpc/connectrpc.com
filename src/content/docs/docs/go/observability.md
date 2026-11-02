---
title: Observability
---

Connect stays close to `net/http`, which means any logging, tracing, or metrics that work with an `http.Handler` or `http.Client` will also work with Connect. In particular, the [otelhttp](https://pkg.go.dev/go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp) OpenTelemetry package integrates seamlessly with Connect servers and clients.

For more detailed, RPC-focused metrics, use the [otelconnect] package. [otelconnect] works with your [OpenTelemetry] metrics and tracing setup to record:

- `rpc.system.name`: the protocol, either `connectrpc` for Connect or `grpc` for gRPC and gRPC-Web.
- `rpc.method`: the full procedure name, such as `connectrpc.greet.v1.GreetService/Greet`.
- `rpc.response.status_code`: the status code, such as `OK` or `DEADLINE_EXCEEDED`.
- `rpc.server.call.duration` and `rpc.client.call.duration`: how long each call took.

OpenTelemetry can be quite complex, so this guide assumes that readers are familiar with:

- What [observability](https://opentelemetry.io/docs/concepts/observability-primer/) is.
- A basic understanding of [OpenTelemetry metrics and tracing](https://opentelemetry.io/docs/reference/specification/).
- How [TextMapPropagators](https://opentelemetry.io/docs/reference/specification/context/api-propagators/), [MeterProviders](https://opentelemetry.io/docs/reference/specification/metrics/sdk/), and [TraceProviders](https://opentelemetry.io/docs/concepts/signals/traces/) are initialized and used.

## Enabling OpenTelemetry for Connect

Once you have OpenTelemetry set up in your application, enabling OpenTelemetry in a Connect project is as simple as passing the [otelconnect.NewServerInterceptor] and [otelconnect.NewClientInterceptor] interceptors to the Connect server and client constructors. If you do not have OpenTelemetry in your application, you can refer to the [OpenTelemetry Go getting started guide](https://opentelemetry.io/docs/instrumentation/go/getting-started/).

```go mark={1,4-7,9,12-15,20}
import "connectrpc.com/otelconnect"

func main() {
	otelServer, err := otelconnect.NewServerInterceptor()
	if err != nil {
		log.Fatal(err)
	}

	server := connect.NewServer(otelServer)
	greetv1connect.RegisterGreetServiceHandler(server, greeter)

	otelClient, err := otelconnect.NewClientInterceptor()
	if err != nil {
		log.Fatal(err)
	}

	client := greetv1connect.NewGreetServiceClient(
		connect.NewClient(
			connecthttp.NewTransport(http.DefaultClient, "http://localhost:8080"),
			otelClient,
		),
	)
}
```

By default, this will use:

- TextMapPropagator from [otel.GetTextMapPropagator]
- MeterProvider from [otel.GetMeterProvider]
- TracerProvider from [otel.GetTracerProvider]

## Using custom MeterProvider, TraceProvider and TextMapPropagators

When running multiple applications in a single binary, or if different sections of code should use different exporters, pass the correct exporters to [otelconnect.NewServerInterceptor] and [otelconnect.NewClientInterceptor] explicitly:

- [otelconnect.WithTracerProvider] to set the TracerProvider
- [otelconnect.WithMeterProvider] to set the MeterProvider
- [otelconnect.WithPropagator] to set the TextMapPropagator

```go
// newServerInterceptor instruments Connect servers using custom OpenTelemetry metrics, tracing, and propagation.
func newServerInterceptor(
	tracerProvider trace.TracerProvider,
	metricProvider metric.MeterProvider,
	textMapPropagator propagation.TextMapPropagator,
) (connect.ServerInterceptor, error) {
	return otelconnect.NewServerInterceptor(
		otelconnect.WithTracerProvider(tracerProvider),
		otelconnect.WithMeterProvider(metricProvider),
		otelconnect.WithPropagator(textMapPropagator),
	)
}
```

## Configuration for internal services

By default, [otelconnect]-instrumented servers are conservative and behave as though they're internet-facing. They don't trust any tracing information sent by the client, and will create new trace spans for each request. The new spans are linked to the remote span for reference (using OpenTelemetry's [trace.Link]), but tracing UIs will display the request as a new top-level transaction.

If your server is deployed as an internal service, configure [otelconnect] to trust the client's tracing information using [otelconnect.WithTrustRemote]. With this option, servers will create child spans for each request.

## Reducing metrics and tracing cardinality

The [OpenTelemetry RPC conventions](https://opentelemetry.io/docs/specs/semconv/rpc/rpc-spans/) include the client's address and port on server spans, which produces high-cardinality output. [otelconnect] omits these attributes by default; to add them, use [otelconnect.WithServerPeerAttributes]. For more customizable attribute filtering, use [otelconnect.WithAttributeFilter]. To skip instrumenting some RPCs entirely, use [otelconnect.WithFilter].

[otelconnect]: https://pkg.go.dev/connectrpc.com/otelconnect
[OpenTelemetry]: https://opentelemetry.io/
[trace.Link]: https://pkg.go.dev/go.opentelemetry.io/otel/trace#Link
[otel.GetMeterProvider]: https://pkg.go.dev/go.opentelemetry.io/otel#GetMeterProvider
[otel.GetTracerProvider]: https://pkg.go.dev/go.opentelemetry.io/otel#GetTracerProvider
[otel.GetTextMapPropagator]: https://pkg.go.dev/go.opentelemetry.io/otel#GetTextMapPropagator
[otelconnect.WithTracerProvider]: https://pkg.go.dev/connectrpc.com/otelconnect#WithTracerProvider
[otelconnect.WithMeterProvider]: https://pkg.go.dev/connectrpc.com/otelconnect#WithMeterProvider
[otelconnect.WithPropagator]: https://pkg.go.dev/connectrpc.com/otelconnect#WithPropagator
[otelconnect.NewServerInterceptor]: https://pkg.go.dev/connectrpc.com/otelconnect#NewServerInterceptor
[otelconnect.NewClientInterceptor]: https://pkg.go.dev/connectrpc.com/otelconnect#NewClientInterceptor
[otelconnect.WithTrustRemote]: https://pkg.go.dev/connectrpc.com/otelconnect#WithTrustRemote
[otelconnect.WithFilter]: https://pkg.go.dev/connectrpc.com/otelconnect#WithFilter
[otelconnect.WithServerPeerAttributes]: https://pkg.go.dev/connectrpc.com/otelconnect#WithServerPeerAttributes
[otelconnect.WithAttributeFilter]: https://pkg.go.dev/connectrpc.com/otelconnect#WithAttributeFilter
