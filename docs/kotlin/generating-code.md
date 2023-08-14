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
file inputs and generate various outputs (`.kt` files in this case).
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
  - plugin: buf.build/bufbuild/connect-kotlin
    out: generated
  - plugin: buf.build/protocolbuffers/java
    out: generated
```

This file specifies that the [Connect-Kotlin plugin][connect-kotlin-plugin]
outputs should be placed in the `generated` directory.
This plugin is responsible for generating
`.kt` files which contain Kotlin interfaces and their
corresponding implementations from the defined `service` and `rpc` types in
Protobuf files.

The config also includes the [`protocolbuffers/java` plugin][java-protobuf-plugin] with
another set of options that place its `.java` outputs
in the same `generated` directory. This plugin
generates models from Protobuf types such as `message` and `enum`.

Together, the two plugins generate all the needed code.



> Details on configuring plugins in `buf.gen.yaml` may be found in
> [the documentation][remote-plugins], and the full list of
> available remote plugins are found [here][available-plugins].

With these configuration files in place, to generate code execute the following
command:

```bash
buf generate
```

Given the above config and example `eliza.proto` file, there should now be some
generated files in the `generated` directory:

```
generated
└── buf
    └── connect
        └── demo
            └── eliza
                └── v1
                    ├── ConverseRequest.java
                    ├── ConverseRequestOrBuilder.java
                    ├── ConverseResponse.java
                    ├── ConverseResponseOrBuilder.java
                    ├── ElizaProto.java
                    ├── ElizaServiceClient.kt
                    ├── ElizaServiceClientInterface.kt
                    ├── IntroduceRequest.java
                    ├── IntroduceRequestOrBuilder.java
                    ├── IntroduceResponse.java
                    ├── IntroduceResponseOrBuilder.java
                    ├── SayRequest.java
                    ├── SayRequestOrBuilder.java
                    ├── SayResponse.java
                    └── SayResponseOrBuilder.java
```

## Using generated code

Generate directly into a specified directory for a Gradle project.

The generated code depends on both the `Connect` and Google Java protobuf libraries.
Add these dependencies through following
[these steps in the Getting started tutorial](./getting-started.md).

For guidance on how to call the generated code, see the
[documentation for using clients](./using-clients.md).

## Generation options

The following generation options can be combined in the `opt` field of the `buf.gen.yaml` file to customize outputs:

| **Option**                 | **Type** | **Default** | **Repeatable** | **Details**                                     |
|----------------------------|:--------:|:-----------:|:--------------:|-------------------------------------------------|
| `generateCallbackMethods`  | Boolean  |   `false`   |       No       | Generate callback signatures for unary methods. |
| `generateCoroutineMethods` | Boolean  |   `true`    |       No       | Generate suspend signatures for unary methods.  |


[available-plugins]: https://buf.build/plugins
[buf]: https://buf.build/docs/
[buf.gen.yaml]: https://buf.build/docs/configuration/v1/buf-gen-yaml
[buf.yaml]: https://buf.build/docs/configuration/v1/buf-yaml
[buf-cli]: https://buf.build/docs/installation
[connect-kotlin]: https://github.com/bufbuild/connect-kotlin
[connect-kotlin-plugin]: https://buf.build/bufbuild/connect-kotlin
[java-protobuf-plugin]: https://buf.build/protocolbuffers/java
[protobuf]: https://developers.google.com/protocol-buffers
[remote-plugins]: https://buf.build/docs/bsr/remote-plugins/usage
