# 006: Request validation for ECMAScript

This RFC proposes adding an ancillary ECMAScript project to the Connect Github organization:

* `@connectrpc/validate`, which provides request validation for Connect-ES services using Protovalidate.

## Request Validation

[Protovalidate][protovalidate] is a widely-adopted validation framework that allows developers to define validation constraints directly in their Protobuf schemas using Common Expression Language (CEL). The framework has gained significant traction across the ecosystem, with implementations available for multiple languages.

Connect already offers [`connectrpc.com/validate`][validate-go] for Go services, which provides seamless integration with Protovalidate annotations. This package allows Go developers to automatically validate requests using constraints defined in their Protobuf schemas, eliminating the need for manual validation boilerplate.

To provide feature parity for ECMAScript developers, we propose creating a Connect-ES validation package. This package will integrate with Protovalidate annotations in the same way as the Go implementation, allowing developers to leverage their existing schema-defined validation rules in their EcmaScript Connect services.

[protovalidate]: https://github.com/bufbuild/protovalidate
[validate-go]: https://github.com/connectrpc/validate-go
