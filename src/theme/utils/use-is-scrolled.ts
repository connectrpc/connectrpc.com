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

import { useLayoutEffect, useState } from "react";
import { useIsMounted } from "@react-hookz/web";

export function useIsScrolled({ threshold }: { threshold: number }) {
  const getIsMounted = useIsMounted();
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== "undefined") {
      return window.scrollY > threshold;
    }
    return false;
  });
  useLayoutEffect(() => {
    let timer: number | undefined;
    const onScroll = (e: Event) => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      timer = window.requestAnimationFrame(() => {
        if (getIsMounted()) {
          setIsScrolled(window.scrollY > threshold);
        }
      });
    };
    window.addEventListener("scroll", onScroll);

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);
  return isScrolled;
}
