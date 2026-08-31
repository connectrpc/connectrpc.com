// Copyright 2021-2026 The Connect Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const tagline = "Simple, reliable, interoperable.";
export const subTagline = "Protobuf RPC that works.";
export const description =
  "Connect is a family of libraries for building browser and gRPC-compatible APIs. If you’re tired of hand-written boilerplate and turned off by massive frameworks, Connect is for you.";

export const callout = {
  text: "Simple, reliable, Protobuf-powered APIs",
  button: {
    text: "Learn more",
    href: "/docs/introduction/",
  },
};

export interface FeatureItem {
  title: string;
  descriptionHtml: string;
}

export const featureList: FeatureItem[] = [
  {
    title: "Production-grade simplicity",
    descriptionHtml:
      "Connect shines in production. Implementations are focused &mdash; a few thousand lines of code, a handful of essential options, and a cURL-friendly protocol &mdash; which makes them stable, predictable, and debuggable.",
  },
  {
    title: "Compatible with gRPC",
    descriptionHtml:
      "In addition to its own protocol, Connect servers and backend clients also support gRPC &mdash; including streaming! They interoperate seamlessly with Envoy, grpcurl, gRPC Gateway, and every other gRPC implementation. Connect servers handle gRPC-Web requests natively, without a translating proxy.",
  },
  {
    title: "Familiar primitives",
    descriptionHtml:
      "Connect builds on primitives you already know. Go handlers slot right into your <code>net/http</code> server and work with your existing middleware, router, and observability. TypeScript clients stay close to the <code>fetch</code> API and integrate cleanly with popular UI frameworks.",
  },
  {
    title: "No boilerplate",
    descriptionHtml:
      'Define your APIs using <a href="https://developers.google.com/protocol-buffers">Protocol Buffers</a>, the industry’s most battle-tested schema definition language, and skip the hand-written boilerplate. Connect handles server-side routing, serialization, and compression, and it generates idiomatic clients in Go, TypeScript, Swift, Kotlin, Dart, and Python.',
  },
];

export interface GuideProps {
  title: string;
  description?: string;
  logos: string[];
  href: string;
}

export const guides: GuideProps[][] = [
  [
    {
      href: "/docs/go/getting-started/",
      logos: ["/img/logos/golang-blue.svg"],
      title: "Go guide",
      description: "Servers and clients",
    },
    {
      href: "/docs/node/getting-started/",
      logos: ["/img/logos/node.svg"],
      title: "Node.js guide",
      description: "Servers and clients",
    },
    {
      href: "/docs/web/getting-started/",
      logos: ["/img/logos/javascript.svg", "/img/logos/typescript.svg"],
      title: "Web guide",
      description: "Connect on the Web",
    },
  ],
  [
    {
      href: "/docs/swift/getting-started/",
      logos: ["/img/logos/swift.svg"],
      title: "iOS guide",
      description: "Swift clients available",
    },
    {
      href: "/docs/kotlin/getting-started/",
      logos: ["/img/logos/kotlin.svg"],
      title: "Android guide",
      description: "Kotlin clients available",
    },
  ],
  [
    {
      href: "/docs/dart/getting-started/",
      logos: ["/img/logos/dart.svg"],
      title: "Flutter guide",
      description: "Dart clients available",
    },
    {
      href: "/docs/python/getting-started/",
      logos: ["/img/logos/python.svg"],
      title: "Python guide",
      description: "Servers and clients",
    },
  ],
];
