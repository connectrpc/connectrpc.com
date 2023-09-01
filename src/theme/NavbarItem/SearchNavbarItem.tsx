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
 * https://github.com/facebook/docusaurus/tree/v2.0.0-beta.17/packages/docusaurus-theme-classic/src/theme/NavbarItem/SearchNavbarItem.tsx
 */
import SearchBar from "@theme/SearchBar";
import React from "react";

import type { Props } from "@theme/NavbarItem/SearchNavbarItem";
export default function SearchNavbarItem({
  mobile,
}: Props): JSX.Element | null {
  if (mobile) {
    return null;
  }

  return <SearchBar />;
}
