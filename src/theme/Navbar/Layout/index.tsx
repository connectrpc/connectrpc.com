// Copyright 2023 Buf Technologies, Inc.
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

import React, { ComponentProps } from "react";
import clsx from "clsx";
import NavbarMobileSidebar from "@theme/Navbar/MobileSidebar";
import {
  useThemeConfig,
  useHideableNavbar,
  useNavbarMobileSidebar,
} from "@docusaurus/theme-common/internal";
import styles from "./styles.module.css";
import { useIsScrolled } from "../../utils/use-is-scrolled";
import { useLocation } from "@docusaurus/router";
import type { Props } from "@theme/Navbar/Layout";
import { Divider } from "@site/src/components/home/divider";

function NavbarBackdrop(props: ComponentProps<"div">) {
  return (
    <div
      role="presentation"
      {...props}
      className={clsx("navbar-sidebar__backdrop", props.className)}
    />
  );
}

export default function NavbarLayout({ children }: Props): JSX.Element {
  const {
    navbar: { hideOnScroll, style },
  } = useThemeConfig();
  const mobileSidebar = useNavbarMobileSidebar();
  const { navbarRef, isNavbarVisible } = useHideableNavbar(hideOnScroll);
  const { pathname } = useLocation();
  const showBottomBorder =
    useIsScrolled({
      threshold: 50,
    }) || pathname !== "/";
  return (
    <>
      <nav
        ref={navbarRef}
        className={clsx(
          "navbar",
          "navbar--fixed-top",
          styles.hideBottomBorder,
          hideOnScroll && [
            styles.navbarHideable,
            !isNavbarVisible && styles.navbarHidden,
          ],
          {
            "navbar--dark": style === "dark",
            "navbar--primary": style === "primary",
            "navbar-sidebar--show": mobileSidebar.shown,
          },
        )}
      >
        {children}
        <NavbarBackdrop onClick={mobileSidebar.toggle} />
        <NavbarMobileSidebar />
      </nav>

      <Divider
        style={{
          position: "sticky",
          top: "85px",
          marginLeft: "var(--ifm-navbar-padding-horizontal)",
          marginRight: "var(--ifm-navbar-padding-horizontal)",
          // using display since SSR makes rendering conditional elements nasty.
          display: showBottomBorder ? undefined : "none",
        }}
      />
    </>
  );
}
