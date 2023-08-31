---
title: Generating code
sidebar_position: 2
---

A [Protobuf][protobuf] schema is a simple file that describes a
service, its methods (APIs), and their request/response types:

```protobuf
syntax = "proto3";

package connectrpc.eliza.v1;

message SayRequest {
    string sentence = 1;
}

message SayResponse {
    string sentence = 1;
}

service ElizaService {
    rpc Say(SayRequest) returns (SayResponse) {}
}
```

A fully documented version of the above definition can be seen
[in the Buf Schema Registry](https://buf.build/connectrpc/eliza/file/main:connectrpc/eliza/v1/eliza.proto)
(BSR).

The `rpc` keyword stands for Remote Procedure Call — an API method that can be
invoked remotely. The schema is a contract between the server and client, and
it precisely defines how data is exchanged.

The schema comes to life by generating code. For the server, an interface
is generated, and the engineer can focus on filling the methods with business
logic. For the client, there really isn't anything more to do — the engineer
can simply call the client methods, rely on the generated types for
compile-time type-safety and serialization, and focus on the application logic.

## Remote plugins

> Note: The example in the [tutorial](getting-started.md) covers much of this
> section's content.

[Protobuf plugins][available-plugins] are executables that accept `.proto`
file inputs and generate various outputs (`.swift` files in this case).
Performing generation on a remote machine makes local setup easier
and allows the generation to take place in an isolated
environment. We'll use [Buf][buf], a modern replacement for
Google's protobuf compiler, along with [remote plugins][remote-plugins].

This requires installing [Buf's CLI][buf-cli]:

```bash
brew install bufbuild/buf/buf
```

When developing a new project, 2 new files need to be created:

- [`buf.yaml`][buf.yaml]
- [`buf.gen.yaml`][buf.gen.yaml]

The first file, `buf.yaml`, can be created by running:

```bash
buf mod init
```

The second file, `buf.gen.yaml`, needs to be created manually and specifies
which plugins should be used to generate code. An example of this
file is shown below:

```yaml
version: v1
plugins:
  - plugin: buf.build/connectrpc/connect-swift
    opt: >
      GenerateAsyncMethods=true,
      GenerateCallbackMethods=true,
      Visibility=Public
    out: Generated
  - plugin: buf.build/apple/swift
    opt: Visibility=Public
    out: Generated
```

This file specifies that the [Connect-Swift plugin][connect-swift-plugin]
should be invoked with the options in `opt`, and that its outputs should be
placed in the `Generated` directory. This plugin is responsible for generating
`.connect.swift` files which contain Swift protocol interfaces and their
corresponding implementations from the defined `service` and `rpc` types in
Protobuf files.

The config also includes the [`apple/swift` plugin][swift-protobuf-plugin] with
another set of options that place its `.pb.swift` outputs
in the same `Generated` directory. This plugin
generates models from Protobuf types such as `message` and `enum`.

Together, the two plugins generate all the code that you'll need.

> Details on configuring plugins in `buf.gen.yaml` may be found in
> [the documentation][remote-plugins], and you can browse the full list of
> available remote plugins [here][available-plugins].

With these configuration files in place, you can now generate code:

```bash
buf generate
```

Given the above config and example `eliza.proto` file, you should now see some
generated Swift files in the `Generated` directory:

```
Generated
    ├── eliza.connect.swift
    └── eliza.pb.swift
```

## Using generated code

You'll need to add the generated `.swift` files from the previous steps to your
project by dragging the `Generated` directory (the directory specified in
the `out` option) into Xcode.

You may want to create one or more separate Swift modules for the generated
outputs so that you can import them from the code that will use these APIs.

The generated code depends on both the `Connect` and `SwiftProtobuf` libraries.
You can add these dependencies by following
[these steps in the tutorial](./getting-started.md#add-the-connect-swift-package).

For guidance on how to call the generated code, see the
[documentation for using clients](./using-clients.md).

## Generation options

Both the [`connect-swift`][connect-swift-plugin]
and [`connect-swift-mocks`][connect-swift-mocks-plugin] plugins support a
variety of options that can be
used to customize outputs. These options can be combined in the `opt` field of
the `buf.gen.yaml` file as shown in the example above.

| **Option** | **Type** | **Default** | **Repeatable** | **Details** |
|---|:---:|:---:|:---:|---|
| `ExtraModuleImports` | String | None | Yes | Allows for specifying additional modules that generated Connect sources should import |
| `FileNaming` | String | `FullPath` | No | [Documentation](https://github.com/apple/swift-protobuf/blob/main/Documentation/PLUGIN.md#generation-option-filenaming---naming-of-generated-sources) |
| `GenerateAsyncMethods` | Bool | `true` | No | Generates RPC functions that provide Swift async/await interfaces |
| `GenerateCallbackMethods` | Bool | `false` | No | Generates RPC functions that provide closure-based callback interfaces |
| `GenerateServiceMetadata` | Bool | `true` | No | Generates metadata on client implementations, providing information on RPC paths, stream types, etc. |
| `KeepMethodCasing` | Bool | `false` | No | Generated RPC function names will match the `rpc` specified in the `.proto` file instead of being lower-camel-cased |
| `ProtoPathModuleMappings` | Custom | None | No | [Documentation](https://github.com/apple/swift-protobuf/blob/main/Documentation/PLUGIN.md#generation-option-protopathmodulemappings---swift-module-names-for-proto-paths) |
| `SwiftProtobufModuleName` | String | `SwiftProtobuf` | No | Allows for overriding the `SwiftProtobuf` module name in `import` statements. Useful if the `SwiftProtobuf` dependency is being renamed by custom build configurations |
| `Visibility` | String | `Internal` | No | [Documentation](https://github.com/apple/swift-protobuf/blob/main/Documentation/PLUGIN.md#generation-option-visibility---visibility-of-generated-types) |

[available-plugins]: https://buf.build/plugins
[buf]: https://buf.build/docs/
[buf.gen.yaml]: https://buf.build/docs/configuration/v1/buf-gen-yaml
[buf.yaml]: https://buf.build/docs/configuration/v1/buf-yaml
[buf-cli]: https://buf.build/docs/installation
[connect-swift]: https://github.com/bufbuild/connect-swift
[connect-swift-plugin]: https://buf.build/connectrpc/connect-swift
[connect-swift-mocks-plugin]: https://buf.build/connectrpc/connect-swift-mocks
[protobuf]: https://developers.google.com/protocol-buffers
[remote-plugins]: https://buf.build/docs/bsr/remote-plugins/usage
[swift-protobuf-plugin]: https://buf.build/apple/swift
