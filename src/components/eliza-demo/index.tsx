// Copyright 2021-2025 The Connect Authors
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

import { ElizaService } from "@buf/connectrpc_eliza.bufbuild_es/connectrpc/eliza/v1/eliza_pb";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import type React from "react";
import { useCallback, useState } from "react";
import { type Message, Terminal } from "../terminal";

const host = "https://demo.connectrpc.com";

const transport = createConnectTransport({
  baseUrl: host,
});

const elizaServicePromiseClient = createClient(ElizaService, transport);

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
      return;
    },
    [conversation]
  );

  return (
    <Terminal
      conversation={conversation}
      handleCommand={handleCommand}
      focusOnMount={focusOnMount}
    />
  );
};
