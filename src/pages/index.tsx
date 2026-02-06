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
  ThemeClassNames,
  useKeyboardNavigation,
} from "@docusaurus/theme-common/internal";
import { callout } from "@site/src/components/home/text";
import AnnouncementBar from "@theme/AnnouncementBar";
import Footer from "@theme/Footer";
import LayoutProviders from "@theme/Layout/Provider";
import NavBar from "@theme/Navbar";
import SkipToContent from "@theme/SkipToContent";
import clsx from "clsx";
import Callout from "../components/home/Callout";
import calloutStyles from "../components/home/Callout.module.css";
import { Divider } from "../components/home/divider";
import { Examples } from "../components/home/examples";
import Features from "../components/home/Features";
import Guides from "../components/home/Guides";
import Hero from "../components/home/Hero";
import styles from "./styles.module.css";

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
      </div>
      <div className={clsx(styles.footerBackground)}>
        <div className={clsx(styles.moreInfo, "container")}>
          <Callout />
        </div>
        <Footer />
      </div>
    </LayoutProviders>
  );
}
