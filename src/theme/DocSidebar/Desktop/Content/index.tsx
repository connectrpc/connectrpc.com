import React, { useRef } from "react";
import Content from "@theme-original/DocSidebar/Desktop/Content";
import bufStyles from "./styles.module.css";

export default function ContentWrapper(props) {
  const domRef = useRef<HTMLDivElement>(null);
  const toggleAll = (open: boolean) => {
    if (domRef.current) {
      // find all open or closed elements (depending on which way we're going) and
      // click them
      domRef.current.parentElement
        ?.querySelectorAll(`:scope > nav > ul > li a[aria-expanded="${!open}"]`)
        .forEach((domNode: HTMLElement) => {
          domNode.click();
        });
    }
  };
  return (
    <>
      <div className={bufStyles.expandAllControls} ref={domRef}>
        <button onClick={() => toggleAll(true)}>expand all</button>
        <button onClick={() => toggleAll(false)}>collapse all</button>
      </div>
      <Content {...props} />
    </>
  );
}
