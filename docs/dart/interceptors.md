---
title: Interceptors
sidebar_position: 5
---

An interceptor can add logic to clients, similar to the decorators
or middleware you may have seen in other libraries. Interceptors may
mutate the request and response, catch errors and retry/recover, emit
logs, or do nearly anything else.

For a simple example, this interceptor logs all requests:

```dart
import 'package:connectrpc/http2.dart';
import 'package:connectrpc/connect.dart';
import 'package:connectrpc/protobuf.dart';
import 'package:connectrpc/protocol/connect.dart' as protocol;

final Interceptor logger = <I extends Object, O extends Object>(next) {
  return (req) {
    print("sending message to ${req.url}");
    return next(req);
  };
};

final transport = protocol.Transport(
  baseUrl: "https://demo.connectrpc.com",
  codec: const JsonCodec(), // Or JsonCodec()
  httpClient: createHttpClient(),
  interceptors: [
    //highlight-next-line
    logger,
  ],
);
```

You can think of interceptors like a layered onion. A request initiated
by a client goes through the outermost layer first. Each call to `next(...)`
traverses to the next layer. In the center, the actual HTTP request is
run by the transport. The response then comes back through all layers and
is returned to the client. In the array of interceptors passed to the
transport, the interceptor at the end of the array is applied first.

To intercept responses, we simply look at the return value of `next()`:

```dart
final Interceptor logger = <I extends Object, O extends Object>(next) {
  return (req) async {
    print("sending message to ${req.url}");
    final res = await next(req);
    if (res is UnaryResponse<I, O>) {
      print(res.message);
    }
    return res;
  };
};
```

For unary rpcs the request and response types are of type `UnaryRequest`
and `UnaryResponse`. For streaming rpcs the types become `StreamRequest`
and `StreamResponse`. A streaming response has not fully arrived yet
when we intercept it — we have to wrap it to see individual messages:

```dart
final Interceptor logger = <I extends Object, O extends Object>(next) {
  return (req) async {
    print("sending message to ${req.url}");
    final res = await next(req);
    if (res is StreamResponse<I, O>) {
      return StreamResponse(
        res.spec,
        res.headers,
        res.message.logEach(),
        res.trailers,
      );
    }
    return res;
  };
};

extension<T> on Stream<T> {
  Stream<T> logEach() async* {
    await for (final next in this) {
      print(next);
      yield next;
    }
  }
}
```

Interceptors are just functions, if you prefer using a class, they can be implemented as [Dart's callable objects](https://dart.dev/language/callable-objects) or using tearoffs.

```dart
class LoggingInterceptor {
  final Function(Object? any) log;

  const LoggingInterceptor(this.log);

  AnyFn<I, O> call<I extends Object, O extends Object>(AnyFn<I, O> next) {
    return (req) async {
      final res = await next(req);
      switch (res) {
        case StreamResponse<I, O>():
          return StreamResponse(
            res.spec,
            res.headers,
            _logEach(res.message),
            res.trailers,
          );
        case UnaryResponse<I, O>(message: var message):
          log(message);
          return res;
      }
    };
  }

  Stream<T> _logEach<T>(Stream<T> stream) async* {
    await for (final next in stream) {
      log(next);
      yield next;
    }
  }
}

final transport = protocol.Transport(
  baseUrl: "https://demo.connectrpc.com",
  codec: const JsonCodec(), // Or JsonCodec()
  httpClient: createHttpClient(),
  interceptors: [
    const LoggingInterceptor(print),
  ],
);
```
