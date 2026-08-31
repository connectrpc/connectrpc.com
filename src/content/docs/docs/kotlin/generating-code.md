---
title: Generating code
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

The `rpc` keyword stands for Remote Procedure Call, an API method that can be
invoked remotely. The schema is a contract between the server and client, and
it precisely defines how data is exchanged.

## Remote plugins

:::note
The example in the [tutorial](/docs/kotlin/getting-started/) covers much of this
section's content.
:::

[Protobuf plugins][available-plugins] are executables that accept `.proto`
file inputs and generate various outputs (`.kt` files in this case).
Performing generation on a remote machine makes local setup easier
and allows the generation to take place in an isolated
environment. We'll use [Buf][buf], a modern replacement for
Google's protobuf compiler, along with [remote plugins][remote-plugins].

This requires the [Buf CLI][buf-cli].

When developing a new project, two files need to be created:

- [`buf.yaml`][buf.yaml]
- [`buf.gen.yaml`][buf.gen.yaml]

The first file, `buf.yaml`, can be created by running:

```shellsession
$ buf config init
```

The second file, `buf.gen.yaml`, needs to be created manually and specifies
which plugins should be used to generate code. An example of this
file is shown below:

```yaml
version: v2
managed:
  enabled: true
plugins:
  - remote: buf.build/protocolbuffers/java:v34.0
    out: generated
    opt: lite
  - remote: buf.build/protocolbuffers/kotlin:v34.0
    out: generated
    opt: lite
  - remote: buf.build/connectrpc/kotlin:v0.8.0
    out: generated
```

[Managed mode][buf-managed-mode] applies sensible Java defaults
(one class per message, `com.` package prefix) so the `.proto` file stays
free of language-specific options.

The three plugins emit:

- The [`protocolbuffers/java` plugin][java-protobuf-plugin] generates Java
  message classes for each Protobuf `message` and `enum`. `opt: lite` selects
  the lite runtime, which produces smaller binaries (useful on Android).
- The [`protocolbuffers/kotlin` plugin][kotlin-protobuf-plugin] generates
  Kotlin DSL builders alongside the Java classes (e.g.,
  `sayRequest { sentence = "..." }`). The matching `opt: lite` keeps it
  consistent with the Java output.
- The [Connect-Kotlin plugin][connect-kotlin-plugin] generates the
  service-client interface and implementation from each `service` definition.

If you don't need the Kotlin DSL builders, you can omit the
`protocolbuffers/kotlin` plugin. If you need full Java reflection rather than
lite, drop the `opt: lite` lines and switch your dependencies to
`protobuf-java` / `connect-kotlin-google-java-ext`.

:::tip
Details on configuring plugins in `buf.gen.yaml` may be found in
[the documentation][remote-plugins], and the full list of
available remote plugins are found [here][available-plugins].
:::

With these configuration files in place, generate code by running:

```shellsession
$ buf generate
```

Given the above config and example `eliza.proto` file, there should now be some
generated files in the `generated` directory:

```text
generated
└── com
    └── connectrpc
        └── eliza
            └── v1
                ├── ElizaProto.java
                ├── ElizaProtoKt.proto.kt
                ├── ElizaServiceClient.kt
                ├── ElizaServiceClientInterface.kt
                ├── SayRequest.java
                ├── SayRequestKt.kt
                ├── SayRequestOrBuilder.java
                ├── SayResponse.java
                ├── SayResponseKt.kt
                └── SayResponseOrBuilder.java
```

The `*.java` files come from `protocolbuffers/java`, the `*Kt.kt` files from
`protocolbuffers/kotlin`, and `ElizaServiceClient*.kt` from `connectrpc/kotlin`.

## Using generated code

Point `out:` at a directory on your Gradle source set
(`src/main/java` for a single-module JVM project, or `app/src/main/java` for
a typical Android project) so the generated files are picked up automatically.

The generated code depends on the Connect-Kotlin runtime and the Google Java
Protobuf libraries. See
[Getting started → Set up Gradle](/docs/kotlin/getting-started/#set-up-gradle)
for the matching Gradle dependencies, and
[Using clients → Using generated clients](/docs/kotlin/using-clients/#using-generated-clients)
for how to call the generated client.

## Generation options

The following generation options can be combined in the `opt` field of the `buf.gen.yaml` file to customize outputs:

| **Option**                     | **Type** | **Default** | **Details**                                     |
|--------------------------------|:--------:|:-----------:|-------------------------------------------------|
| `generateCallbackMethods`      |   bool   |   `false`   | Generate callback signatures for unary methods. |
| `generateCoroutineMethods`     |   bool   |   `true`    | Generate suspend signatures for unary methods.  |
| `generateBlockingUnaryMethods` |   bool   |   `false`   | Generate blocking signatures for unary methods. |

[available-plugins]: https://buf.build/plugins
[buf]: https://buf.build/docs/
[buf.gen.yaml]: https://buf.build/docs/configuration/v2/buf-gen-yaml
[buf.yaml]: https://buf.build/docs/configuration/v2/buf-yaml
[buf-cli]: https://buf.build/docs/installation
[buf-managed-mode]: https://buf.build/docs/generate/managed-mode
[connect-kotlin-plugin]: https://buf.build/connectrpc/kotlin
[java-protobuf-plugin]: https://buf.build/protocolbuffers/java
[kotlin-protobuf-plugin]: https://buf.build/protocolbuffers/kotlin
[protobuf]: https://developers.google.com/protocol-buffers
[remote-plugins]: https://buf.build/docs/bsr/remote-plugins/usage
