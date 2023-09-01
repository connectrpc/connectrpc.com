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
