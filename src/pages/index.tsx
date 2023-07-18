import React from "react";
import Callout from "../components/home/Callout";
import Features from "../components/home/Features";
import Guides from "../components/home/Guides";
import Hero from "../components/home/Hero";
import { ThemeClassNames, useKeyboardNavigation } from "@docusaurus/theme-common/internal";
import AnnouncementBar from "@theme/AnnouncementBar";
import Footer from "@theme/Footer";
import LayoutProviders from "@theme/Layout/Provider";
import SkipToContent from "@theme/SkipToContent";
import clsx from "clsx";
import styles from "./styles.module.css";

import NavBar from "@theme/Navbar";
import { Divider } from "../components/home/divider";
import { Examples } from "../components/home/examples";
import { useMediaQuery } from "@react-hookz/web";
import { NewsletterForm } from "@site/src/components/home/newsletter-form";

import { callout } from "@site/src/components/home/text";
import calloutStyles from "../components/home/Callout.module.css";

export default function Home(): JSX.Element {
  useKeyboardNavigation();

  // Largely copied from original Layout component
  return (
    <LayoutProviders>
      <SkipToContent />
      <AnnouncementBar />
      <NavBar />

      <div className={clsx(ThemeClassNames.wrapper.main, styles.wrapper)}>
        <Hero />
      </div>
      <div className={styles.gradient}>
        <Examples />
        <Features />
        <div className={styles.buttons}>
          <a href={callout.button.href} className={calloutStyles.button}>
            {callout.button.text}
          </a>
        </div>
        <div className="container">
          <Divider />
        </div>
        <Guides />
        <NewsletterForm />
      </div>
      <div className={clsx(styles.footerBackground)}>
        <div className={clsx(styles.moreInfo, "container")}>
          <Callout />
          <CommunityLinks />
        </div>
        <Footer />
      </div>
    </LayoutProviders>
  );
}

const CommunityLinks = () => {
  const isSmall = useMediaQuery("screen and (max-width: 650px)");
  const divider = <Divider style={{ margin: "0 30px", display: isSmall ? undefined : "none" }} />;
  return (
    <div className={styles.communityLinks}>
      <CommunityLinkItem text="Our slack" href="https://buf.build/links/slack" />
      {divider}
      <CommunityLinkItem
        text="Github"
        href="https://github.com/search?q=org%3Abufbuild+connect&type=Repositories"
      />
      {divider}
      <CommunityLinkItem text="Twitter" href="https://twitter.com/bufbuild" />
    </div>
  );
};

const CommunityLinkItem: React.FC<{ text: string; href: string }> = ({ text, href }) => {
  return (
    <a className={clsx(styles.goto, styles.communityLinkItem)} href={href}>
      <span className={styles.gotoText}>{text}</span>
      <span>&#8599;</span>
    </a>
  );
};
