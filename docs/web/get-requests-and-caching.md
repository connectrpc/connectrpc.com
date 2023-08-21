---
title: Get Requests and Caching
sidebar_position: 21
---

Connect supports performing idempotent, side-effect free requests using an HTTP
GET-based protocol. This makes it easier to cache certain kinds of requests in
the browser, on your CDN, or in proxies and other middleboxes.

First, configure your server to handle HTTP GET requests using Connect. Refer
to the documentation that corresponds to your server:

* [Connect Go](../go/get-requests-and-caching.md)
* [Connect Node](../node/get-requests-and-caching.md)

Afterwards, ensure that a new enough version of `@connectrpc/connect-web` is set
up; HTTP GET support is available in Connect Web v0.9.0 or newer. Then, you can
specify the `useHttpGet` option when creating the Connect transport:

```js
const transport = createConnectTransport({
  baseUrl: "https://demo.connectrpc.com",
  useHttpGet: true,
});
const client = createPromiseClient(ElizaService, transport);
const response = await client.say(request);
console.log(response);
```

Methods annotated as side-effect free will use GET requests. All other requests
will continue to use POST.
