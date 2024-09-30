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

import React, {
  ChangeEvent,
  KeyboardEvent,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

interface TerminalProps {
  conversation: Message[];
  handleCommand: (str: string) => void;
  focusOnMount: boolean;
}

export interface Message {
  text: string;
  sender: "eliza" | "user";
}

type TerminalHeaderProps = {
  children: React.ReactNode;
};
export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  children,
}: PropsWithChildren<TerminalHeaderProps>) => {
  return (
    <div className={clsx(styles.terminalHeaderWrapper)}>
      <div className={styles.terminalHeaderFakeButtons}>
        <div className={styles.terminalHeaderFakeButton} />
        <div className={styles.terminalHeaderFakeButton} />
        <div className={styles.terminalHeaderFakeButton} />
      </div>
      <div className={styles.terminalHeaderText}>{children}</div>
    </div>
  );
};

export const Terminal: React.FC<TerminalProps> = ({
  conversation,
  handleCommand,
  focusOnMount = false,
}) => {
  const [inputText, setInputText] = useState("");

  // Ref for the terminal scroll container
  const terminalRef = useRef<null | HTMLDivElement>(null);
  // Ref for the hidden input
  const inputRef = useRef<null | HTMLInputElement>(null);

  // Focuses the hidden input
  const handleTerminalFocus = () => {
    inputRef.current.focus();
  };

  // Handler for typing into the terminal into the hidden input element
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  // Handler for pressing Enter key
  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleCommand(inputText);
      setInputText("");
    }
  };

  // If focusOnMount is true, focus the terminal input when the component mounts
  useEffect(() => {
    if (focusOnMount) {
      handleTerminalFocus();
    }
  });

  useEffect(() => {
    // If the terminal scroll container has a scroll visibile, scroll to the bottom
    if (terminalRef.current.scrollHeight > terminalRef.current.clientHeight) {
      terminalRef.current?.scrollTo(0, terminalRef.current?.scrollHeight);
    }
  });

  return (
    <div className={styles.terminalContainer} onClick={handleTerminalFocus}>
      <TerminalHeader>Connect-Web</TerminalHeader>
      <div className={styles.terminalBody}>
        <div className={styles.terminalOverflow} ref={terminalRef}>
          {conversation.map((msg, i) => {
            const key = `text${i}`;
            if (msg.sender === "user") {
              return (
                <p key={key} className={styles.userText}>
                  <span className={styles.spacer}></span>
                  {msg.text}
                </p>
              );
            }
            return (
              <p key={key} className={styles.elizaText}>
                <span className={styles.spacer}></span>Eliza: {msg.text}
              </p>
            );
          })}
          <div className={styles.prompt}>
            <span className={styles.spacer}></span>
            <input
              className={styles.inputElement}
              onKeyDown={handleKeyPress}
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              type="text"
            ></input>
            {inputText.split("").map((letter, i) => {
              return (
                <span key={`inputText${i}`}>
                  {/* If the current letter is a space, then add a Unicode space */}
                  {letter === " " ? "\u00A0" : letter}
                </span>
              );
            })}
            <div className={styles.blinkingCursor}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
