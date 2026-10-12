---
title: Migrating to v2
---

Version 2 of connect-go is available. The key changes are:

- **Simple signatures are now the default.** The `connect.Request` and
  `connect.Response` wrappers are gone. Unary handlers and clients use plain
  Protobuf messages, and the generator's `simple` flag has been removed.
- **Transports are pluggable.** Generated code no longer depends on
  `net/http`. Servers register with `connect.NewServer` and are mounted with
  `connecthttp.Mount`. Clients wrap a `connect.Transport` created by
  `connecthttp.NewTransport`. An in-process transport,
  `connectinprocess`, makes testing fast — no listeners or loopback HTTP.
- **Interceptors are unified.** The three-method `Interceptor` interface is
  replaced by `connect.ClientInterceptor` and `connect.ServerInterceptor`
  function types that work for unary and streaming RPCs alike.
- **Error semantics are explicit.** `connect.NewError` takes a message string,
  bare errors are no longer serialized to the wire, and errors received from
  clients are marked remote.
- **Metadata moves to context.** Headers and trailers are reached through a
  `CallInfo` via `connect.NewClientContext` and
  `connect.CallInfoForServerContext`.

If you are using version 1, see our [migration
guide](https://github.com/connectrpc/connect-go/blob/main/docs/v2-migration.md)
for a complete walkthrough of every change. Version 1 remains supported: the
v1 branch continues to receive fixes and security updates, so you can migrate
at your own pace.

## Migration tool

Most of the mechanical changes can be applied automatically with the
`connect-go-v2-migrate` tool:

```shellsession
$ go install connectrpc.com/connect/v2/cmd/connect-go-v2-migrate@latest
$ connect-go-v2-migrate -w .
```

Without `-w`, the tool is a dry run that prints diffs. It unwraps the
`connect.Request` and `connect.Response` generics, converts `connect.NewError`
calls while preserving the v1 wire message, updates Buf generation templates,
and reports warnings for code that needs a manual update. When v1 generated
code is present, it first updates the Buf templates and prints the steps to
generate v2 bindings. Run it again after generation to rewrite Go call sites.
