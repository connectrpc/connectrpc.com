# 007: gRPC reflection for ECMAScript

This RFC proposes adding an ancillary ECMAScript project to the Connect GitHub organization:

* `@connectrpc/grpcreflect`, which provides gRPC reflection server implementation for Connect-ES services.

## gRPC Reflection

gRPC reflection is used by tools like [buf curl][buf-curl], [grpcui], and [grpcurl] can call RPC without the a copy of the schema.

Connect already offers [`connectrpc.com/grpcreflect`][grpcreflect-go] for Go services, which adds support for gRPC's server reflection APIs. To provide feature parity for ECMAScript developers, we propose creating a Connect-ES reflection package. This package will expose a way to register gRPC reflection service.

[buf-curl]: https://buf.build/docs/reference/cli/buf/curl/
[protovalidate]: https://github.com/bufbuild/protovalidate
[grpcreflect-go]: https://github.com/connectrpc/grpcreflect-go
[grpcui]: https://github.com/fullstorydev/grpcui
[grpcurl]: https://github.com/fullstorydev/grpcurl
