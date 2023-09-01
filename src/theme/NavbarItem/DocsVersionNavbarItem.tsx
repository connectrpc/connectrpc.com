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
 * https://github.com/facebook/docusaurus/tree/v2.0.0-beta.17/packages/docusaurus-theme-classic/src/theme/NavbarItem/DocsVersionNavbarItem.tsx
 */
import {
  GlobalVersion,
  useActiveVersion,
  useLatestVersion,
} from "@docusaurus/plugin-content-docs/client";
import { useDocsPreferredVersion } from "@docusaurus/theme-common";
import DefaultNavbarItem from "@theme/NavbarItem/DefaultNavbarItem";
import React from "react";

import type { Props } from "@theme/NavbarItem/DocsVersionNavbarItem";

/* eslint @typescript-eslint/no-non-null-assertion: "off",
  @typescript-eslint/no-unused-vars: "off" */

const getVersionMainDoc = (version: GlobalVersion) =>
  version.docs.find((doc) => doc.id === version.mainDocId)!;

export default function DocsVersionNavbarItem({
  label: staticLabel,
  to: staticTo,
  docsPluginId,
  ...props
}: Props): JSX.Element {
  const activeVersion = useActiveVersion(docsPluginId);
  const { preferredVersion } = useDocsPreferredVersion(docsPluginId);
  const latestVersion = useLatestVersion(docsPluginId);
  const version = activeVersion ?? preferredVersion ?? latestVersion;
  const label = staticLabel ?? version.label;
  const path = staticTo ?? getVersionMainDoc(version).path;
  return <DefaultNavbarItem {...props} label={label} to={path} />;
}
