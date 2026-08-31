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

// Remark plugin that validates reference-style links in Markdown: finds
// `[text][ref]` usages and `[ref]: url` definitions, then warns about any
// references that are used but never defined. Originally ported from the
// protovalidate.com docs site.

// Matches reference-style link usages like `[label][ref-name]`.
const REFERENCE_LINK_RE = /\[[^\]]+\]\[([^\]]+)\]/g;

// Matches reference-style link definitions like `[ref-name]: url`.
const DEFINITION_RE = /^\[([^\]]+)\]:\s/gm;

export function checkReferenceLinks(markdown: string): {
  missing: Set<string>;
  unused: Set<string>;
} {
  const needed = new Set<string>();
  const defined = new Set<string>();

  const refRe = new RegExp(REFERENCE_LINK_RE.source, "g");
  for (const m of markdown.matchAll(refRe)) {
    needed.add(m[1]);
  }

  const defRe = new RegExp(DEFINITION_RE.source, "gm");
  for (const m of markdown.matchAll(defRe)) {
    defined.add(m[1]);
  }

  const missing = new Set([...needed].filter((n) => !defined.has(n)));
  const unused = new Set([...defined].filter((d) => !needed.has(d)));

  return { missing, unused };
}

export function remarkLinkChecker() {
  return (
    _tree: unknown,
    file: { value: string; path?: string; history?: string[] }
  ) => {
    if (!file.value || typeof file.value !== "string") return;

    const { missing } = checkReferenceLinks(file.value);
    if (missing.size > 0) {
      const path = file.path ?? file.history?.[0] ?? "unknown";
      console.warn(
        `[remark-link-checker] ${path} has undefined reference links: ${[...missing].join(", ")}`
      );
    }
  };
}
