---
title: Interceptors
---

Interceptors let you observe and modify outbound requests and inbound
responses for both unary and streaming RPCs.

Each interceptor is instantiated **once per request**. It exposes hooks the
client invokes at each step of the request lifecycle, where you can read or
replace the headers, body, trailers, or errors.

For example, here is an interceptor that adds an `Authorization` header to
outbound requests destined for the `demo.connectrpc.com` host. Request types
are immutable: to mutate one, use the `clone()` extension function on
`UnaryHTTPRequest` (for unary calls) or `HTTPRequest` (for streaming calls).

```kotlin
import com.connectrpc.Interceptor
import com.connectrpc.StreamFunction
import com.connectrpc.UnaryFunction
import com.connectrpc.http.clone

// Interceptor that adds an `Authorization` header to outbound
// requests to `demo.connectrpc.com`.
class AuthorizationInterceptor : Interceptor {
    override fun unaryFunction(): UnaryFunction {
        return UnaryFunction(
            requestFunction = { request ->
                if (request.url.host != "demo.connectrpc.com") {
                    return@UnaryFunction request
                }
                val headers = request.headers.toMutableMap()
                headers["Authorization"] = listOf("SOME_USER_TOKEN")
                request.clone(headers = headers)
            },
            responseFunction = { response -> response },
        )
    }

    override fun streamFunction(): StreamFunction {
        return StreamFunction(
            requestFunction = { request ->
                if (request.url.host != "demo.connectrpc.com") {
                    return@StreamFunction request
                }
                val headers = request.headers.toMutableMap()
                headers["Authorization"] = listOf("SOME_USER_TOKEN")
                request.clone(headers = headers)
            },
        )
    }
}
```

Interceptors are registered with the `ProtocolClient` on initialization. The
`interceptors` field accepts a list of factory functions; each factory
receives the `ProtocolClientConfig` and returns an interceptor instance.

```kotlin
val client = ProtocolClient(
    httpClient = ConnectOkHttpClient(OkHttpClient()),
    ProtocolClientConfig(
        host = "https://demo.connectrpc.com",
        serializationStrategy = GoogleJavaLiteProtobufStrategy(),
        networkProtocol = NetworkProtocol.CONNECT,
        interceptors = listOf({ _: ProtocolClientConfig -> AuthorizationInterceptor() }),
    ),
)
```

The client will invoke each interceptor in FIFO order on the request path, and
in LIFO order on the response path.

For example, with four interceptors `A`, `B`, `C`, `D` registered in order:

```kotlin
interceptors = listOf(
    { _: ProtocolClientConfig -> A() },
    { _: ProtocolClientConfig -> B() },
    { _: ProtocolClientConfig -> C() },
    { _: ProtocolClientConfig -> D() },
)
```

their hooks fire in this order:

```text
Client -> A -> B -> C -> D -> Server
Client <- D <- C <- B <- A <- Server
```
