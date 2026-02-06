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

import type React from "react";

export default function IconMenu({
  width = 20,
  height = 20,
  className,
  ...restProps
}: React.SVGProps<SVGSVGElement>) {
  return (
    <>
      <svg
        className={className}
        width={width}
        height={height}
        viewBox="0 0 30 30"
        aria-hidden="true"
        {...restProps}
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeMiterlimit="10"
          strokeWidth="2"
          d="M4 7h22M4 15h22M4 23h22"
        />
      </svg>
      Menu
    </>
  );
}
