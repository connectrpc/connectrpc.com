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

import {
  splitNavbarItems,
  useNavbarMobileSidebar,
  useThemeConfig,
} from "@docusaurus/theme-common/internal";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import NavbarColorModeToggle from "@theme/Navbar/ColorModeToggle";
import NavbarLogo from "@theme/Navbar/Logo";
import NavbarMobileSidebarToggle from "@theme/Navbar/MobileSidebar/Toggle";
import NavbarSearch from "@theme/Navbar/Search";
import type { Props as NavbarItemConfig } from "@theme/NavbarItem";
import NavbarItem from "@theme/NavbarItem";
import SearchBar from "@theme/SearchBar";
import clsx from "clsx";
import React from "react";
import { CreatedBy } from "../../components/created-by";
import styles from "./styles.module.css";

function useNavbarItems() {
  // TODO temporary casting until ThemeConfig type is improved
  return useThemeConfig().navbar.items as NavbarItemConfig[];
}

function NavbarItems({ items }: { items: NavbarItemConfig[] }): JSX.Element {
  const mobileSidebar = useNavbarMobileSidebar();
  const renderedItems = items.map((item, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: static navbar items
    <NavbarItem {...item} key={i} />
  ));
  if (mobileSidebar.shouldRender) {
    return <>{renderedItems}</>;
  }
  return <div className={styles.linkList}>{renderedItems}</div>;
}

function NavbarContentLayout({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className={clsx("navbar__inner", styles.inner)}>
      <div className="navbar__items">{left}</div>
      <div className="navbar__items navbar__items--right">{right}</div>
    </div>
  );
}

export default function NavbarContent() {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();
  const [leftItems, rightItems] = splitNavbarItems(items);
  const { siteConfig } = useDocusaurusContext();

  return (
    <NavbarContentLayout
      left={
        // TODO stop hardcoding items?
        <>
          {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}

          <NavbarLogo />
          <NavbarItems items={leftItems} />
          <div className={styles.rightWrapper}>
            <NavbarColorModeToggle />
            <div className={styles.searchWrapper}>
              <NavbarSearch>
                <SearchBar {...(siteConfig.themeConfig.algolia as any)} />
              </NavbarSearch>
            </div>
            <CreatedBy className="desktop-only" />
          </div>
        </>
      }
      right=<NavbarItems items={rightItems} />
    />
  );
}
