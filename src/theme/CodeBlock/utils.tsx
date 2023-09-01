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
