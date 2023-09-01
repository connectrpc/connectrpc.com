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
 * https://github.com/facebook/docusaurus/tree/v2.0.0-beta.17/packages/docusaurus-theme-classic/src/theme/NavbarItem/NavbarNavLink.tsx
 */
import isInternalUrl from "@docusaurus/isInternalUrl";
import Link from "@docusaurus/Link";
import { isRegexpStringMatch } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import IconExternalLink from "@theme/Icon/ExternalLink";
import React from "react";

import type { Props } from "@theme/NavbarItem/NavbarNavLink";
const dropdownLinkActiveClass = "dropdown__link--active";

export default function NavbarNavLink({
  activeBasePath,
  activeBaseRegex,
  to,
  href,
  label,
  activeClassName = "",
  prependBaseUrlToHref,
  ...props
}: Props & { disabled?: boolean }): JSX.Element {
  // TODO all this seems hacky
  // {to: 'version'} should probably be forbidden, in favor of {to: '/version'}
  const toUrl = useBaseUrl(to);
  const activeBaseUrl = useBaseUrl(activeBasePath);
  const normalizedHref = useBaseUrl(href, { forcePrependBaseUrl: true });
  const isExternalLink = label && href && !isInternalUrl(href);
  const isDropdownLink = activeClassName === dropdownLinkActiveClass;

  return (
    <Link
      {...(href
        ? {
            href: props.disabled ? undefined : prependBaseUrlToHref ? normalizedHref : href
          }
        : {
            isNavLink: true,
            activeClassName: !props.className?.includes(activeClassName) ? activeClassName : "",
            to: toUrl,
            ...(activeBasePath || activeBaseRegex
              ? {
                  isActive: (_match, location) =>
                    activeBaseRegex
                      ? isRegexpStringMatch(activeBaseRegex, location.pathname)
                      : location.pathname.startsWith(activeBaseUrl)
                }
              : null)
          })}
      {...props}
    >
      {!props.disabled && isExternalLink ? (
        <>
          <span className="label">{label}</span>
          <IconExternalLink {...(isDropdownLink && { width: 12, height: 12 })} />
        </>
      ) : props.disabled ? (
        <span className="label">{label}</span>
      ) : (
        label
      )}
      {props.disabled && <span className="pill">SOON</span>}
    </Link>
  );
}
