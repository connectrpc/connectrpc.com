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
 * https://github.com/facebook/docusaurus/tree/v2.0.0-beta.3/packages/docusaurus-theme-classic/src/theme
 */
import Link from "@docusaurus/Link";
import { FooterLinkItem, useThemeConfig } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import clsx from "clsx";
import React, { PropsWithChildren } from "react";

import IconMail from "./icon-envelope--gray.svg";
import IconLinkedIn from "./icon-linkedin--gray.svg";
import IconTwitter from "./icon-twitter--gray.svg";
import styles from "./styles.module.css";

type LinkProps = {
  href?: string;
  to?: string;
};

function FooterLink(
  props: PropsWithChildren<FooterLinkItem & { className?: string; ariaLabel?: string }>
): JSX.Element {
  const linkProps: LinkProps = {};
  if (props.to) {
    linkProps.to = useBaseUrl(props.to);
  }
  if (props.href) {
    if (props.prependBaseUrlToHref) {
      linkProps.href = useBaseUrl(props.href, { forcePrependBaseUrl: true });
    } else {
      linkProps.href = props.href;
    }
  }
  return (
    <Link {...linkProps} aria-label={props.ariaLabel} className={props.className}>
      {props.children}
    </Link>
  );
}

function SocialFooterLink(props: FooterLinkItem): JSX.Element {
  let icon: JSX.Element | undefined = undefined;
  if (props.href && props.href.startsWith("mailto:")) {
    icon = <IconMail />;
  } else if (props.href && props.href.includes("twitter.com")) {
    icon = <IconTwitter />;
  } else if (props.href && props.href.includes("linkedin.com")) {
    icon = <IconLinkedIn />;
  }
  let ariaLabel: string | undefined = undefined;
  if (icon !== undefined) {
    ariaLabel = props.label;
  }
  return (
    <FooterLink {...props} ariaLabel={ariaLabel} className={styles.xx}>
      {icon || props.label || props.html}
    </FooterLink>
  );
}

function LegalFooterLink(props: FooterLinkItem): JSX.Element {
  return (
    <FooterLink {...props} className={styles.legalLink}>
      {props.label || props.html}
    </FooterLink>
  );
}

function Footer(): JSX.Element | null {
  const { footer } = useThemeConfig();
  const copyright = footer?.copyright;

  const socialLinks: FooterLinkItem[] = [
    {
      label: "Twitter",
      href: "https://twitter.com/bufbuild"
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/bufbuild"
    },
    {
      label: "Mail",
      href: "mailto:info@buf.build"
    }
  ];
  const legalLinks: FooterLinkItem[] = [
    {
      label: "Terms of use",
      to: "https://buf.build/resources/terms/"
    },
    {
      label: "Privacy policy",
      to: "https://buf.build/resources/privacy/"
    },
    {
      label: "Cookie policy",
      to: "https://buf.build/resources/cookie-policy/"
    }
  ];

  if (!footer) {
    return null;
  }

  return (
    <footer className={clsx(styles.footer, "container")}>
      <div className={styles.container}>
        <div className={styles.socialGroup}>
          {socialLinks.map((item: FooterLinkItem, index: number) => {
            return (
              <div key={index}>
                <SocialFooterLink {...item} />
              </div>
            );
          })}
        </div>

        <div className={styles.legalGroup}>
          {legalLinks.map((item: FooterLinkItem, index: number) => {
            return (
              <div key={index}>
                <LegalFooterLink {...item} />
              </div>
            );
          })}
        </div>

        <div
          className={styles.copyright}
          // Developer provided the HTML, so assume it's safe.
          // eslint-disable-next-line react/no-danger
          // ^^^ comment by FB
          dangerouslySetInnerHTML={{
            __html: copyright ?? ""
          }}
        />
      </div>
    </footer>
  );
}

export default Footer;
