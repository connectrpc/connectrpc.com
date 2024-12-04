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
file inputs and generate various outputs (`.dart` files in this case).
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
buf config init
```

The second file, `buf.gen.yaml`, needs to be created manually and specifies
which plugins should be used to generate code. An example of this
file is shown below:

```yaml
version: v2
plugins:
  - remote: buf.build/connectrpc/dart
    out: lib/gen
  - remote: buf.build/protocolbuffers/dart
    out: lib/gen
    include_wkt: true
    include_imports: true
```

This file specifies that the [`connect-dart` plugin][connect-dart-plugin]
should be invoked with the options in `opt`, and that its outputs should be
placed in the `lib/gen` directory. This plugin is responsible for generating
`.connect.*.dart` files which contain Dart types derived from the
defined `service` and `rpc` types in Protobuf files.

The config also includes the [`protocolbuffers/dart` plugin][dart-protobuf-plugin] with
another set of options that place its `.pb*.dart` outputs
in the same `lib/gen` directory. This plugin
generates classes from Protobuf types such as `message` and `enum`.

Together, the two plugins generate all the code that you'll need.

> Details on configuring plugins in `buf.gen.yaml` may be found in
> [the documentation][remote-plugins], and you can browse the full list of
> available remote plugins [here][available-plugins].

With these configuration files in place, you can now generate code:

```bash
buf generate
```

Given the above config and example `eliza.proto` file, you should now see some
generated Dart files in the `lib/gen` directory:

```
lib/gen
    ├── eliza.connect.spec.dart
    ├── eliza.connect.client.dart
    ├── eliza.pb.dart
    ├── eliza.pbenum.dart
    ├── eliza.pbjson.dart
    └── eliza.pbserver.dart
```

## Local generation

The [`connect-dart`][connect-dart-plugin] plugin is a regular
Protobuf plugin which can be used with `protoc` and `buf` to generate
code locally.

The easiest way to install these plugins is to add `connectrpc` and `protobuf` as a dependency
and run:

```bash
dart pub global activate connectrpc
dart pub global activate protoc_plugin
```

The [same setup used for remote plugins above](#remote-plugins) applies to
local generation, except the `buf.gen.yaml` file should be modified to use
local plugins instead of remote plugins:

```yaml
version: v2
plugins:
  - local: protoc-gen-connect-dart # protoc-gen-connect-dart in your PATH
    out: lib/gen
  - local: protoc-gen-dart # protoc-gen-dart in your PATH
    out: lib/gen
    include_wkt: true
    include_imports: true
```

## Using generated code

For guidance on how to call the generated code, see the
[documentation for using clients](./using-clients.md).

## Generation options

The [`connect-dart`][connect-dart-plugin] plugin supports the following options
used to customize outputs. These options can be combined in the `opt` field of
the `buf.gen.yaml` file.

| **Option**         | **Type** | **Default** | **Repeatable** | **Details**                                                                                         |
| ------------------ | :------: | :---------: | :------------: | --------------------------------------------------------------------------------------------------- |
| `keep_empty_files` |   Bool   |   `false`   |       No       | Generates empty files even if there are no service definitions. Useful for build systems like Bazel |

[available-plugins]: https://buf.build/plugins
[buf]: https://buf.build/docs/
[buf.gen.yaml]: https://buf.build/docs/configuration/v2/buf-gen-yaml
[buf.yaml]: https://buf.build/docs/configuration/v2/buf-yaml
[buf-cli]: https://buf.build/docs/installation
[connect-dart]: https://github.com/connectrpc/connect-dart
[connect-dart-plugin]: https://buf.build/connectrpc/dart
[dart-protobuf-plugin]: https://buf.build/protocolbuffers/dart
[protobuf]: https://developers.google.com/protocol-buffers
[remote-plugins]: https://buf.build/docs/bsr/remote-plugins/usage
