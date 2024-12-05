---
title: Testing
sidebar_position: 6
---

Testing a client application can be a crucial part of ensuring its functionality
and performance. When it comes to mobile/web applications, spinning up a full server
to test against may not always be the best option. In the following sections, we
will go through a couple of alternatives.

## Widget Testing

For widgets that interface with Connect, it will generally be preferable to mock your RPCs since a backend may not be
available or desirable to access in a unit test. The easiest way to do this is via Connect's `FakeTransportBuilder`

### Mocking Transports

`FakeTransportBuilder` from `package:connectrpc/test.dart` creates an in-memory
server with your own RPC implementations. It allows you to mock a backend to cover different behaviors in your widget.

To illustrate, let's set up a very simple ELIZA service:

```dart
import 'package:connectrpc/connect.dart';
//highlight-next-line
import 'package:connectrpc/test.dart';
//highlight-next-line
import './gen/eliza.connect.spec.dart';

final fakeTransport = FakeTransportBuilder().unary(
  ElizaService.say,
  (_, __) async {
    return SayResponse(sentence: 'I feel happy.');
  },
).build();
```

It exposes four methods: `unary`, `server`, `client`, and `bidi`. All of them accept
a `Spec` type. This can be obtained from the generated `*.connect.spec.dart` files.

Under the hood, this fake transport behaves like a server.
This means that you can access request headers, raise errors with details, and also
mock streaming responses. Here is an example that raises an error on the fourth
request:

```dart
var sentences = <String>[];
final fakeTransport = FakeTransportBuilder().unary(
  ElizaService.say,
  (req, context) async {
    sentences.add(req.sentence);
    // highlight-next-line
    if (sentences.length > 3) {
      // highlight-next-line
      throw ConnectException(
        // highlight-next-line
        Code.resourceExhausted,
        // highlight-next-line
        "I have no words anymore.",
        // highlight-next-line
      );
      // highlight-next-line
    }
    // highlight-next-line
    context.responseHeaders.add("foo", "bar");
    return SayResponse(sentence: 'I feel happy.');
  },
).build();
```

You can also use expectations to assert that your client sends requests as expected:

```dart
final fakeTransport = FakeTransportBuilder().unary(
  ElizaService.say,
  (req, _) async {
    // highlight-next-line
    expect(req.sentence, "how do you feel?");
    return SayResponse(sentence: 'I feel happy.');
  },
).build();
```

The `FakeTransportBuilder` can be chained to provide mocks for multiple methods:

```dart
final fakeTransport = FakeTransportBuilder().unary(
  ElizaService.say,
  (req, _) async {
    return SayResponse(sentence: 'I feel happy.');
  },
).server(ElizaService.converse, (req, _) async* {
  yield ConverseResponse();
}).build();
```
