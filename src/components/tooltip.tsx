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

// Copied from buf core, replace once we publish design system somewhere these docs can use it from.

import clsx from "clsx";
import type React from "react";
import { type PropsWithChildren, useEffect, useState } from "react";

type TooltipProps = {
  content: string | JSX.Element;
  // include any classes to position the tooltip here; for more, see:
  // https://tailwindcss.com/docs/top-right-bottom-left#class-reference
  classNameModifications?: string;
  // activeClassName sets a class on the tooltip container when active
  activeClassName?: string;
  // leaveOn sets the tooltip to stay on if it's true
  leaveOn?: boolean;
  children: React.ReactNode;
};

const Tooltip: React.FC<TooltipProps> = ({
  content,
  classNameModifications = "",
  activeClassName = "",
  children,
  leaveOn,
}: PropsWithChildren<TooltipProps>) => {
  const [visible, setVisible] = useState<boolean>(false);
  const hidden = !visible;

  useEffect(() => {
    if (leaveOn === true) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [leaveOn]);

  return (
    /* biome-ignore lint/a11y/noStaticElementInteractions: tooltips are interactive; arguably this should not be a div */
    <div
      className={clsx({
        [activeClassName]: visible,
      })}
      style={{
        display: "inline-block",
        position: "relative",
      }}
      onMouseEnter={() => {
        setVisible(true);
      }}
      onMouseLeave={() => {
        if (leaveOn !== true) {
          setVisible(false);
        }
      }}
    >
      {children}
      <div
        className={classNameModifications}
        style={{
          display: hidden ? "none" : undefined,
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
