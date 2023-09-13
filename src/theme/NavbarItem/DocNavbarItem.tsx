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

/**
 * This file is a swizzled and wrapped component, generated and adapted from the
 * docusaurus source code, copyright of Facebook, Inc.
 *
 * The adapted content is licensed under the MIT licence; and the licence can be
 * found at https://github.com/facebook/docusaurus/blob/master/LICENSE
 *
 * To learn more about component swizzling, see:
 * https://docusaurus.io/docs/using-themes#wrapping-theme-components
 *
 * For original sources see:
 * https://github.com/facebook/docusaurus/tree/v2.0.0-beta.17/packages/docusaurus-theme-classic/src/theme/NavbarItem/DocNavbarItem.tsx
 */
import {
  useActiveDocContext,
  useLatestVersion,
} from "@docusaurus/plugin-content-docs/client";
import { uniq, useDocsPreferredVersion } from "@docusaurus/theme-common";
import DefaultNavbarItem from "@theme/NavbarItem/DefaultNavbarItem";
import { getInfimaActiveClassName } from "./utils";
import clsx from "clsx";
import React from "react";

import type { Props } from "@theme/NavbarItem/DocNavbarItem";
import type { GlobalVersion } from "@docusaurus/plugin-content-docs/client";

function getDocInVersions(versions: GlobalVersion[], docId: string) {
  const allDocs = versions.flatMap((version) => version.docs);
  const doc = allDocs.find((versionDoc) => versionDoc.id === docId);
  if (!doc) {
    const docIds = allDocs.map((versionDoc) => versionDoc.id).join("\n- ");
    throw new Error(
      `DocNavbarItem: couldn't find any doc with id "${docId}" in version${
        versions.length ? "s" : ""
      } ${versions.map((version) => version.name).join(", ")}".
Available doc ids are:\n- ${docIds}`,
    );
  }
  return doc;
}

export default function DocNavbarItem({
  docId,
  label: staticLabel,
  docsPluginId,
  ...props
}: Props): JSX.Element {
  const { activeVersion, activeDoc } = useActiveDocContext(docsPluginId);
  const { preferredVersion } = useDocsPreferredVersion(docsPluginId);
  const latestVersion = useLatestVersion(docsPluginId);

  // Versions used to look for the doc to link to, ordered + no duplicate
  const versions = uniq(
    [activeVersion, preferredVersion, latestVersion].filter(
      Boolean,
    ) as GlobalVersion[],
  );
  const doc = getDocInVersions(versions, docId);
  const activeDocInfimaClassName = getInfimaActiveClassName(props.mobile);

  return (
    <DefaultNavbarItem
      exact
      {...props}
      className={clsx(props.className, {
        [activeDocInfimaClassName]:
          activeDoc?.sidebar && activeDoc.sidebar === doc.sidebar,
      })}
      activeClassName={activeDocInfimaClassName}
      label={staticLabel ?? doc.id}
      to={doc.path}
    />
  );
}
