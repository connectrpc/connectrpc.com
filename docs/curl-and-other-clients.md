---
title: cURL & other clients
sidebar_position: 970
---

Not every client has access to generated code and a full RPC framework: perhaps
you're debugging in a bare-bones environment, or perhaps your clients are using
a language or framework without good RPC bindings. Connect shines in these
circumstances: we designed the [Connect protocol](protocol.md) to make unary
RPCs work well with even the simplest HTTP/1.1 clients. (Of course, you can
also call Connect APIs using any gRPC or gRPC-Web client.)

## cURL

Connect handlers automatically support JSON. Because the Connect protocol
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

You can make the same call with HTTP GET, where the request message is encoded 
in a query parameter: 

```bash
$ curl --get --data-urlencode 'encoding=json' \
    --data-urlencode 'message={"sentence": "I feel happy."}' \
    https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say
```

You can also [visit this URL](https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say?encoding=json&message=%7b%22sentence%22%3a+%22I+feel+happy.%22%7d)
in your browser. Unary RPCs can opt in to support HTTP GET with an option.
For details, take a look at the [blog post](https://buf.build/blog/introducing-connect-cacheable-rpcs)
introducing the feature, or at the [protocol specification](./protocol.md#unary-get-request) 
for Connect.

## fetch API

We recommend `@connectrpc/connect-web` so that the compiler can type-check your code, but
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

Just like with cURL above, you can make the same call with HTTP GET:

```javascript
const url = new URL("https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say");
url.searchParams.set("encoding", "json");
url.searchParams.set("message", JSON.stringify({"sentence": "I feel happy."}));
fetch(url)
  .then(response => { return response.json() })
  .then(data => { console.log(data) })
```

## Buf Studio

If you prefer a graphical user interface to explore an API, take a look at [Buf Studio](https://buf.build/studio/connectrpc/eliza/connectrpc.eliza.v1.ElizaService/Say?target=https%3A%2F%2Fdemo.connectrpc.com&demo=true&share=s1Ks5lJQUCpOzStJzUtOVbJSUPJUSEtNzVHISCwoqNRT4qoFAA).
Buf Studio is an interactive web UI for all your Protobuf services stored on the
[Buf Schema Registry](https://buf.build/product/bsr/).

