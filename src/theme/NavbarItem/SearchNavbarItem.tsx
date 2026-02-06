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

import type { Props } from "@theme/NavbarItem/SearchNavbarItem";
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
export default function SearchNavbarItem({
  mobile,
}: Props): JSX.Element | null {
  if (mobile) {
    return null;
  }

  return <SearchBar />;
}
