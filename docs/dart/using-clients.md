---
title: Using clients
sidebar_position: 3
---

## Configuration

### Supported protocols

Connect-Dart currently supports 3 protocols:

- The new [Connect protocol](../protocol.md), a simple, HTTP-based protocol that
  works over HTTP/1.1 or HTTP/2. It takes the best parts of gRPC/gRPC-Web,
  including streaming, and packages them into a protocol that works well on
  all platforms, including mobile and web. JSON- and
  binary-encoded Protobuf is supported out of the box.
- The [gRPC protocol][grpc]: Allows clients to communicate with
  existing gRPC services.
- The [gRPC-Web protocol][grpc-web]: Allows clients to communicate with
  existing gRPC-Web services. The main difference between gRPC and gRPC-Web is
  that gRPC-Web does not utilize HTTP trailers in the protocol.

If your backend services are already using gRPC today,
[Envoy provides support][envoy-grpc-bridge]
for converting requests made using the Connect and gRPC-Web protocols to gRPC,
enabling you to use Connect-Swift without the SwiftNIO dependency.

Switching between the Connect and gRPC/gRPC-Web protocols is a simple 2-line change
when configuring the `Transport`:

```dart
import 'package:connectrpc/http2.dart';
import 'package:connectrpc/connect.dart';
import 'package:connectrpc/protobuf.dart';
//highlight-next-line
import 'package:connectrpc/protocol/connect.dart' as protocol;
// import 'package:connectrpc/protocol/grpc.dart' as protocol;
// import 'package:connectrpc/protocol/grpc_web.dart' as protocol;

final transport = protocol.Transport(
  baseUrl: "https://demo.connectrpc.com",
  codec: const ProtoCodec(), // Or JsonCodec()
  httpClient: createHttpClient(),
  //highlight-next-line
  // statusParser: StatusParser(), // This is required for gRPC and gRPC-Web
);
```

**Note that these options are mutually exclusive. If you'd like to use
different protocols with different APIs, create one `Transport` for each
protocol.**

### HTTP stack

Connect-Dart provides three different HTTP client implementations out of
the box.

- `dart:io` based HTTP/1 client. This supports Connect and gRPC-Web protocols.
  Full duplex Bidi streaming is not supported. Exported from `package:connectrpc/io.dart`.
- `dart:js_interop` powered and `fetch` based implementation to use on web
  platforms. It supports Connect and gRPC-Web protocols, limited to unary and server
  streaming RPCs. Exported from `package:connectrpc/web.dart`.
- `http2` package based HTTP/2 client. This supports all three protocols and all four RPC types.
  This is not available on the web platforms. Exported from `package:connectrpc/http2.dart`.

All of them export a function called `createHttpClient` that accepts options for configuring each of
them. <!-- TODO: Add link to conditonal import example here -->

## Using generated clients

Generated clients take adavantage of Dart's `Future` and `Stream` types to provide
idiomatic APIs.

```dart
import './gen/eliza.pb.dart';
import './gen/eliza.connect.client.dart';

import 'package:connectrpc/http2.dart';
import 'package:connectrpc/connect.dart';
import 'package:connectrpc/protobuf.dart';
import 'package:connectrpc/protocol/connect.dart' as protocol;

final transport = protocol.Transport(
  baseUrl: "https://demo.connectrpc.com",
  codec: const ProtoCodec(), // Or JsonCodec()
  httpClient: createHttpClient(),
);

final elizaClient = ElizaServiceClient(transport);

...

// In an async function
final response = await elizaClient.say(SayRequest(sentence: 'hello, world'));
print(response.message.sentence);
```

For server-streaming RPCs, the corresponding method on the client returns
a `Stream` object which allows the caller to iterate over updates from 
the server using the `await for`:

```dart
final stream = elizaClient.introduce(IntroduceRequest());
await for (final next in stream) {
  print(next);
}
```

For client-streaming and bidi-streaming RPCs, the corresponding method on the client
accepts a `Stream`. For bidi it also returns a stream:

```dart
final stream = elizaClient.converse(Stream.fromIterable([ConverseRequest()]));
await for (final next in stream) {
  print(next);
}
```

### Headers and Trailers

Headers can be sent using the optional `headers` parameter of client methods:

```dart
elizaClient.say(
  SayRequest(),
  headers: Headers()..['authorization'] = 'Bearer <token>',
);
```

Response headers and trailers can be accessed using the `onHeader` and `onTrailer` parameters:

```dart
elizaClient.say(
  SayRequest(),
  onHeader: (headers) {
    print(headers);
  },
  onTrailer: (trailer) {
    print(trailer);
  },
);
```

### Timeouts and Cancellation

The methods on the generated client accept an optional `signal` parameter that can be used to configure
timeouts:

```dart
final response = await elizaClient.say(
  SayRequest(),
  //highlight-next-line
  signal: TimeoutSignal(Duration(milliseconds: 200)), // Or a DeadlineSignal that accepts a DateTime
);
```

They can also accept a `CancelableSignal` that can be cancelled adhoc:

```dart
final signal = CancelableSignal();
final stream = elizaClient.introduce(
  IntroduceRequest(),
  signal: signal,
);
var count = 0;
await for (final next in stream) {
  count++;
  if (count == 5) {
    break;
  }
  print(next);
}
signal.cancel();
```

[envoy-grpc-bridge]: https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/connect_grpc_bridge_filter
[grpc]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
[grpc-web]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md
[signal]: https://github.com/connectrpc/connect-dart/blob/main/packages/connect/lib/src/abort.dart
