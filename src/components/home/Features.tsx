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

import { FeatureItem, featureList } from "@site/src/components/home/text";
import React from "react";

import styles from "./Features.module.css";

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={styles.feature}>
      <h4 className={styles.featureTitle}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="10" fill="currentColor" />
          <path d="M5 9.32562L8.80071 13L15 7" stroke="white" strokeWidth="0.9375" />
        </svg>

        {title}
      </h4>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

export default function Features(): JSX.Element {
  return (
    <div className="container" style={{ position: "relative" }}>
      <div className={styles.features}>
        {featureList.map((props, idx) => (
          <Feature key={idx} {...props} />
        ))}
      </div>
    </div>
  );
}
