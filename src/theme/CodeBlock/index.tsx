/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { isValidElement, useEffect, useState } from "react";
import clsx from "clsx";
import { Highlight, type Language } from "prism-react-renderer";
import copy from "copy-text-to-clipboard";
import Translate, { translate } from "@docusaurus/Translate";
import {
  useThemeConfig,
  parseCodeBlockTitle,
  parseLanguage,
  parseLines,
  ThemeClassNames,
  usePrismTheme,
} from "@docusaurus/theme-common/internal";
import styles from "./styles.module.css";
import {
  stripSeparatedTerminalOutput,
  stripShellPromptForClipboard,
  terminalOutputSeparator,
} from "./utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  metastring?: string;
  title?: string;
  language?: Language;
}

export default function CodeBlock({
  children,
  className: blockClassName = "",
  metastring,
  title,
  language: languageProp,
}: Props) {
  const {
    prism: { defaultLanguage, magicComments },
  } = useThemeConfig();
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

  const codeBlockTitle = parseCodeBlockTitle(metastring) || title;
  const prismTheme = usePrismTheme(); // <pre> tags in markdown map to CodeBlocks and they may contain JSX children.
  // When the children is not a simple string, we just return a styled block
  // without actually highlighting.

  if (React.Children.toArray(children).some((el) => isValidElement(el))) {
    return (
      <Highlight
        key={String(mounted)}
        theme={prismTheme}
        code=""
        language={"text" as any}
      >
        {({ className, style }) => (
          <pre
            /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
            tabIndex={0}
            className={clsx(
              className,
              styles.codeBlockStandalone,
              "thin-scrollbar",
              styles.codeBlockContainer,
              blockClassName,
              ThemeClassNames.common.codeBlock,
            )}
            style={{
              ...style,
            }}
          >
            <code className={styles.codeBlockLines}>{children}</code>
          </pre>
        )}
      </Highlight>
    );
  } // The children is now guaranteed to be one/more plain strings

  const content = Array.isArray(children) ? children.join("") : children;
  const language =
    languageProp ?? parseLanguage(blockClassName) ?? defaultLanguage;
  const { lineClassNames, code } = parseLines(content as any, {
    metastring,
    language,
    magicComments,
  });
  let terminalSeparatorIndex = -1;
  if (language === "bash" || language === "terminal") {
    const lines = code.split("\n");

    terminalSeparatorIndex = lines.findIndex(
      (l) => l.trim() === terminalOutputSeparator,
    );
  }
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
      language={language ?? ("text" as any)}
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
              styles.codeBlockContainer,
              blockClassName,
              {
                [`language-${language}`]:
                  language && !blockClassName.includes(`language-${language}`),
              },
              ThemeClassNames.common.codeBlock,
            )}
          >
            {codeBlockTitle && (
              <div style={style} className={styles.codeBlockTitle}>
                {codeBlockTitle}
              </div>
            )}
            <div className={clsx(styles.codeBlockContent, language)}>
              <pre
                /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
                tabIndex={0}
                className={clsx(className, styles.codeBlock, "thin-scrollbar")}
                style={style}
              >
                <code className={styles.codeBlockLines}>
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
                      key: i,
                    });

                    if (lineClassNames[i]) {
                      lineProps.className += lineClassNames[i].join(" ");
                    }

                    return (
                      <span key={i} {...lineProps}>
                        {line.map((token, key) => (
                          <span
                            key={key}
                            {...getTokenProps({
                              token,
                              key,
                            })}
                          />
                        ))}
                        <br />
                      </span>
                    );
                  })}
                </code>
                {/* If the terminal separator is used, we render the content following the separator separately,
                  allowing us to style it differently */}
                {terminalSeparatorIndex === -1 ? null : (
                  <>
                    <div className={styles.bufTerminalOutputSeparator}>
                      <span>Output</span>
                    </div>
                    <code
                      className={clsx(
                        styles.codeBlockLines,
                        styles.bufTerminalOutput,
                      )}
                    >
                      {terminalOutputTokens.map((line, i) => {
                        // adjust line index with offset of separator, plus 1 for the separator line which we don't render
                        i += terminalSeparatorIndex + 1;

                        if (line.length === 1 && line[0].content === "") {
                          line[0].content = "\n"; // eslint-disable-line no-param-reassign
                        }

                        const lineProps = getLineProps({ line, key: i });
                        // Do not apply syntax highlighting to console output
                        delete lineProps.style;

                        return (
                          <span key={i} {...lineProps}>
                            {line.map((token, key) => {
                              const tokenProps = getTokenProps({ token, key });
                              // Do not apply syntax highlighting to console output
                              delete tokenProps.style;
                              return <span key={key} {...tokenProps} />;
                            })}
                          </span>
                        );
                      })}
                    </code>
                  </>
                )}
              </pre>

              <button
                type="button"
                aria-label={translate({
                  id: "theme.CodeBlock.copyButtonAriaLabel",
                  message: "Copy code to clipboard",
                  description: "The ARIA label for copy code blocks button",
                })}
                className={clsx(styles.copyButton, "clean-btn")}
                onClick={handleCopyCode}
              >
                {showCopied ? (
                  <Translate
                    id="theme.CodeBlock.copied"
                    description="The copied button label on code blocks"
                  >
                    Copied
                  </Translate>
                ) : (
                  <Translate
                    id="theme.CodeBlock.copy"
                    description="The copy button label on code blocks"
                  >
                    Copy
                  </Translate>
                )}
              </button>
            </div>
          </div>
        );
      }}
    </Highlight>
  );
}
