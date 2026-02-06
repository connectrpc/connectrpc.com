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

import Translate, { translate } from "@docusaurus/Translate";
import {
  parseLines,
  ThemeClassNames,
  usePrismTheme,
} from "@docusaurus/theme-common/internal";
import codeBlockStyles from "@site/src/theme/CodeBlock/styles.module.css";
import {
  stripSeparatedTerminalOutput,
  stripShellPromptForClipboard,
  terminalOutputSeparator,
} from "@site/src/theme/CodeBlock/utils";
import clsx from "clsx";
import copy from "copy-text-to-clipboard";
import { Highlight, type Language } from "prism-react-renderer";
import type React from "react";
import { useEffect, useState } from "react";
import { ElizaDemo } from "../eliza-demo";
import { TerminalHeader } from "../terminal";
import Tooltip from "../tooltip";
import classes from "./examples.module.css";

const plainHttpTerminalContent = `
$ curl \\
    --header 'Content-Type: application/json' \\
    --data '{"sentence": "I feel happy."}' \\
    https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say
---
{"sentence": "Feeling happy? Tell me more."}
`;

const grpbContent = `
$ grpcurl \\
    -d '{"sentence": "I feel happy."}' \\
    demo.connectrpc.com:443 \\
    connectrpc.eliza.v1.ElizaService/Say
---
{"sentence": "Feeling happy? Tell me more."}
`;

export const Examples = () => {
  return (
    <div className={clsx(classes.container)}>
      <div className={clsx("container", classes.exampleContainer)}>
        <div className={classes.exampleTextContainer}>
          <p className={classes.exampleHeader}>
            Use it with <span>Curl</span>
          </p>
          <p className={classes.exampleText}>Supports any HTTP client</p>
        </div>
        <div className={classes.codeBlockWrapper}>
          <CodeBlock title="Plain HTTP">{plainHttpTerminalContent}</CodeBlock>
        </div>
      </div>
      <div className={clsx("container", classes.exampleContainer)}>
        <div className={clsx(classes.exampleTextContainer)}>
          <p className={clsx(classes.exampleHeader)}>
            Use it with <span>gRPCurl</span>
          </p>
          <p className={classes.exampleText}>Supports any gRPC client</p>
        </div>
        <div className={classes.codeBlockWrapper}>
          <CodeBlock title="gRPC protocol">{grpbContent}</CodeBlock>
        </div>
      </div>
      <div className={clsx("container", classes.exampleContainer)}>
        <div className={classes.exampleTextContainer}>
          <p className={classes.exampleHeader}>
            Use it in <span>web browsers</span>
          </p>
          <div className={classes.elizaExample}>
            <p className={classes.exampleText}>
              Supports React, Angular, Svelte, and other frameworks
            </p>
          </div>
        </div>
        <div className={classes.codeBlockWrapper}>
          <ElizaDemo />
        </div>
      </div>
    </div>
  );
};

function CodeBlock({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [showCopied, setShowCopied] = useState(false);
  const [mounted, setMounted] = useState(false); // The Prism theme on SSR is always the default theme but the site theme
  // can be in a different mode. React hydration doesn't update DOM styles
  // that come from SSR. Hence force a re-render after mounting to apply the
  // current relevant styles. There will be a flash seen of the original
  // styles seen using this current approach but that's probably ok. Fixing
  // the flash will require changing the theming approach and is not worth it
  // at this point.

  useEffect(() => {
    setMounted(true);
  }, []); // We still parse the metastring in case we want to support more syntax in the
  // future. Note that MDX doesn't strip quotes when parsing metastring:
  // "title=\"xyz\"" => title: "\"xyz\""

  const prismTheme = usePrismTheme(); // <pre> tags in markdown map to CodeBlocks and they may contain JSX children.
  // When the children is not a simple string, we just return a styled block
  // without actually highlighting.

  const content = Array.isArray(children) ? children.join("") : children;
  const language = "bash";
  const { lineClassNames, code } = parseLines(content as string, {
    metastring: undefined,
    language,
    magicComments: [],
  });
  const lines = code.split("\n");

  const terminalSeparatorIndex = lines.findIndex(
    (l) => l.trim() === terminalOutputSeparator
  );
  const handleCopyCode = () => {
    let textToCopy = code;
    if (language === "bash" || language === "terminal") {
      textToCopy = stripShellPromptForClipboard(textToCopy);
    }
    if (terminalSeparatorIndex !== -1) {
      textToCopy = stripSeparatedTerminalOutput(textToCopy);
    }
    copy(textToCopy);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <Highlight
      key={String(mounted)}
      theme={prismTheme}
      code={code}
      language={language ?? ("text" as Language)}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => {
        const mainTokens =
          terminalSeparatorIndex === -1
            ? tokens
            : tokens.slice(0, terminalSeparatorIndex + 1);
        const terminalOutputTokens =
          terminalSeparatorIndex === -1
            ? []
            : tokens.slice(terminalSeparatorIndex + 1);

        return (
          <div
            className={clsx(
              codeBlockStyles.codeBlockContainer,
              classes.codeBlockContainer,
              `language-${language}`,
              ThemeClassNames.common.codeBlock
            )}
          >
            <TerminalHeader>{title}</TerminalHeader>
            <div className={clsx(codeBlockStyles.codeBlockContent, language)}>
              <pre
                className={clsx(
                  className,
                  codeBlockStyles.codeBlock,
                  "thin-scrollbar",
                  classes.codeBlock,
                  classes.horizontalScrollBox
                )}
                style={style}
              >
                <code className={classes.codeBlockLines}>
                  {/* biome-ignore-start lint/suspicious/noArrayIndexKey: tokens are stable */}
                  {mainTokens.map((line, i) => {
                    // If the terminal separator is used, we only render the lines up to the separator here
                    if (
                      terminalSeparatorIndex > 0 &&
                      i >= terminalSeparatorIndex
                    ) {
                      return null;
                    }

                    if (line.length === 1 && line[0].content === "\n") {
                      line[0].content = "";
                    }

                    const lineProps = getLineProps({
                      line,
                    });

                    if (lineClassNames[i]) {
                      lineProps.className += lineClassNames[i].join(" ");
                    }

                    return (
                      <span key={i} {...lineProps}>
                        {line.map((token, key) => {
                          return (
                            <span
                              key={key}
                              {...getTokenProps({
                                token,
                              })}
                            />
                          );
                        })}
                        <br />
                      </span>
                    );
                  })}
                  {/* biome-ignore-end lint/suspicious/noArrayIndexKey: tokens are stable */}
                </code>
                {/* If the terminal separator is used, we render the content following the separator separately,
                  allowing us to style it differently */}
                {terminalSeparatorIndex === -1 ? null : (
                  <code
                    className={clsx(
                      classes.codeBlockLines,
                      classes.bufTerminalOutput
                    )}
                  >
                    {/* biome-ignore-start lint/suspicious/noArrayIndexKey: tokens are stable */}
                    {terminalOutputTokens.map((line, i) => {
                      if (line.length === 1 && line[0].content === "") {
                        line[0].content = "\n";
                      }

                      const lineProps = getLineProps({ line });
                      // Do not apply syntax highlighting to console output
                      lineProps.style = undefined;

                      return (
                        <span key={i} {...lineProps}>
                          {line.map((token, key) => {
                            const tokenProps = getTokenProps({ token });
                            // Do not apply syntax highlighting to console output
                            tokenProps.style = undefined;
                            return <span key={key} {...tokenProps} />;
                          })}
                        </span>
                      );
                    })}
                    {/* biome-ignore-end lint/suspicious/noArrayIndexKey: tokens are stable */}
                  </code>
                )}
                <div className={classes.codeFooter}>
                  <Tooltip
                    content={<>Copy</>}
                    classNameModifications={classes.tooltip}
                  >
                    <button
                      type="button"
                      aria-label={translate({
                        id: "theme.CodeBlock.copyButtonAriaLabel",
                        message: "Copy code to clipboard",
                        description:
                          "The ARIA label for copy code blocks button",
                      })}
                      onClick={handleCopyCode}
                      className={classes.copyButton}
                    >
                      {showCopied ? (
                        <Translate
                          id="theme.CodeBlock.copied"
                          description="The copied button label on code blocks"
                        >
                          Copied
                        </Translate>
                      ) : (
                        // biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M13 13L5 13L5 5L13 5L13 13ZM14 13C14 13.5523 13.5523 14 13 14L5 14C4.44772 14 4 13.5523 4 13L4 5C4 4.44771 4.44772 4 5 4L13 4C13.5523 4 14 4.44771 14 5L14 13ZM10 1L10 3L9 3L9 1L1 0.999999L1 9L3 9L3 10L1 10C0.447716 10 3.88832e-07 9.55228 4.37114e-07 9L1.1365e-06 0.999999C1.18478e-06 0.447714 0.447715 -1.18478e-06 1 -1.1365e-06L9 -4.37114e-07C9.55229 -3.88832e-07 10 0.447714 10 1Z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </button>
                  </Tooltip>
                </div>
              </pre>
            </div>
          </div>
        );
      }}
    </Highlight>
  );
}
