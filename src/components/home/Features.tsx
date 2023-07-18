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
