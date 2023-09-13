// Copyright 2022-2023 The Connect Authors
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

import useBaseUrl from "@docusaurus/useBaseUrl";
import { GuideProps } from "@site/src/components/home/text";
import clsx from "clsx";
import React from "react";
import { Divider } from "./divider";
import styles from "./Guides.module.css";

const Guide = ({ title, description, logos, href }: GuideProps) => {
  return (
    <div className={clsx(styles.guideCard)}>
      <div
        className={styles.titleAndIcon}
        style={{
          flexGrow: 1,
        }}
      >
        <div className={styles.logoContainer}>
          {logos.map((logo) => {
            return (
              <img
                key={logo}
                alt={title}
                src={useBaseUrl(logo)}
                className={styles.logo}
              />
            );
          })}
        </div>
        <div>
          <p className={styles.title}>{title}</p>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </div>

      <Divider
        style={{ width: "100%", marginBottom: "1.5rem", marginTop: "1.5rem" }}
      />

      <a className={styles.goto} href={href}>
        <span className={styles.gotoText}>Go to guide </span>
        <span className={styles.gotoArrow}>&#8594;</span>
      </a>
    </div>
  );
};

export default function Guides() {
  return (
    <div className={styles.guideBackground} id="guides">
      <div className="container">
        <div className={styles.guideList}>
          <Guide
            enabled
            href="/docs/go/getting-started"
            logos={["/img/logos/golang-blue.svg"]}
            title="Go guide"
            description="Servers and clients"
          />
          <Guide
            enabled
            href="/docs/node/getting-started"
            logos={["/img/logos/node.svg"]}
            title="Node.js guide"
            description="Servers and clients"
          />
          <Guide
            enabled
            href="/docs/web/getting-started"
            logos={["/img/logos/javascript.svg", "/img/logos/typescript.svg"]}
            title="Web guide"
            description="Connect on the Web"
          />
        </div>
        <div className={styles.guideList}>
          <Guide
            enabled
            href="/docs/swift/getting-started"
            logos={["/img/logos/swift.svg"]}
            title="iOS guide"
            description="Swift clients available"
          />
          <Guide
            enabled
            href="/docs/kotlin/getting-started"
            logos={["/img/logos/kotlin.svg"]}
            title="Android guide"
            description="Kotlin clients available"
          />
        </div>
      </div>
    </div>
  );
}

// Keeping this here as a template to use for other ComingSoon features in the future.
const ComingSoon = () => {
  return (
    <div className={clsx(styles.guideCard, styles.comingSoonCard)}>
      <div className={styles.comingSoonTag}>Coming soon</div>
      <div className={styles.titleAndIcon}>
        <div className={styles.logoContainer}>
          <img
            alt="JavaScript"
            src={useBaseUrl("/img/logos/javascript.svg")}
            className={styles.logo}
          />
          <img
            alt="TypeScript"
            src={useBaseUrl("/img/logos/typescript.svg")}
            className={styles.logo}
          />
        </div>

        <div>
          <p
            className={styles.title}
            style={{
              marginBottom: 0,
            }}
          >
            JavaScript &amp; TypeScript
          </p>
        </div>
      </div>
    </div>
  );
};
