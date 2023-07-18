---
title: Interceptors
sidebar_position: 6
---

Interceptors are a powerful way to observe and mutate outbound and inbound
headers, data, trailers, and errors for both unary APIs and streams.

An interceptor is instantiated **once for each request** and provides a set of
closures that are invoked by the client during the lifecycle of that request.
Each closure provides the ability for the interceptor to observe and store
state, as well as the option to mutate the outbound or inbound content.

For example, here is an interceptor that adds an `Authorization` header to
all outbound requests that are destined for the `demo.connect.build` host:

```kotlin
import build.buf.connect.Interceptor
import build.buf.connect.StreamFunction
import build.buf.connect.UnaryFunction
import build.buf.connect.http.HTTPRequest

/// Interceptor that adds an `Authorization` header to outbound
/// requests to `demo.connect.build`.
class AuthorizationInterceptor : Interceptor {
  override fun unaryFunction(): UnaryFunction {
    return UnaryFunction(
      requestFunction = { request ->
        if (request.url.host != "demo.connect.build") {
          return@UnaryFunction request
        }

        val headers = mutableMapOf<String, List<String>>()
        headers.put("Authorization", listOf("SOME_USER_TOKEN"))
        return@UnaryFunction HTTPRequest(
          url = request.url,
          contentType = request.contentType,
          headers = headers,
          message = request.message
        )
      },
      responseFunction = { resp ->
        resp
      },
    )
  }

  override fun streamFunction(): StreamFunction {
    return StreamFunction(/* code */)
  }
}
```

Interceptors are registered with the `ProtocolClient` on initialization:

```kotlin
val client = ProtocolClient(
  httpClient = ConnectOkHttpClient(OkHttpClient()),
  ProtocolClientConfig(
    host = "https://demo.connect.build",
    serializationStrategy = GoogleJavaProtobufStrategy(),
    protocol = Protocol.CONNECT,
    interceptors = listOf({ AuthorizationInterceptor() })
  ),
)
```

The client will then invoke each interceptor in FIFO order on the request
path, and in LIFO order on the response path.

For example, if the following interceptors are registered:

```kotlin
val client = ProtocolClient(
  httpClient = ConnectOkHttpClient(OkHttpClient()),
  ProtocolClientConfig(
    host = host,
    serializationStrategy = GoogleJavaProtobufStrategy(),
    protocol = Protocol.CONNECT,
    interceptors = listOf({ A() }, { B() }, { C() }, { D() })
  ),
)
```

They'll be created each time a request is initiated by the client, then
invoked in the following order:

```
Client -> A -> B -> C -> D -> Server
Client <- D <- C <- B <- A <- Server
```
