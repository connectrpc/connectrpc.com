import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { TerminalHeader } from "../home/examples";

interface Message {
  text: string;
  sender: "eliza" | "user";
}

export const Terminal: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [convo, setConvo] = useState<Message[]>([
    {
      sender: "user",
      text: "> Meet Eliza, our psychotherapist",
    },
    {
      sender: "eliza",
      text: "Hello, how are you feeling?",
    },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleKeyPress = (event: any) => {
    const response = [
      { sender: "user", text: `> ${inputText}` } as Message,
      { sender: "eliza", text: "Wow!" } as Message,
    ];
    if (event.key === "Enter") {
      const updatedConvo = [...convo, ...response];
      setConvo(updatedConvo);
      setInputText("");
    }
  };

  return (
    <div className={styles.terminalContainer}>
      <TerminalHeader>Connect-Web</TerminalHeader>
      <div className={styles.terminalBody}>
        <div
          className="terminal-module-overflow"
          style={{ overflow: "auto", height: "100%" }}
        >
          <div
            className="commandline-mobule-input-wrap"
            style={{
              position: "relative",
            }}
          >
            {convo.map((msg, i) => {
              if (msg.sender === "user") {
                return (
                  <p key={`userText${i}`} className={styles.titleText}>
                    {msg.text}
                  </p>
                );
              }
              return (
                <p key={`resp${i}`} className={styles.elizaText}>
                  <span className={styles.spacer}>{`> `}</span>Eliza: {msg.text}
                </p>
              );
            })}
            <div
              style={{
                marginTop: "7px",
                display: "flex",
                flex: "1 1 auto",
                width: "100%",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  marginRight: "7px",
                }}
              >{`> `}</span>
              <input
                onKeyDown={handleKeyPress}
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                type="text"
                style={{
                  opacity: 0,
                  position: "absolute",
                }}
              ></input>
              {inputText.split("").map((letter, i) => {
                if (letter === " ") {
                  return <span key={`inputText${i}`}>&nbsp;</span>;
                }
                return <span key={`inputText${i}`}>{letter}</span>;
              })}
              <div className={styles.blink}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
