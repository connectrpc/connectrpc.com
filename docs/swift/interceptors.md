---
title: Interceptors
sidebar_position: 5
---

Interceptors are a powerful way to observe and mutate outbound and inbound
headers, data, trailers, typed messages, and errors both for unary APIs and streams.

Each interceptor is instantiated **once per request or stream** and
provides a set of functions that are invoked by the client during the lifecycle
of that call. Each function allows the interceptor to observe and store
state, as well as to mutate outbound or inbound content. Interceptors have the ability to
interact with both typed messages (request messages prior to serialization and response
messages after deserialization) and raw data.

Every interceptor has the opportunity to perform asynchronous work before passing a potentially
altered value to the next interceptor in the chain. When the end of the chain is reached, the
final value is passed to the networking client, where it is sent to the server
(outbound request) or to the caller (inbound response).

Interceptors may also fail outbound requests before they are sent; subsequent
interceptors in the chain will not be invoked, and the error will be returned to the
original caller.

Interceptors receive both the current value and a closure that
should be called to resume the interceptor chain. Propagation will not continue until
this closure is invoked. Additional values may still be passed to a given interceptor even
though it has not yet continued the chain with a previous value. For example:

1. A request is sent.
2. Response headers are received, and an interceptor pauses the chain while processing them.
3. The first chunk of streamed response data is received, and the interceptor is invoked with
   this value.
4. The interceptor is expected to resume with headers first, and then with data after.

Implementations should be thread-safe (hence the `Sendable` requirements),
as functions can be invoked from different threads during the span of a request or
stream due to the asynchronous nature of other interceptors which may be present in the chain.

As an example, here is an interceptor that adds an `Authorization` header to
all outbound requests that are destined for the `demo.connectrpc.com` host:

```swift
import Connect

/// Interceptor that asynchronously fetches an auth token and then adds an `Authorization`
/// header to outbound requests to `demo.connectrpc.com`. If the token fetch fails, it rejects
/// the outbound request and returns an error to the original caller.
final class ExampleAuthInterceptor: UnaryInterceptor {
    init(config: ProtocolClientConfig) { /* Optional setup */ }

    @Sendable
    func handleUnaryRequest<Message: ProtobufMessage>(
        _ request: HTTPRequest<Message>,
        proceed: @escaping @Sendable (Result<HTTPRequest<Message>, ConnectError>) -> Void)
    {
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
                    headers: headers,
                    message: request.message,
                    trailers: request.trailers
                )))
            } else {
                // No valid token was available - reject the request and return
                // an error to the caller.
                proceed(.failure(ConnectError(
                    code: .unknown, message: "auth token fetch failed",
                    exception: nil, details: [], metadata: [:]
                )))
            }
        }
    }

    @Sendable
    func handleUnaryResponse<Message: ProtobufMessage>(
        _ response: ResponseMessage<Message>,
        proceed: @escaping @Sendable (ResponseMessage<Message>) -> Void
    ) {
        // Can be used to observe/alter the response.
        proceed(response)
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
        interceptors: [InterceptorFactory { ExampleAuthInterceptor(config: $0) }]
    )
)
```

The client will then invoke each interceptor in FIFO order on the request
path, and in LIFO order on the response path.

For example, if the following interceptors are registered:

```swift
interceptors: [
    InterceptorFactory { A(config: $0) },
    InterceptorFactory { B(config: $0) },
    InterceptorFactory { C(config: $0) },
    InterceptorFactory { D(config: $0) },
]
```

They'll be created each time a request is initiated by the client, then
invoked in the following order:

```
Client -> A -> B -> C -> D -> Server
Client <- D <- C <- B <- A <- Server
```
