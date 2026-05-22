---
title: Errors
---

Connect-Kotlin uses a set of [16 error codes](/docs/protocol/#error-codes).
These are similar to the "404 Not Found" and
"500 Internal Server Error" HTTP status codes that are more familiar.

In the [Connect protocol](/docs/protocol/), an error is
always represented as JSON on the wire. For example:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
    "code": "invalid_argument",
    "message": "sentence cannot be empty"
}
```

Connect-Kotlin provides a common [`ConnectException`][connect-exception-source] type
that represents errors consistently across all supported protocols.

Unary RPCs return a `ResponseMessage` whose `Failure` variant exposes a
`cause: ConnectException`. Streaming RPCs throw a `ConnectException` while
reading from the `responseChannel`.

```kotlin
val response = elizaClient.say(sayRequest { sentence = "" })
response.failure {
    print(it.cause.code)     // Code.INVALID_ARGUMENT
    print(it.cause.message)  // "sentence cannot be empty"
    print(it.cause.metadata) // Map of error metadata from the server
}
```

## Error details

Additional strongly typed errors
[may be specified by the server in responses](/docs/protocol/#error-end-stream).
These are wrapped with the `google.protobuf.Any` type,
and can be unpacked using the `ConnectException.unpackedDetails()` function by
specifying the expected error message class type:

```kotlin
val response = elizaClient.say(sayRequest { sentence = "" })
response.failure {
    val errorDetails: List<ErrorDetail> = it.cause.unpackedDetails(ErrorDetail::class)
    // Work with the matching error details.
}
```

## Cancelation

Suspending RPC methods are cancellable: cancelling the coroutine cancels the
underlying request.

Callback-based unary calls return a `Cancelable` (`() -> Unit`) you can invoke
to cancel the request:

```kotlin
val cancel = elizaServiceClient.say(sayRequest { sentence = "hello" }) { response ->
    response.failure { print(it.cause.code) } // Code.CANCELED if cancel() ran.
}
cancel()
```

[connect-exception-source]: https://github.com/connectrpc/connect-kotlin/blob/main/library/src/main/kotlin/com/connectrpc/ConnectException.kt
