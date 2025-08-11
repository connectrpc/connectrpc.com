# 006: Request validation for EcmaScript

This RFC proposes adding an ancillary EcmaScript project to the Connect Github organization:

* `@connectrpc/validate-es`, which provides request validation for Connect-ES services using protovalidate.

## Request Validation

[Protovalidate][protovalidate] is a widely-adopted validation framework that allows developers to define validation constraints directly in their Protobuf schemas using Common Expression Language (CEL). The framework has gained significant traction across the ecosystem, with implementations available for multiple languages.

Connect already offers [`connectrpc.com/validate`][validate-go] for Go services, which provides seamless integration with protovalidate annotations. This package allows Go developers to automatically validate requests using constraints defined in their Protobuf schemas, eliminating the need for manual validation boilerplate.

To provide feature parity for EcmaScript developers, we propose creating a Connect-ES validation package. This package will integrate with protovalidate annotations in the same way as the Go implementation, allowing developers to leverage their existing schema-defined validation rules in their EcmaScript Connect services.

[protovalidate]: https://github.com/bufbuild/protovalidate
[validate-go]: https://github.com/connectrpc/validate-go
