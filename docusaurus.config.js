// Copyright 2022-2023 The Connect Authors
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

// @ts-check
const lightCodeTheme = require("prism-react-renderer").themes.github;
const darkCodeTheme = require("prism-react-renderer").themes.dracula;
const gaTrackingID = process.env.GOOGLE_ANALYTICS_GTAG ?? "";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Connect",
  tagline: "Simple, reliable, interoperable: Protobuf RPC that works.", // Used for description metadata
  url: "https://connectrpc.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/fav@2x.png",
  organizationName: "connectrpc",
  projectName: "connect",

  scripts: [
    {
      src: "https://cdn.usefathom.com/script.js",
      "data-site": "BWSMOXXQ",
      "data-spa": "auto",
      defer: true,
    },
  ],
  headTags: [
    // Declare some json-ld structured data
    {
      tagName: "script",
      attributes: {
        type: "application/ld+json",
      },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "WebSite",
        name: "Protobuf RPC that works",
        url: "https://connectrpc.com/",
      }),
    },
    {
      tagName: "meta",
      attributes: {
        property: "og:site_name",
        content: "Protobuf RPC that works",
      },
    },
  ],
  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} **/
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],
  plugins: [
    gaTrackingID !== ""
      ? [
          "@docusaurus/plugin-google-gtag",
          {
            trackingID: gaTrackingID,
            anonymizeIP: true,
          },
        ]
      : null,
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {
          name: "description",
          content: "Simple, reliable, interoperable: Protobuf RPC that works.",
        },
        {
          name: "og:type",
          content: "website",
        },
        {
          name: "og:image",
          content: "https://connectrpc.com/img/logos/simple-connect.svg",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:image",
          content: "https://connectrpc.com/img/logos/simple-connect.svg",
        },
        {
          name: "twitter:domain",
          content: "connectrpc.com",
        },
        {
          name: "twitter:url",
          content: "https://connectrpc.com",
        },
        {
          name: "twitter:title",
          content: "Connect",
        },
        {
          name: "twitter:description",
          content: "Simple, reliable, interoperable: Protobuf RPC that works.",
        },
      ],
      colorMode: {
        // We can re-enable later if/when we have design assets
        disableSwitch: true,
      },
      algolia: {
        appId: process.env.ALGOLIA_APP_ID || "none",
        apiKey: process.env.ALGOLIA_API_KEY || "none",
        indexName: process.env.ALGOLIA_INDEX_NAME || "none",
      },
      navbar: {
        title: "Connect",
        logo: {
          alt: "Connect logo",
          src: "img/logos/simple-connect.svg",
        },
        items: [
          { to: "/docs/introduction", label: "Docs", position: "left" },
          {
            to: "https://github.com/connectrpc",
            label: "GitHub",
            position: "left",
          },
          {
            to: "https://buf.build/links/slack",
            label: "Slack",
            position: "left",
          },
          { to: "/demo", label: "Demo", position: "left" },
        ],
      },
      footer: {
        style: "dark",
        links: [],
        copyright: `Copyright © ${
          new Date().getFullYear() != 2022 ? "2022&ndash;" : ""
        }${new Date().getFullYear()} The Connect Authors`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ["kotlin", "protobuf", "swift"],
      },
    }),
};

module.exports = config;
