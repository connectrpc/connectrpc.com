import React, { CSSProperties } from "react";

export const Divider = ({ style }: { style?: CSSProperties }) => {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "1px",
        backgroundColor: "var(--buf-grey-04)",
        opacity: "0.1",
        ...style
      }}
    />
  );
};
