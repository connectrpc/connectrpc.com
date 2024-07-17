---
title: Getting started
sidebar_position: 1
---

Connect-Node is a library for serving Connect, gRPC, and gRPC-Web compatible HTTP APIs using Node.js.
It brings the Connect Protocol to Node with full TypeScript compatibility and support for all four types of remote
procedure calls: unary and the three variations of streaming.

This ten-minute walkthrough helps you create a small Connect service in Node.js.
It demonstrates what you'll be writing by hand, what Connect generates for you,
and how to call your new API.


## Prerequisites

We'll set up a project from scratch and then augment it to serve a new endpoint.

* You'll need [Node.js](https://nodejs.dev/en/download) installed - we recommend the
  most recent long-term support version (LTS).
* We'll use the package manager `npm`, but we are also compatible with `yarn` and `pnpm`.
* We'll also use [cURL](https://curl.se/). It's available from Homebrew and most Linux package
  managers.


## Project setup

Let's initialize a project with TypeScript, and install some code generation
tools:

```bash
$ mkdir connect-example
$ cd connect-example
$ npm init -y
$ npm install typescript tsx
$ npx tsc --init
$ npm install @bufbuild/buf @bufbuild/protoc-gen-es @bufbuild/protobuf @connectrpc/protoc-gen-connect-es @connectrpc/connect
```

## Define a service

First, we need to add a Protobuf file that includes our service definition. For this tutorial, we are going to construct a unary endpoint for a service that is a stripped-down implementation of ELIZA, the famous natural language processing program.

```bash
$ mkdir -p proto && touch proto/eliza.proto
```

Open up the above file and add the following service definition:

```proto
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

## Generate code

We're going to generate our code using [Buf](https://www.npmjs.com/package/@bufbuild/buf),
a modern replacement for Google's protobuf compiler. We installed Buf earlier,
but we also need a configuration file to get going. (If you'd prefer, you can
skip this section and use `protoc` instead &mdash; `protoc-gen-connect-es`
behaves like any other plugin.)

First, scaffold a basic [`buf.yaml`][buf.yaml] at the root of your repository:

```bash
$ npx buf config init
```

Then, edit `buf.yaml` to use our `proto` directory:

```yaml title=buf.yaml
version: v2
// highlight-next-line
modules:
// highlight-next-line
  - path: proto
lint:
  use:
    - DEFAULT
breaking:
  use:
    - FILE
```


Next, tell Buf how to generate code by putting this into
[`buf.gen.yaml`][buf.gen.yaml]:

```yaml
version: v2
plugins:
  - local: protoc-gen-es
    out: gen
    opt: target=ts
  - local: protoc-gen-connect-es
    out: gen
    opt: target=ts
```

With those configuration files in place, you can lint your schema and generate
code:

```bash
$ npx buf lint
$ npx buf generate
```

You should now see two generated TypeScript files:

```diff
.
├── buf.gen.yaml
├── buf.yaml
// highlight-next-line
├── gen
// highlight-next-line
│   ├── eliza_connect.ts
// highlight-next-line
│   └── eliza_pb.ts
├── node_modules
├── package-lock.json
├── package.json
├── proto
│   └── eliza.proto
└── tsconfig.json
```

Next, we are going to use these files to implement our service.


## Implement the service

We defined the `ElizaService` - now it's time to implement it, and register it
with the `ConnectRouter`. First, let's create a file where we can put the
implementation:

Create a new file `connect.ts` with the following contents:

```ts
import type { ConnectRouter } from "@connectrpc/connect";
import { ElizaService } from "./gen/eliza_connect";

export default (router: ConnectRouter) =>
  // registers connectrpc.eliza.v1.ElizaService
  router.service(ElizaService, {
    // implements rpc Say
    async say(req) {
      return {
        sentence: `You said: ${req.sentence}`
      }
    },
  });
```

That's it! There are many other alternatives to implementing a service, and you
have access to a context object for headers and trailers, but let's keep it
simple for now.


## Start a server

Connect services can be plugged into vanilla Node.js servers, [Next.js](https://nextjs.org), [Express](https://expressjs.com/),
or [Fastify](https://www.fastify.io/). We are going to use Fastify here.
Let's install it, along with our plugin for Fastify:

```bash
$ npm install fastify @connectrpc/connect-node @connectrpc/connect-fastify
```

Create a new file `server.ts` with the following contents:

```ts
import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import routes from "./connect";

async function main() {
  const server = fastify();
  await server.register(fastifyConnectPlugin, {
    routes,
  });
  server.get("/", (_, reply) => {
    reply.type("text/plain");
    reply.send("Hello World!");
  });
  await server.listen({ host: "localhost", port: 8080 });
  console.log("server is listening at", server.addresses());
}
// You can remove the main() wrapper if you set type: module in your package.json,
// and update your tsconfig.json with target: es2017 and module: es2022.
void main();
```

Congratulations. Your endpoint is ready to go! You can start your server with:

```bash
$ npx tsx server.ts
```

## Make requests

The simplest way to consume your new API is an HTTP/1.1 POST with a JSON payload.
If you have a recent version of cURL installed, it's a one-liner:

```terminal
$ curl \
  --header 'Content-Type: application/json' \
  --data '{"sentence": "I feel happy."}' \
   http://localhost:8080/connectrpc.eliza.v1.ElizaService/Say
---
{"sentence":"You said: I feel happy."}
```

You can also make requests using a Connect client. Create a new file `client.ts`
with the following contents:

```ts
import { createPromiseClient } from "@connectrpc/connect";
import { ElizaService } from "./gen/eliza_connect";
import { createConnectTransport } from "@connectrpc/connect-node";

const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
  httpVersion: "1.1"
});

async function main() {
  const client = createPromiseClient(ElizaService, transport);
  const res = await client.say({ sentence: "I feel happy." });
  console.log(res);
}
void main();
```

With your server still running in a separate terminal window, you can now run your client:

```terminal
$ npx tsx client.ts
---
SayResponse { sentence: 'You said: I feel happy.' }
```


Congratulations — you've built your first Connect service! 🎉

## From the browser

You can run the same client from a web browser, just by swapping out the
Transport:

```ts
import { createPromiseClient } from "@connectrpc/connect";
import { ElizaService } from "./gen/eliza_connect";
// highlight-next-line
import { createConnectTransport } from "@connectrpc/connect-web";

const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
// highlight-next-line
  // Not needed. Web browsers use HTTP/2 automatically.
// highlight-next-line
  // httpVersion: "1.1"
});

async function main() {
  const client = createPromiseClient(ElizaService, transport);
  const res = await client.say({ sentence: "I feel happy." });
  console.log(res);
}
void main();
```

## Use the gRPC protocol instead of the Connect protocol

On Node.js, we support three protocols:

- The gRPC protocol that is used throughout the gRPC ecosystem.
- The gRPC-Web protocol used by [grpc/grpc-web](https://github.com/grpc/grpc-web),
  allowing servers to interop with `grpc-web` frontends without the need
  for an intermediary proxy (such as Envoy).
- The new [Connect protocol](../protocol.md), a simple, HTTP-based protocol that
  works over HTTP/1.1 or HTTP/2. It takes the best portions of gRPC and gRPC-Web,
  including streaming, and packages them into a protocol that works
  equally well in browsers, monoliths, and microservices. The Connect protocol
  is what we think the gRPC protocol should be. By default, JSON- and
  binary-encoded Protobuf is supported.

So far, we have been using the `http://` scheme in our examples. We were not
using TLS (Transport Layer Security). If you want to use gRPC and browser
clients during local development, you need TLS.

Actually, that only takes a minute to set up! We will use `mkcert` to make a
certificate. If you don't have it installed yet, please run the following
commands:

```shell
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
```

If you don't use macOS or `brew`, see the [mkcert docs](https://github.com/FiloSottile/mkcert#installation)
for instructions. You can copy the last line to your `~/.zprofile` or `~/.profile`, so that
the environment variable for Node.js is set every time you open a terminal.

If you already use `mkcert`, just run `mkcert localhost 127.0.0.1 ::1` to issue a certificate
for our example server.

Let's update our `server.ts` to use this certificate:

```ts
import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import routes from "./connect";
// highlight-next-line
import { readFileSync } from "fs";

async function main() {
  const server = fastify({
    // highlight-next-line
    http2: true,
    // highlight-next-line
    https: {
      // highlight-next-line
      key: readFileSync("localhost+2-key.pem", "utf8"),
      // highlight-next-line
      cert: readFileSync("localhost+2.pem", "utf8"),
      // highlight-next-line
    }
  });
  await server.register(fastifyConnectPlugin, {
    routes,
  });
  // highlight-next-line
  await server.listen({ host: "localhost", port: 8443 });
  console.log("server is listening at", server.addresses());
}
void main();
```

That's it! After you restarted the server, you can still open
[https://localhost:8443/](https://localhost:8443/) in your browser, but along
with gRPC-Web and Connect, any gRPC client can access it too. Here's an example
using `buf curl`:

```shell
npx buf curl --protocol grpc --schema . -d '{"sentence": "I feel happy."}' \
   https://localhost:8443/connectrpc.eliza.v1.ElizaService/Say
```

In your `client.ts`, update the URL and use HTTP version `2` and you're set. It
will pick up the locally-trusted certificate authority, just like your web
browser and other apps.


## So what?

With just a few lines of hand-written code, you've built a real API server that
supports both the gRPC and Connect protocols. Unlike a hand-written REST service,
you didn't need to design a URL hierarchy, hand-write request and response
objects, or parse typed values out of query parameters. More importantly,
your users got an idiomatic, type-safe client without any extra work on your part.

[buf]: https://www.npmjs.com/package/@bufbuild/buf
[buf.gen.yaml]: https://buf.build/docs/configuration/v2/buf-gen-yaml
[buf.yaml]: https://buf.build/docs/configuration/v2/buf-yaml
[eliza-proto]: https://buf.build/connectrpc/eliza/file/main:connectrpc/eliza/v1/eliza.proto
