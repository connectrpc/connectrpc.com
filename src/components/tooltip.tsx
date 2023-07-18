// Copyright 2020-2022 Buf Technologies, Inc.
//
// All rights reserved.

// Copied from buf core, replace once we publish design system somewhere these docs can use it from.

import clsx from "clsx";
import React, { PropsWithChildren, useEffect, useState } from "react";

type TooltipProps = {
  content: string | JSX.Element;
  // include any classes to position the tooltip here; for more, see:
  // https://tailwindcss.com/docs/top-right-bottom-left#class-reference
  classNameModifications?: string;
  // activeClassName sets a class on the tooltip container when active
  activeClassName?: string;
  // leaveOn sets the tooltip to stay on if it's true
  leaveOn?: boolean;
};

const Tooltip: React.FC<TooltipProps> = ({
  content,
  classNameModifications = "",
  activeClassName = "",
  children,
  leaveOn
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
    <div
      className={clsx({
        [activeClassName]: visible
      })}
      style={{
        display: "inline-block",
        position: "relative"
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
          display: hidden ? "none" : undefined
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
