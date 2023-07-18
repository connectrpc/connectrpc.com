import { callout } from "@site/src/components/home/text";
import React from "react";

import styles from "./Callout.module.css";

export default function Callout(): JSX.Element {
  return (
    <div className={styles.callout}>
      <span className={styles.text}>{callout.text}</span>
      <a href={callout.button.href} className={styles.button}>
        {callout.button.text}
      </a>
    </div>
  );
}
