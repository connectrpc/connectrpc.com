---
title: Interceptors
sidebar_position: 5
---

Interceptors are a powerful way to observe and mutate outbound and inbound
headers, data, trailers, and errors both for unary APIs and streams.

An interceptor is instantiated **once for each request** and provides a set of
closures that are invoked by the client during the lifecycle of that request.
Each closure provides the ability for the interceptor to observe and store
state, as well as the option to mutate the outbound or inbound content.

For example, here is an interceptor that adds an `Authorization` header to
all outbound requests that are destined for the `demo.connect.build` host:

```swift
import Connect

/// Interceptor that adds an `Authorization` header to outbound
/// requests to `demo.connect.build`.
final class ExampleAuthInterceptor: Interceptor {
    init(config: ProtocolClientConfig) {}

    func unaryFunction() -> UnaryFunction {
        return UnaryFunction(
            requestFunction: { request in
                if request.url.host != "demo.connect.build" {
                    return request
                }

                var headers = request.headers
                headers["Authorization"] = ["SOME_USER_TOKEN"]
                return HTTPRequest(
                    url: request.url,
                    contentType: request.contentType,
                    headers: headers,
                    message: request.message
                )
            },
            responseFunction: { $0 }, // Return the response as-is
            responseMetricsFunction: { $0 } // Can be used to observe metrics
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
        host: "https://demo.connect.build",
        networkProtocol: .connect,
        codec: ProtoCodec(),
        //highlight-next-line
        interceptors: [ExampleAuthInterceptor.init]
    )
)
```

The client will then invoke each interceptor in FIFO order on the request
path, and in LIFO order on the response path.

For example, if the following interceptors are registered:

```swift
InterceptorsOption(interceptors: [A.init, B.init, C.init, D.init])
```

They'll be created each time a request is initiated by the client, then
invoked in the following order:

```
Client -> A -> B -> C -> D -> Server
Client <- D <- C <- B <- A <- Server
```
