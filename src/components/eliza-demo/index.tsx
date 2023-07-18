import { ElizaService } from "./gen/buf/connect/demo/eliza/v1/eliza_connectweb";
import React, { useCallback, useEffect, useRef } from "react";
import { Terminal, useEventQueue, textLine, textWord, commandLine } from "crt-terminal";
import { createConnectTransport, createPromiseClient } from "@bufbuild/connect-web";
import styles from "./styles.module.css";
import { TerminalHeader } from "../home/examples";

const host = "https://demo.connectrpc.com";

const transport = createConnectTransport({
  baseUrl: host
});

const elizaServicePromiseClient = createPromiseClient(ElizaService, transport);

export const ElizaDemo: React.FC<{ focusOnMount?: boolean }> = ({ focusOnMount = false }) => {
  const eventQueue = useEventQueue();
  const { print, focus } = eventQueue.handlers;

  const callbackRef = useRef(false);
  useEffect(() => {
    if (callbackRef.current) {
      return;
    }
    print([
      commandLine({
        words: [textWord({ characters: "> Meet Eliza, our psychotherapist." })]
      }),
      textLine({
        words: [
          textWord({ characters: "Eliza: " }),
          textWord({ characters: "Hi! How are you feeling?" })
        ],
        className: styles.elizaResponse
      })
    ]);
    callbackRef.current = true;
  }, []);

  const handleCommand = useCallback(
    async (str: string) => {
      const response = await elizaServicePromiseClient.say({
        sentence: str
      });
      print([
        textLine({
          words: [textWord({ characters: "Eliza: " }), textWord({ characters: response.sentence })],
          className: styles.elizaResponse
        })
      ]);
    },
    [elizaServicePromiseClient, print]
  );

  return (
    <div className={styles.container} onClick={() => focus()}>
      <TerminalHeader>Connect-Web</TerminalHeader>
      <Terminal
        queue={eventQueue}
        onCommand={handleCommand}
        effects={{
          pixels: false,
          screenEffects: true,
          textEffects: false
        }}
        focusOnMount={focusOnMount}
      />
    </div>
  );
};
