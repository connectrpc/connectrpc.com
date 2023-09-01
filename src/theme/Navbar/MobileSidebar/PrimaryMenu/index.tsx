import React from "react";
import {
  useNavbarMobileSidebar,
  useThemeConfig,
} from "@docusaurus/theme-common/internal";
import NavbarItem from "@theme/NavbarItem";
import { CreatedBy } from "@site/src/theme/components/created-by";
import type { Props as NavbarItemConfig } from "@theme/NavbarItem";

function useNavbarItems() {
  // TODO temporary casting until ThemeConfig type is improved
  return useThemeConfig().navbar.items as NavbarItemConfig[];
} // The primary menu displays the navbar items

export default function NavbarMobilePrimaryMenu() {
  const mobileSidebar = useNavbarMobileSidebar(); // TODO how can the order be defined for mobile?
  // Should we allow providing a different list of items?

  const items = useNavbarItems();
  return (
    <>
      <ul className="menu__list">
        {items.map((item, i) => (
          <NavbarItem
            mobile
            {...item}
            onClick={() => mobileSidebar.toggle()}
            key={i}
          />
        ))}
      </ul>
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <CreatedBy />
      </div>
    </>
  );
}
