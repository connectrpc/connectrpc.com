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

import clsx from "clsx";
import React from "react";

import styles from "./badge.module.css";

export interface BadgeProps {
  label: string;
  severity: "danger" | "warning" | "neutral" | "info";
}

export function Badge(props: BadgeProps): JSX.Element {
  return (
    <span
      className={clsx({
        [styles.badge]: true,
        [styles.danger]: props.severity === "danger",
        [styles.warning]: props.severity === "warning",
        [styles.neutral]: props.severity === "neutral",
        [styles.info]: props.severity === "info",
      })}
    >
      {props.label}
    </span>
  );
}
