import clsx from "clsx";
import React from "react";
import styles from "./created-by.module.css";
import BufLogo from "./buf.svg";

export const CreatedBy = ({ className }: { className?: string }) => {
  return (
    <div className={clsx(styles.createdByWrapper, className)}>
      <a href="https://buf.build" className={clsx(styles.bufButton)}>
        <span>Created by</span>
        <div className={styles.bufLogo}>
          <BufLogo />
        </div>
      </a>
    </div>
  );
};
