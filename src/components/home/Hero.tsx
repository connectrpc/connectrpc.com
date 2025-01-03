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

import {
  subTagline,
  tagline,
  description,
} from "@site/src/components/home/text";
import clsx from "clsx";
import React, { forwardRef } from "react";
import styles from "./Hero.module.css";

const Hero = forwardRef<HTMLElement>((_props, ref) => {
  return (
    <header className={clsx(styles.heroBanner)} ref={ref}>
      <div className={clsx("container", styles.container)}>
        <h1 className={clsx("hero__title", styles.title)}>{tagline}</h1>

        <h2 className={clsx("hero__subtitle", styles.subtitle)}>
          {subTagline}
        </h2>
        <p className={styles.description}>{description}</p>
      </div>
    </header>
  );
});

Hero.displayName = "Hero";

export default Hero;
