import React from "react";
import styles from "./styles.module.css";
import { TerminalHeader } from "../home/examples";

export const Terminal: React.FC<{ focusOnMount?: boolean }> = ({
  focusOnMount = false,
}) => {
  const titleText = "> Meet Eliza, our psychotherapist";

  const elizaText = ["Hello, how are you feeling?"];

  return (
    <div className={styles.terminalContainer}>
      <TerminalHeader>Connect-Web</TerminalHeader>
      <div className={styles.terminal}>
        <p className={styles.titleText}>{titleText}</p>
        {elizaText.map((text) => {
          return (
            <p className={styles.elizaText}>
              <span>{`> `}</span>Eliza: {text}
            </p>
          );
        })}
        <div className={styles.userText}>
          <span>{`> `}</span>
          <span className={styles.blinkingCursor}>|</span>
          <input className={styles.userInput}></input>
        </div>
      </div>
    </div>
  );
};
