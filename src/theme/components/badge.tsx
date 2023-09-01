import clsx from "clsx";
import React from "react";

import styles from "./badge.module.css";

export interface BadgeProps {
  label: string;
  severity: "danger" | "warning" | "neutral" | "info";
}

export function Badge(props: BadgeProps): JSX.Element {
  return (
    <span
      className={clsx({
        [styles.badge]: true,
        [styles.danger]: props.severity === "danger",
        [styles.warning]: props.severity === "warning",
        [styles.neutral]: props.severity === "neutral",
        [styles.info]: props.severity === "info",
      })}
    >
      {props.label}
    </span>
  );
}
