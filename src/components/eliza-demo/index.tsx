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
import React, { useCallback, useState } from "react";
import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { Terminal as BufTerminal, Message } from "../terminal";

const host = "https://demo.connectrpc.com";

const transport = createConnectTransport({
  baseUrl: host,
});

const elizaServicePromiseClient = createPromiseClient(ElizaService, transport);

interface DemoProps {
  focusOnMount?: boolean;
}

export const ElizaDemo: React.FC<DemoProps> = ({ focusOnMount = false }) => {
  const [conversation, setConversation] = useState<Message[]>([
    {
      sender: "user",
      text: "Meet Eliza, our psychotherapist",
    },
    {
      sender: "eliza",
      text: "Hello, how are you feeling?",
    },
  ]);

  const handleCommand = useCallback(
    async (inputText: string) => {
      const response = await elizaServicePromiseClient.say({
        sentence: inputText,
      });
      const updated = [
        { sender: "user", text: inputText } as Message,
        { sender: "eliza", text: response.sentence } as Message,
      ];
      const updatedConvo = [...conversation, ...updated];
      setConversation(updatedConvo);
    },
    [elizaServicePromiseClient, conversation],
  );

  return (
    <BufTerminal
      conversation={conversation}
      handleCommand={handleCommand}
      focusOnMount={focusOnMount}
    />
  );
};
