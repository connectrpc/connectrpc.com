---
title: Interceptors
sidebar_position: 5
---

Interceptors are a powerful way to observe and mutate outbound and inbound
headers, data, trailers, and errors both for unary APIs and streams.

Each interceptor is instantiated **once per request or stream** and
provides a set of closures that are invoked by the client during the lifecycle
of that call. Each closure allows the interceptor to observe and store
state, as well as to mutate outbound or inbound content.

Every interceptor has the opportunity to perform asynchronous work before passing a potentially
altered value to the next interceptor in the chain. When the end of the chain is reached, the
final value is passed to the networking client where it is sent to the server (outbound request)
or to the caller (inbound response).

Interceptors may also fail outbound requests before they're sent, thus preventing subsequent
interceptors from being invoked and returning a specified error back to the original caller.

Interceptors are closure-based and are passed both the current value and a closure which
should be called to resume the interceptor chain. Propagation will not continue until
this closure is called. Additional values may still be passed to a given interceptor even
though it has not yet continued the chain with a previous value. For example:

- A request is sent
- Response headers are received, and an interceptor pauses the chain while processing them
- First chunk of streamed data is received, and the interceptor is invoked with this value
- Interceptor is expected to resume with headers first, and then with data after

Implementations should be thread-safe (hence the `Sendable` requirement on interceptor
closures), as closures can be invoked from different threads during the span of a request or
stream due to the asynchronous nature of other interceptors which may be present in the chain.

For example, here is an interceptor that adds an `Authorization` header to
all outbound requests that are destined for the `demo.connectrpc.com` host:

```swift
import Connect

/// Interceptor that asynchronously fetches an auth token and then adds an `Authorization`
/// header to outbound requests to `demo.connectrpc.com`. If the token fetch fails, it rejects
/// the outbound request and returns an error to the original caller.
final class ExampleAuthInterceptor: Interceptor {
    init(config: ProtocolClientConfig) {}

    func unaryFunction() -> UnaryFunction {
        return UnaryFunction(
            requestFunction: { request, proceed in
                guard request.url.host == "demo.connectrpc.com" else {
                    // Allow the request to be sent as-is.
                    proceed(.success(request))
                    return
                }

                fetchUserToken(forPath: request.url.path) { token in
                    if let token = token {
                        // Alter the request's headers and pass the request on to other interceptors
                        // before eventually sending it to the server.
                        var headers = request.headers
                        headers["Authorization"] = ["Bearer \(token)"]
                        proceed(.success(HTTPRequest(
                            url: request.url,
                            contentType: request.contentType,
                            headers: headers,
                            message: request.message,
                            trailers: request.trailers
                        )))
                    } else {
                        // Reject the request since no valid token was available, and
                        // return an error to the caller.
                        proceed(.failure(ConnectError(
                            code: .unknown, message: "auth token fetch failed",
                            exception: nil, details: [], metadata: [:]
                        )))
                    }
                }
            },
            responseFunction: { response, proceed in
                // Can be used to read and/or alter the response.
                proceed(response)
            },
            responseMetricsFunction: { metrics, proceed in
                // Can be used to observe/track metrics.
                proceed(metrics)
            }
        )
    }

    func streamFunction() -> StreamFunction {
        return StreamFunction(...)
    }
}
```

Interceptors are registered with the `ProtocolClient` on initialization:

```swift
let client = ProtocolClient(
    httpClient: URLSessionHTTPClient(),
    config: ProtocolClientConfig(
        host: "https://demo.connectrpc.com",
        networkProtocol: .connect,
        codec: ProtoCodec(),
        //highlight-next-line
        interceptors: [{ ExampleAuthInterceptor(config: $0) }]
    )
)
```

The client will then invoke each interceptor in FIFO order on the request
path, and in LIFO order on the response path.

For example, if the following interceptors are registered:

```swift
interceptors: [
    { A(config: $0) },
    { B(config: $0) },
    { C(config: $0) },
    { D(config: $0) },
]
```

They'll be created each time a request is initiated by the client, then
invoked in the following order:

```
Client -> A -> B -> C -> D -> Server
Client <- D <- C <- B <- A <- Server
```
