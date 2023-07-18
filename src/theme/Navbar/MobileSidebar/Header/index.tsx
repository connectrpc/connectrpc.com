import React from "react";
import NavbarColorModeToggle from "@theme/Navbar/ColorModeToggle";
import IconClose from "@theme/Icon/Close";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import styles from "./styles.module.css";

function CloseButton() {
  const mobileSidebar = useNavbarMobileSidebar();
  return (
    <button
      type="button"
      className="clean-btn navbar-sidebar__close"
      onClick={() => mobileSidebar.toggle()}
    >
      <IconClose color="var(--ifm-color-emphasis-600)" />
    </button>
  );
}

export default function NavbarMobileSidebarHeader() {
  return (
    <div className="navbar-sidebar__brand" style={{
      boxShadow: 'none'
    }}>
      <div className={styles.menuTitle}>Menu</div>
      <NavbarColorModeToggle className="margin-right--md" />
      <CloseButton />
    </div>
  );
}
