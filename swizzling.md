Docusaurus swizzling
====================

## Custom theme components

The Connect site uses [swizzling] to customize several [Docusaurus][docusaurus]
components:

- [Front page navbar](./src/theme/HomeNavbar)
- [Front page navbar item](./src/theme/HomeNavbarItem)
- [Docs navbar item](./src/theme/NavbarItem)
- [Footer](./src/theme/Footer)
- [Search bar](./src/theme/SearchBar.tsx)
- [CodeBlock](./src/theme/CodeBlock)
- [DocSidebar/Desktop/Content](./src/theme/DocSidebar/Desktop/Content)
- [DocSidebarItem/Category](./src/theme/DocSidebarItem)
- [NavBar/Content](./src/theme/NavBar/Content)
- [NavBar/Layout](./src/theme/NavBar/Layout)
- [NavBar/MobileSidebar](./src/theme/NavBar/MobileSidebar)

To swizzle more components, run `npm run swizzle -- @docusaurus/theme-classic
--typescript` and select component you want to modify

## What lives where

In general, the site follows the standard Docusaurus structure, with swizzled
components in [`src/theme`](./src/theme) and fully custom components in
[`src/components`](./src/components). Some additional things to be aware of:

- The core logic for the front page is in
  [`src/pages/index.tsx`](./src/pages/index.tsx)
- Components specific to the front page are in
  [`src/components/home`](./src/components/home)
- All text for the front page is defined in
  [`src/components/home/text.tsx`](./src/components/home/text.tsx)

[docusaurus]: https://docusaurus.io
[swizzling]: https://docusaurus.io/docs/swizzling

