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
 * https://github.com/facebook/docusaurus/tree/v2.0.0-beta.17/packages/docusaurus-theme-classic/src/theme/NavbarItem/DropdownNavbarItem.tsx
 */
import {
  Collapsible,
  isRegexpStringMatch,
  isSamePath,
  useCollapsible,
  useLocalPathname
} from "@docusaurus/theme-common/internal";
import NavbarItem from "@theme/NavbarItem";
import NavbarNavLink from "@theme/NavbarItem/NavbarNavLink";
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";

import type { DesktopOrMobileNavBarItemProps, Props } from "@theme/NavbarItem/DropdownNavbarItem";
import type { LinkLikeNavbarItemProps } from "@theme/NavbarItem";

/* eslint @typescript-eslint/no-non-null-assertion: "off",
  @typescript-eslint/no-unused-vars: "off" */

const dropdownLinkActiveClass = "dropdown__link--active";

function isItemActive(item: LinkLikeNavbarItemProps, localPathname: string): boolean {
  if (isSamePath(item.to, localPathname)) {
    return true;
  }
  if (isRegexpStringMatch(item.activeBaseRegex, localPathname)) {
    return true;
  }
  if (item.activeBasePath && localPathname.startsWith(item.activeBasePath)) {
    return true;
  }
  return false;
}

function containsActiveItems(
  items: readonly LinkLikeNavbarItemProps[],
  localPathname: string
): boolean {
  return items.some((item) => isItemActive(item, localPathname));
}

function DropdownNavbarItemDesktop({
  items,
  position,
  className,
  ...props
}: DesktopOrMobileNavBarItemProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setShowDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div
      ref={dropdownRef}
      className={clsx("navbar__item", "dropdown", "dropdown--hoverable", {
        "dropdown--right": position === "right",
        "dropdown--show": showDropdown
      })}
    >
      <NavbarNavLink
        href={props.to ? undefined : "#"}
        className={clsx("navbar__link", className)}
        {...props}
        onClick={props.to ? undefined : (e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }
        }}
        label={<>{props.children ?? props.label}</>}
      />
      <ul className="dropdown__menu">
        {items.map((childItemProps, i) => (
          <NavbarItem
            isDropdownItem
            onKeyDown={(e) => {
              if (i === items.length - 1 && e.key === "Tab") {
                e.preventDefault();
                setShowDropdown(false);
                const nextNavbarItem = dropdownRef.current!.nextElementSibling;
                if (nextNavbarItem) {
                  (nextNavbarItem as HTMLElement).focus();
                }
              }
            }}
            activeClassName={dropdownLinkActiveClass}
            {...childItemProps}
            key={i}
          />
        ))}
      </ul>
    </div>
  );
}

function DropdownNavbarItemMobile({
  items,
  className,
  position: _position, // Need to destructure position from props so that it doesn't get passed on.
  ...props
}: DesktopOrMobileNavBarItemProps) {
  const localPathname = useLocalPathname();
  const containsActive = containsActiveItems(items, localPathname);

  const { collapsed, toggleCollapsed, setCollapsed } = useCollapsible({
    initialState: () => !containsActive
  });

  // Expand/collapse if any item active after a navigation
  useEffect(() => {
    if (containsActive) {
      setCollapsed(!containsActive);
    }
  }, [localPathname, containsActive, setCollapsed]);

  return (
    <li
      className={clsx("menu__list-item", {
        "menu__list-item--collapsed": collapsed
      })}
    >
      <NavbarNavLink
        role="button"
        className={clsx("menu__link menu__link--sublist", className)}
        {...props}
        onClick={(e) => {
          e.preventDefault();
          toggleCollapsed();
        }}
      >
        {props.children ?? props.label}
      </NavbarNavLink>
      <Collapsible lazy as="ul" className="menu__list" collapsed={collapsed}>
        {items.map((childItemProps, i) => (
          <NavbarItem
            mobile
            isDropdownItem
            onClick={props.onClick}
            activeClassName="menu__link--active"
            {...childItemProps}
            key={i}
          />
        ))}
      </Collapsible>
    </li>
  );
}

export default function DropdownNavbarItem({ mobile = false, ...props }: Props): JSX.Element {
  const Comp = mobile ? DropdownNavbarItemMobile : DropdownNavbarItemDesktop;
  return <Comp {...props} />;
}
