# The Connect docs

This repo houses the assets used to build the website and documentation for the [Connect] project, which is built using [Docusaurus].

## Running the site

Setup:

```sh
npm install
```

To serve locally:

```sh
npm run start

# Also:
make run
```

## Publishing

The Connect site is published automatically on [Netlify]. Any time changes are pushed/merged to `main`, Netlify's CI automatically builds and deploys the most recent commit.

## Custom theme components

The Connect site uses [swizzling] to customize several Docusaurus components:

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

To swizzle more components, run `npm run swizzle -- @docusaurus/theme-classic --typescript` and select component you want to modify

## What lives where

In general, the site follows the standard Docusaurus structure, with swizzled components in [`src/theme`](./src/theme) and fully custom components in [`src/components`](./src/components). Some additional things to be aware of:

- The core logic for the front page is in [`src/pages/index.tsx`](./src/pages/index.tsx)
- Components specific to the front page are in [`src/components/home`](./src/components/home)
- All text for the front page is defined in [`src/components/home/text.tsx`](./src/components/home/text.tsx)

[connect]: https://connectrpc.com
[docusaurus]: https://docusaurus.io
[eslint]: https://eslint.org
[vercel]: https://vercel.com
[swizzling]: https://docusaurus.io/docs/swizzling

## Vendored libs

We've vendored out `crt-terminal` in order to fix a focus issue on mount. We have added the prop `focusOnMount` to the `Terminal` component.

In order to rebuild the package:

```bash
cd src/vendor/crt-terminal
npm install
npm run build
rm -rf node_modules
```
