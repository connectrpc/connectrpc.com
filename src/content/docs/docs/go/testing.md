---
title: Testing
---

When writing tests for your Connect for Go application, invoke your service
through a client and a transport, just like production callers. Calling
service methods directly may seem convenient, but it skips the setup
performed by `connect.Server`: the context carries no `CallInfo`, and
interceptors don't run. For most tests, use an in-process server. For tests
that must cover the wire protocol, run a full HTTP server.

## Testing with an in-process server

To exercise the full RPC path without binding a port, use the in-process
transport from `connectrpc.com/connect/v2/connectinprocess`. It dispatches
RPCs directly to a `connect.Server` without any networking. It sets up the
context and runs the same interceptor and error paths as a network
transport:

```go
func TestGreetService(t *testing.T) {
	server := connect.NewServer()
	greetv1connect.RegisterGreetServiceHandler(server, &GreetServer{})

	client := greetv1connect.NewGreetServiceClient(
		connect.NewClient(connectinprocess.New(server)),
	)

	res, err := client.Greet(t.Context(), &greetv1.GreetRequest{Name: "Jane"})
	if err != nil {
		t.Fatalf("Greet: %v", err)
	}
	if got, want := res.GetGreeting(), "Hello, Jane!"; got != want {
		t.Errorf("Greeting = %q, want %q", got, want)
	}
}
```

Streaming RPCs work the same way, using the generated stream types.

By default, messages are deep-copied between the client and the server with
`connectinprocess.ProtoCopy`, so tests behave like a network transport even
when a handler mutates its request. Use `connectinprocess.WithCopyFunc` to
override the copy strategy.

The in-process transport isn't limited to tests. It's also useful in
production for delegating calls between services running in the same process.
Learn more in the [in-process transport](/docs/go/in-process-transport/)
documentation.

## Testing with a running server

Running a full HTTP server gives you behavior that is closest to a real
deployment. Use this approach for tests that must cover the wire protocol,
such as custom codecs, compression, or h2c configuration. Mount the server on
an `httptest.Server` and point a `connecthttp` transport at it:

```go
func TestGreetServiceHTTP(t *testing.T) {
	server := connect.NewServer()
	greetv1connect.RegisterGreetServiceHandler(server, &GreetServer{})
	mux := http.NewServeMux()
	connecthttp.Mount(mux, server)
	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := greetv1connect.NewGreetServiceClient(
		connect.NewClient(connecthttp.NewTransport(ts.Client(), ts.URL)),
	)

	res, err := client.Greet(t.Context(), &greetv1.GreetRequest{Name: "Jane"})
	if err != nil {
		t.Fatalf("Greet: %v", err)
	}
	if got, want := res.GetGreeting(), "Hello, Jane!"; got != want {
		t.Errorf("Greeting = %q, want %q", got, want)
	}
}
```
