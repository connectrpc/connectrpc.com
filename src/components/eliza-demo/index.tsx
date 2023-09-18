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

import { ElizaService } from "@buf/connectrpc_eliza.connectrpc_es/connectrpc/eliza/v1/eliza_connect";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Terminal,
  useEventQueue,
  textLine,
  textWord,
  commandLine,
} from "crt-terminal";
import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import styles from "./styles.module.css";
import { TerminalHeader } from "../home/examples";

const host = "https://demo.connectrpc.com";

const transport = createConnectTransport({
  baseUrl: host,
});

const elizaServicePromiseClient = createPromiseClient(ElizaService, transport);

export const ElizaDemo: React.FC<{ focusOnMount?: boolean }> = ({
  focusOnMount = false,
}) => {
  const eventQueue = useEventQueue();
  const { print, focus } = eventQueue.handlers;

  const callbackRef = useRef(false);
  useEffect(() => {
    if (callbackRef.current) {
      return;
    }
    print([
      commandLine({
        words: [textWord({ characters: "> Meet Eliza, our psychotherapist." })],
      }),
      textLine({
        words: [
          textWord({ characters: "Eliza: " }),
          textWord({ characters: "Hi! How are you feeling?" }),
        ],
        className: styles.elizaResponse,
      }),
    ]);
    callbackRef.current = true;
  }, []);

  const handleCommand = useCallback(
    async (str: string) => {
      const response = await elizaServicePromiseClient.say({
        sentence: str,
      });
      print([
        textLine({
          words: [
            textWord({ characters: "Eliza: " }),
            textWord({ characters: response.sentence }),
          ],
          className: styles.elizaResponse,
        }),
      ]);
    },
    [elizaServicePromiseClient, print],
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
          textEffects: false,
        }}
        focusOnMount={focusOnMount}
      />
    </div>
  );
};
