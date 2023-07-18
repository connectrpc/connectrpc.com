---
title: Common errors
sidebar_position: 18
---

This page explains how to fix common errors when using Connect from a web browser

## Access to fetch from origin has been blocked by CORS policy

The basics of CORS apply with Connect from a browser and any resource it is attempting to access.  For detailed
information, please view the [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) documentation.

However, one specific gotcha to be aware of involves a new header `Connect-Protocol-Version`.  With the
[v0.6.0 release](https://github.com/bufbuild/connect-web/releases/tag/v0.6.0) of `@bufbuild/connect-web`, this header was added to all requests sent via the
library. As a result, Connect clients that were working prior may start experiencing CORS errors upon upgrading to
`v0.6.0`.  Note that this also only affects Connect traffic.  gRPC-Web traffic is unaffected.

The fix is to update your server configuration to add this header to the allowlist.  For example, if your backend is
using the [Go CORS handler](https://github.com/rs/cors) library:

```diff
handler := cors.New(cors.Options{
    // ...
-   AllowedHeaders: []string{"X-Custom-Header"},
+   AllowedHeaders: []string{"X-Custom-Header", "Connect-Protocol-Version"},
}
```

For examples of working with a CORS setup in Connect for Node.js, see the [CORS](../node/server-plugins.md#cors) documentation.

For more information on the `Connect-Protocol-Version` header, see [this PR](https://github.com/bufbuild/connect-go/pull/416).
