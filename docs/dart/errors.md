---
title: Errors
sidebar_position: 4
---

Similar to the familiar "404 Not Found" and "500 Internal Server Error" status
codes you may have seen in HTTP, Connect uses a set of [16 error codes](/docs/protocol#error-codes).
In the Connect protocol, an error is always represented as JSON, and is easily
readable in the developer tools of your browser. For example:

```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "code": "invalid_argument",
  "message": "sentence cannot be empty"
}
```

With the gRPC/gRPC-Web protocols, errors are usually not human-readable, but
Connect provides a common type that represents errors consistently across
all supported protocols.

## Working with errors

All errors are represented by [`ConnectException`][exception], a subtype of the built-in `Exception` class. Using a try-catch block, we can catch any error that occurred during a call:

```dart
import 'package:connectrpc/connect.dart';

try {
  await client.say(SayRequest());
} catch (ex) {
  // We have to verify ex is a ConnectException
  // before using it as one.
  if (ex is ConnectException) {
    ex.code;  // Code.invalidArgument
    ex.message; // "sentence cannot be empty"
  }
  // Alternatively, we can use ConnectException.from()
  // It returns a ConnectException as is, and converts any
  // other error to a ConnectException.
  final connectEx = ConnectException.from(ex);
  connectEx.code; // Code.invalidArgument
  connectEx.message; // "sentence cannot be empty"
}
```

## Error codes

The `code` property holds one of Connect's [error codes](/docs/protocol#error-codes).
All error codes are available through the enumeration [`Code`][code].

Note that a `code` has both the integer value and string representation.

```dart
import 'package:connectrpc/connect.dart';

final code = Code.invalidArgument;
code.value; // 3
code.name; // "invalid_argument"
```

## Error messages

The `message` property contains a descriptive error message. In most cases,
the message is provided by the backend implementing the service.

## Metadata

If you catch an error, your program takes an exception from the regular code
path, but you might still want to access a header or trailer value. Connect
provides a union of header and trailer values in the `metadata` property as a
simple [`Headers`][headers] object:

```dart
ex.metadata["custom-header-value"];
ex.metadata["custom-trailer-value"];
```

## Error details

On the wire, error details are wrapped with `google.protobuf.Any`, so that a
server or middleware can attach arbitrary data to an error.

This example looks up a localized error message in the users preferred
language:

```dart
import 'package:connectrpc/connect.dart';
import "./gen/google/rpc/error_details_pb";

String getMessageForLocale(ConnectException ex, String locale) {
  final localized = LocalizedMessage();
  for (final detail in ex.details) {
    if (detail.type != localized.info_.qualifiedMessageName) {
      continue;
    }
    localized.clear();
    localized.mergeFromBuffer(detail.value);
    if (localized.locale != locale) {
      continue;
    }
    return localized.message;
  }
  return ex.message;
}
```

We are using the protobuf message [`google.rpc.LocalizedMessage`][localized-message]
in this example - run `buf generate buf.build/googleapis/googleapis` to
generate this message - but any Protobuf message can be transmitted as error
details.

[code]: https://github.com/connectrpc/connect-dart/blob/main/packages/connect/lib/src/code.dart#L22
[exception]: https://github.com/connectrpc/connect-dart/blob/main/packages/connect/lib/src/exception.dart#L30
[headers]: https://github.com/connectrpc/connect-dart/blob/886665eb38e3aad4de81665b4ab83142070c586d/packages/connect/lib/src/headers.dart#L18
[localizaed-message]: https://buf.build/googleapis/googleapis/file/main:google/rpc/error_details.proto#L241
