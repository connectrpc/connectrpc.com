---
title: cURL & other clients
sidebar_position: 30
---

Not every client has access to generated code and a full RPC framework: perhaps
you're debugging in a bare-bones environment, or perhaps your clients are using
a language or framework without good RPC bindings. Connect shines in these
circumstances: we designed the [Connect protocol](protocol.md) to make unary
RPCs work well with even the simplest HTTP/1.1 clients. (Of course, you can
also call Connect APIs using any gRPC or gRPC-Web client.)

## cURL

`connect-go` handlers automatically support JSON. Because the Connect protocol
also uses standard HTTP headers for unary RPCs, calling your API is a cURL
one-liner:

```bash
$ curl --header "Content-Type: application/json" \
    --data '{"sentence": "I feel happy."}' \
    https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say
```

The response is:

```
{"sentence": "Feeling happy? Tell me more."}
```

The demo service is live &mdash; you're welcome to give that command a try! You
can also use `--verbose` to see all the response headers or `--http1.1` to
prevent upgrading to HTTP/2.

## fetch API

We recommend `@bufbuild/connect-web` so that the compiler can type-check your code, but
browsers can easily make unary calls to Connect APIs with just the fetch
API. Right in your developer tools, try this:

```javascript
fetch("https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say", {
  "method": "POST",
  "headers": {"Content-Type": "application/json"},
  "body": JSON.stringify({"sentence": "I feel happy."})
})
  .then(response => { return response.json() })
  .then(data => { console.log(data) })
```

## Buf Studio

If you prefer a graphical user interface to explore an API, take a look at [Buf Studio](https://buf.build/studio/connectrpc/eliza/connectrpc.eliza.v1.ElizaService/Say?target=https%3A%2F%2Fdemo.connectrpc.com&demo=true&share=s1Ks5lJQUCpOzStJzUtOVbJSUPJUSEtNzVHISCwoqNRT4qoFAA).
Buf Studio is an interactive web UI for all your Protobuf services stored on the
[Buf Schema Registry](https://buf.build/product/bsr/).

