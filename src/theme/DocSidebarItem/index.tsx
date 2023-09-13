// Copyright 2022-2023 The Connect Authors
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

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import DocSidebarItemCategory from "@theme/DocSidebarItem/Category";
import DocSidebarItemLink from "@theme/DocSidebarItem/Link";
import DocSidebarItemHtml from "@theme/DocSidebarItem/Html";
import type { Props } from "@theme/DocSidebarItem";

export default function DocSidebarItem({
  item,
  ...props
}: Props): JSX.Element | null {
  switch (item.type) {
    case "category":
      return <DocSidebarItemCategory item={item} {...props} />;
    case "html":
      return <DocSidebarItemHtml item={item} {...props} />;
    case "link":
    default:
      return <DocSidebarItemLink item={item} {...props} />;
  }
}
