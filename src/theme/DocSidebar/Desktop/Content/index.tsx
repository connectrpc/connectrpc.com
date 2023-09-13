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
