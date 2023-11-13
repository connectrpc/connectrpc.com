---
title: CORS
sidebar_position: 985
---

# Cross-Origin Resource Sharing with Connect and gRPC-Web

CORS is a mechanism that allows servers to restrict requests from JavaScript 
running in a web browser. For example, consider a malicious web page making 
requests to an API on a different domain. Simply visiting this page could run
arbitrary actions on your behalf.

To avoid this problem, browsers ask the target for permission to issue a request,
if the request originates from somewhere else than the target. They send a
preflight request, and the server replies with CORS information. The browser 
decides whether to issue or deny the actual request, and will only expose 
response headers to JavaScript that are explicitly allowed.

Both Connect and gRPC-Web require CORS preflights for cross-origin requests.
Note that we highly recommend to use a library like [rs/cors](https://github.com/rs/cors) 
for Go to implement the logic. This document gives you the necessary information
to configure CORS appropriately using any library.


## Preflight request

Here's an example for a CORS preflight request with the Connect protocol:

```
OPTIONS /connectrpc.greet.v1.GreetService/Greet HTTP/1.1
Origin: https://connectrpc.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Connect-Protocol-Version,Content-Type
[other headers elided...]
```

Note that the browser transmits the origin, as well as the HTTP methods and 
header names of the actual request.


## Preflight response

Here is an example for a CORS preflight response for the preflight above that
allows all requests with the Connect and gRPC-Web protocols, and asks the browser
to cache the information:

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://connectrpc.com
Access-Control-Allow-Methods: POST, GET
Access-Control-Allow-Headers: Content-Type,Connect-Protocol-Version,Connect-Timeout-Ms,Grpc-Timeout,X-Grpc-Web,X-User-Agent
Access-Control-Max-Age: 7200
Vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers
[other headers elided...]
```

Let's take a look at the details:

### Allowing origins

`Access-Control-Allow-Origin: https://connectrpc.com` allows browsers to make 
requests from connectrpc.com via https with the default port 443. 


### Allowing methods and headers

`Access-Control-Allow-Methods: POST, GET` is required to support gRPC-Web and 
Connect. gRPC-Web will only use POST. Connect uses POST and optionally GET.

`Access-Control-Allow-Headers: Content-Type,Connect-Protocol-Version,Connect-Timeout-Ms,Grpc-Timeout,X-Grpc-Web,X-User-Agent`
allows all necessary headers for Connect and gRPC-Web.

> **Note:** If your application uses custom request headers, you must explicitly 
> allow them. This includes commonly used headers such as `Authorization`.


### Caching preflight responses

`Access-Control-Max-Age: 7200` lets browsers cache CORS information for longer, 
which reduces the number of preflight requests. Any changes to your CORS setup 
won't take effect until the cached data expires. Firefox caps this value at 24h, 
and modern Chrome caps it at 2h.

`Vary: Origin,Access-Control-Request-Method,Access-Control-Request-Headers` is 
used by the browser to cache CORS information based on the given header names.
To avoid poisoning intermediate caches, all request headers resulting in
conditional preflight responses must be added to the `Vary` response header.


## Actual response

Here is what an actual response will look like, after a successful preflight 
request:

```
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Expose-Headers: Grpc-Status,Grpc-Message,Grpc-Status-Details-Bin
[other headers elided...]

{"greeting": "Hello, Buf!"}
```

All three exposed headers are necessary to support gRPC-Web.

> **Note:** If your application uses custom response headers, you must explicitly
> expose them.  
> If your application uses custom response **trailers**, you must expose them with
> a `Trailer-` prefix, because Connect sends trailers for unary RPCs as headers.
> If your service sets the trailer `Bar`, the response must expose `Trailer-Bar`.


## Connect GET

For side-effect-free RPCs such as simple queries, Connect supports GET requests
that do not require CORS preflights. Browser will immediately issue the actual 
request, but there are two requirements:

1. No request headers must be set, including `Connect-Timeout-Ms` or `Grpc-Timeout`, 
   or any application-specific header.
2. The response must allow the origin, for example with the response header 
   `Access-Control-Allow-Origin: https://connectrpc.com`.

If the first requirement is not met, a preflight request is issued. If the second
requirement is not met, the request will error in the browser.


## Avoid wildcards

While many CORS headers allow a wildcard `*`, they only do for requests without 
credentials, such as cookies, TLS client certificates, or authorization headers.

We recommend to avoid wildcards, especially in a production environment. CORS 
libraries typically provide mechanism for common use cases like allowing 
multiple origins.


## Private network access

[Private network access](https://wicg.github.io/private-network-access/) is an 
addition to CORS that restricts the ability of websites to send requests to 
servers on private networks. Chrome has been the first to implement the feature. 
More information can be found in the [accompanying blog post](https://developer.chrome.com/blog/private-network-access-update/).

If your application uses private network access, you will have to set the 
preflight response header `Access-Control-Allow-Private-Network` accordingly, 
and add `Vary: Access-Control-Request-Private-Network` in case you cache CORS 
information.
