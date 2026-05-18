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

import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { remarkHeadingId } from "remark-custom-heading-id";
import { remarkLinkChecker } from "./src/plugins/remark-link-checker";

const publicUrl =
  process.env.VERCEL_URL === undefined
    ? "https://connectrpc.com"
    : `https://${process.env.VERCEL_URL}`;

export default defineConfig({
  site: publicUrl,
  trailingSlash: "always",
  markdown: {
    remarkPlugins: [
      // Enables `## Heading {#custom-id}` syntax for explicit anchor IDs.
      remarkHeadingId,
      // Warns at build time about reference-style links that are used but
      // never defined (or defined but never used).
      remarkLinkChecker,
    ],
  },
  vite: {
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client"],
    },
  },
  redirects: {
    "/docs": "/docs/introduction/",
    "/docs/governance": "/docs/governance/project-governance/",
    "/docs/go": "/docs/go/getting-started/",
    "/go": "/docs/go/getting-started/",
    "/node": "/docs/node/getting-started/",
    "/docs/node": "/docs/node/getting-started/",
    "/kotlin": "/docs/kotlin/getting-started/",
    "/docs/kotlin": "/docs/kotlin/getting-started/",
    "/swift": "/docs/swift/getting-started/",
    "/docs/swift": "/docs/swift/getting-started/",
    "/web": "/docs/web/getting-started/",
    "/docs/web": "/docs/web/getting-started/",
    "/web/query": "/docs/web/query/",
    "/docs/query/getting-started":
      "https://github.com/connectrpc/connect-query-es#quickstart",
  },
  integrations: [
    react(),
    starlight({
      title: "Connect",
      description: "Simple, reliable, interoperable: Protobuf RPC that works.",
      // Disable Starlight's built-in 404 page; we use src/pages/404.astro
      // instead so we can track 404 hits via Fathom.
      disable404Route: true,
      favicon: "/img/fav@2x.png",
      logo: {
        src: "./public/img/logos/simple-connect.svg",
        alt: "Connect logo",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/connectrpc",
        },
        {
          icon: "slack",
          label: "Slack",
          href: "https://buf.build/links/slack",
        },
      ],
      components: {
        Footer: "./src/components/starlight/Footer.astro",
        Head: "./src/components/starlight/Head.astro",
        Header: "./src/components/starlight/Header.astro",
        PageFrame: "./src/components/starlight/PageFrame.astro",
        PageTitle: "./src/components/starlight/PageTitle.astro",
        Pagination: "./src/components/starlight/Pagination.astro",
        SiteTitle: "./src/components/starlight/SiteTitle.astro",
        SocialIcons: "./src/components/starlight/SocialIcons.astro",
        ThemeSelect: "./src/components/starlight/ThemeSelect.astro",
      },
      head: [
        {
          tag: "script",
          attrs: {
            src: "https://cdn.usefathom.com/script.js",
            "data-site": "BWSMOXXQ",
            "data-spa": "auto",
            defer: true,
          },
        },
      ],
      expressiveCode: {
        themes: ["github-light", "github-dark"],
      },
      customCss: [
        "@fontsource/dm-mono/400.css",
        "@fontsource/dm-mono/500.css",
        "@fontsource/work-sans/400.css",
        "./src/styles/custom.css",
      ],
      sidebar: [
        { label: "Introduction", slug: "docs/introduction" },
        {
          label: "Governance",
          collapsed: true,
          items: [
            { label: "Governance", slug: "docs/governance/project-governance" },
            { label: "Security", slug: "docs/governance/security" },
            {
              label: "RFCs",
              collapsed: true,
              items: [
                {
                  label: "002: CORS and authn for Go",
                  slug: "docs/governance/rfc/002-go-cors-authn",
                },
                {
                  label: "003: Amend Connect HTTP codes",
                  slug: "docs/governance/rfc/003-http-codes",
                },
                {
                  label: "004: Dart Implementation",
                  slug: "docs/governance/rfc/004-dart-implementation",
                },
                {
                  label: "005: Python Implementation",
                  slug: "docs/governance/rfc/005-python-implementation",
                },
                {
                  label: "006: Request validation for ECMAScript",
                  slug: "docs/governance/rfc/006-es-validation",
                },
                {
                  label: "007: Rust Implementation",
                  slug: "docs/governance/rfc/007-rust-implementation",
                },
              ],
            },
          ],
        },
        {
          label: "Connect for Go",
          collapsed: true,
          items: [
            { label: "Getting started", slug: "docs/go/getting-started" },
            { label: "Routing", slug: "docs/go/routing" },
            {
              label: "Serialization & compression",
              slug: "docs/go/serialization-and-compression",
            },
            { label: "Errors", slug: "docs/go/errors" },
            {
              label: "Headers & trailers",
              slug: "docs/go/headers-and-trailers",
            },
            { label: "Interceptors", slug: "docs/go/interceptors" },
            { label: "Observability", slug: "docs/go/observability" },
            { label: "Streaming", slug: "docs/go/streaming" },
            { label: "Deployment & h2c", slug: "docs/go/deployment" },
            {
              label: "Get Requests and Caching",
              slug: "docs/go/get-requests-and-caching",
            },
            { label: "gRPC compatibility", slug: "docs/go/grpc-compatibility" },
            { label: "Common errors", slug: "docs/go/common-errors" },
            { label: "Godoc", slug: "docs/go/godoc" },
          ],
        },
        {
          label: "Connect for Web",
          collapsed: true,
          items: [
            { label: "Getting started", slug: "docs/web/getting-started" },
            { label: "Generating code", slug: "docs/web/generating-code" },
            { label: "Using clients", slug: "docs/web/using-clients" },
            { label: "Errors", slug: "docs/web/errors" },
            {
              label: "Headers & trailers",
              slug: "docs/web/headers-and-trailers",
            },
            {
              label: "Cancellation & Timeouts",
              slug: "docs/web/cancellation-and-timeouts",
            },
            { label: "Interceptors", slug: "docs/web/interceptors" },
            {
              label: "Choosing a protocol",
              slug: "docs/web/choosing-a-protocol",
            },
            {
              label: "Supported browsers & frameworks",
              slug: "docs/web/supported-browsers-and-frameworks",
            },
            { label: "Testing", slug: "docs/web/testing" },
            {
              label: "Get Requests and Caching",
              slug: "docs/web/get-requests-and-caching",
            },
            { label: "Server-Side Rendering (SSR)", slug: "docs/web/ssr" },
            { label: "Connect for TanStack Query", slug: "docs/web/query" },
            { label: "Migrating to v2", slug: "docs/web/migrating-to-v2" },
          ],
        },
        {
          label: "Connect for Node.js",
          collapsed: true,
          items: [
            { label: "Migrating to v2", slug: "docs/node/migrating-to-v2" },
            { label: "Getting started", slug: "docs/node/getting-started" },
            {
              label: "Implementing services",
              slug: "docs/node/implementing-services",
            },
            { label: "Server plugins", slug: "docs/node/server-plugins" },
            { label: "Interceptors", slug: "docs/node/interceptors" },
            { label: "Using clients", slug: "docs/node/using-clients" },
            {
              label: "Get Requests and Caching",
              slug: "docs/node/get-requests-and-caching",
            },
            { label: "Testing", slug: "docs/node/testing" },
            { label: "Timeouts", slug: "docs/node/timeouts" },
          ],
        },
        {
          label: "Connect for Python",
          collapsed: true,
          items: [
            { label: "Getting started", slug: "docs/python/getting-started" },
            {
              label: "Serialization & compression",
              slug: "docs/python/serialization-and-compression",
            },
            { label: "Errors", slug: "docs/python/errors" },
            {
              label: "Headers & trailers",
              slug: "docs/python/headers-and-trailers",
            },
            { label: "Interceptors", slug: "docs/python/interceptors" },
            { label: "Streaming", slug: "docs/python/streaming" },
            { label: "Deployment", slug: "docs/python/deployment" },
            {
              label: "Get Requests and Caching",
              slug: "docs/python/get-requests-and-caching",
            },
            {
              label: "gRPC Compatibility",
              slug: "docs/python/grpc-compatibility",
            },
            { label: "Observability", slug: "docs/python/observability" },
            { label: "Testing", slug: "docs/python/testing" },
          ],
        },
        {
          label: "Connect for Kotlin",
          collapsed: true,
          items: [
            { label: "Getting started", slug: "docs/kotlin/getting-started" },
            { label: "Generating code", slug: "docs/kotlin/generating-code" },
            { label: "Using clients", slug: "docs/kotlin/using-clients" },
            {
              label: "Get Requests and Caching",
              slug: "docs/kotlin/get-requests-and-caching",
            },
            { label: "Errors", slug: "docs/kotlin/errors" },
            { label: "Interceptors", slug: "docs/kotlin/interceptors" },
          ],
        },
        {
          label: "Connect for Swift",
          collapsed: true,
          items: [
            { label: "Getting started", slug: "docs/swift/getting-started" },
            { label: "Generating code", slug: "docs/swift/generating-code" },
            { label: "Using clients", slug: "docs/swift/using-clients" },
            { label: "Errors", slug: "docs/swift/errors" },
            { label: "Interceptors", slug: "docs/swift/interceptors" },
            { label: "Testing & mocking", slug: "docs/swift/testing" },
          ],
        },
        {
          label: "Connect for Dart",
          collapsed: true,
          items: [
            { label: "Getting started", slug: "docs/dart/getting-started" },
            { label: "Generating code", slug: "docs/dart/generating-code" },
            { label: "Using clients", slug: "docs/dart/using-clients" },
            { label: "Errors", slug: "docs/dart/errors" },
            { label: "Interceptors", slug: "docs/dart/interceptors" },
            { label: "Testing", slug: "docs/dart/testing" },
          ],
        },
        { label: "cURL & other clients", slug: "docs/curl-and-other-clients" },
        { label: "Multi-Protocol Support", slug: "docs/multi-protocol" },
        { label: "CORS", slug: "docs/cors" },
        { label: "Connect Protocol", slug: "docs/protocol" },
        { label: "FAQs", slug: "docs/faq" },
      ],
    }),
  ],
});
