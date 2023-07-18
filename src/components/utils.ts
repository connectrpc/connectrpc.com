export const key = (s: string): string => {
  return s.replace(/^\s+|\s+$/g, "");
};
