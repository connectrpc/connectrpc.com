---
title: Errors
sidebar_position: 4
---

Connect-Swift uses a set of [16 error codes](../protocol.md#error-codes).
These are similar to the "404 Not Found" and
"500 Internal Server Error" HTTP status codes that you're likely familiar with.

In the [Connect protocol](../protocol.md), an error is
always represented as JSON. For example:

```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
    "code": "invalid_argument",
    "message": "sentence cannot be empty"
}
```

Connect-Swift provides a common [`ConnectError`][connect-error-source] type
that represents errors consistently across all supported protocols.

`ResponseMessage` values returned by unary API calls expose an
optional `ConnectError?`, and `StreamResult` values returned by
streaming APIs can also contain this type:

```swift
let request = SayRequest.with { $0.sentence = sentence }
let response = await elizaClient.say(request: request)
if let error = response.error {
    print(error.code) // Code.invalidArgument
    print(error.message) // "sentence cannot be empty"
    print(error.metadata) // Dictionary of additional server-provided headers/trailers
}
```

## Error details

Additional strongly typed errors
[may be specified by the server in responses](../protocol.md#error-end-stream).
These are wrapped with the `google.protobuf.Any` type on the wire,
and can be unpacked using the `ConnectError.unpackedDetails()` function by
specifying the expected error message type (`Eliza_V1_ChatError` in
this example):

```swift
let request = SayRequest.with { $0.sentence = sentence }
let response = await elizaClient.say(request: request)
if let chatErrors: [Eliza_V1_ChatError] = response.error?.unpackedDetails() {
    // Handle the custom errors
}
```

## Cancelation

Canceling an outbound request (i.e., by canceling an async `Task` or by
calling `cancel()` on a callback-based request) will result in a response
containing the `canceled` error code:

```swift
let request = SayRequest.with { $0.sentence = sentence }
let cancelable = elizaClient.say(request: request) { response in
    print(response.code) // Code.canceled
}
cancelable.cancel()
```

[connect-error-source]: https://github.com/bufbuild/connect-swift/blob/main/Libraries/Connect/Interfaces/ConnectError.swift
