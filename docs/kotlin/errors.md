---
title: Errors
sidebar_position: 5
---

Connect-Kotlin uses a set of [16 error codes](../protocol.md#error-codes).
These are similar to the "404 Not Found" and
"500 Internal Server Error" HTTP status codes that are more familiar.

In the [Connect protocol](../protocol.md), an error is
always represented as JSON on the wire. For example:

```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
    "code": "invalid_argument",
    "message": "sentence cannot be empty"
}
```

Connect-Kotlin provides a common [`ConnectException`][connect-exception-source] type
that represents errors consistently across all supported protocols.

`ResponseMessage` failure values returned by unary API calls expose a
`cause` and streaming APIs throw a ConnectException if an error
occurs while reading from the `responseChannel`:

```kotlin
val request = SayRequest(sentence = sentence)
val response = elizaClient.say(request)
response.failure {
  print(it.cause.code) // Code.INVALID_ARGUMENT
  print(it.cause.message) // "sentence cannot be empty"
  print(it.cause.metadata) // Dictionary of additional server-provided headers/trailers
}
```

## Error details

Additional strongly typed errors
[may be specified by the server in responses](../protocol.md#error-end-stream).
These are wrapped with the `google.protobuf.Any` type,
and can be unpacked using the `ConnectException.unpackedDetails()` function by
specifying the expected error message class type:

```kotlin
val request = SayRequest(sentence = sentence)
val response = elizaClient.say(request)
response.failure {
  val errorDetails = it.cause.unpackedDetails(ErrorDetail::class)
  // Work with ErrorDetail.
}
```

## Cancelation

Generated methods have the `suspend` keyword on the method signature which will cancel the underlying
request when the Kotlin coroutine context is canceled.

With the callback unary signature, the result is a canceling handler
to give control to the user to manually cancel a request:

```kotlin
val request = sayRequest { sentence = sentence }
val cancel = elizaServiceClient.say(request) { response ->
    print(response.code) // Code.CANCELED.
}
cancel()
```

[connect-exception-source]: https://github.com/connectrpc/connect-kotlin/blob/main/library/src/main/kotlin/com/connectrpc/ConnectException.kt
