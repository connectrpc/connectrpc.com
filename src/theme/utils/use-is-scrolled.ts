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
