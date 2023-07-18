---
title: Routing
sidebar_position: 20
---

For the most part, Connect handles HTTP routes for you &mdash; everything should
just work. For debugging or more advanced configuration, this guide explains
how Connect builds routes.

## Constructing routes

Routing follows the [Connect](../protocol.md) and gRPC HTTP/2 protocols,
both of which use:

```
:method post
:path /<Package>.<Service>/<Method>
```

For example, method `Greet` of `GreetService` in Protobuf package `greet.v1`
has path `/greet.v1.GreetService/Greet`. Package, service, and method names are
case-sensitive and used exactly as they are in the Protobuf schema, and
handlers only support the GET and POST verbs. (Remember that routing is based on
Protobuf package names, not Go import paths.)

## Prefixing routes

Especially if you're serving your Connect API alongside other HTTP handlers, you
may want to prefix your RPC routes with `/api/`, `/connect/`, or something similar.
You can do this using `net/http`:

```go
api := http.NewServeMux()
api.Handle(greetv1connect.NewGreetServiceHandler(&greetServer{}))

mux := http.NewServeMux()
mux.Handle("/", newHTMLHandler())
mux.Handle("/grpc/", http.StripPrefix("/grpc", api))
http.ListenAndServe(":http", mux)
```

Most third-party routers work similarly. If you configure a prefix, be sure to
include it in the base URL you pass to your Connect clients (for example,
`https://acme.com/api/`). Unfortunately, `grpc-go` clients don't support
prefixes: if you need to support gRPC clients, don't prefix your routes!
