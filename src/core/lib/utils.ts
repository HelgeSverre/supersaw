export const createUUID = (prefix: string): string => {
  return `${prefix}-${crypto.randomUUID()}`;
};
