// Copyright 2023 Buf Technologies, Inc.
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

// Strips the prefix "$ " from every line of code.
export const stripShellPromptForClipboard = (code: string): string => {
  const prefix = "$ ";
  return code
    .split("\n")
    .map((line) => {
      if (line.startsWith(prefix)) {
        return line.substring(prefix.length);
      }
      return line;
    })
    .join("\n");
};

// For the language identifier "bash", we allow console output following a
// command to be separated by a line with three dashes "---".
export const terminalOutputSeparator = "---";

export const stripSeparatedTerminalOutput = (code: string): string => {
  const lines = code.split("\n");
  const index = lines.findIndex((l) => l.trim() === terminalOutputSeparator);
  return lines.slice(0, index).join("\n");
};
