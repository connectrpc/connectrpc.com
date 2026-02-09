// Copyright 2021-2025 The Connect Authors
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

import Link from "@docusaurus/Link";

/// Types

// Buttons in the hero
type HeroButtonColor = "white" | "primary";

export type HeroButtonProps = {
  text: string;
  link: string;
  color: HeroButtonColor;
};

// The big colorful bar midway down the page
export type Callout = {
  text: string;
  button: {
    text: string;
    href: string;
  };
};

// The features section
export type FeatureItem = {
  title: string;
  description: JSX.Element;
};

// Guide link cards
export type GuideProps = {
  title: string;
  description?: string;
  logos: string[];
  enabled: boolean;
  href: string;
};

/// Front page hero
export const tagline = <>Simple, reliable, interoperable.</>;

export const subTagline = <>Protobuf RPC that works.</>;

export const description = (
  <>
    Connect is a family of libraries for building browser and gRPC-compatible
    APIs. If you&apos;re tired of hand-written boilerplate and turned off by
    massive frameworks, Connect is for you.
  </>
);

// This file houses most of the "variable" text on the site
export const callout: Callout = {
  text: "Simple, reliable, Protobuf-powered APIs",
  button: {
    text: "Learn more",
    href: "/docs/introduction",
  },
};

export const featureList: FeatureItem[] = [
  {
    title: "Production-grade simplicity",
    description: (
      <>
        Connect shines in production. Implementations are focused &mdash; a few
        thousand lines of code, a handful of essential options, and a
        cURL-friendly protocol &mdash; which makes them stable, predictable, and
        debuggable.
      </>
    ),
  },
  {
    title: "Compatible with gRPC",
    description: (
      <>
        In addition to its own protocol, Connect servers and backend clients
        also support gRPC &mdash; including streaming! They interoperate
        seamlessly with Envoy, grpcurl, gRPC Gateway, and every other gRPC
        implementation. Connect servers handle gRPC-Web requests natively,
        without a translating proxy.
      </>
    ),
  },
  {
    title: "Familiar primitives",
    description: (
      <>
        Connect builds on primitives you already know. Go handlers slot right
        into your <code>net/http</code> server and work with your existing
        middleware, router, and observability. TypeScript clients stay close to
        the <code>fetch</code> API and integrate cleanly with popular UI
        frameworks.
      </>
    ),
  },
  {
    title: "No boilerplate",
    description: (
      <>
        Define your APIs using{" "}
        <Link to="https://developers.google.com/protocol-buffers">
          Protocol Buffers
        </Link>
        , the industry&apos;s most battle-tested schema definition language, and
        skip the hand-written boilerplate. Connect handles server-side routing,
        serialization, and compression, and it generates idiomatic clients in
        Go, TypeScript, Swift, and Kotlin.
      </>
    ),
  },
];
