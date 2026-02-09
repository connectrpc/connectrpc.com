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

import clsx from "clsx";
import BufLogo from "./buf.svg";
import styles from "./created-by.module.css";

export const CreatedBy = ({ className }: { className?: string }) => {
  return (
    <div className={clsx(styles.createdByWrapper, className)}>
      <a href="https://buf.build" className={clsx(styles.bufButton)}>
        <span>Created by</span>
        <div className={styles.bufLogo}>
          <BufLogo />
        </div>
      </a>
    </div>
  );
};
