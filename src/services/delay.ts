export function delay(ms?: number): Promise<void> {
  const duration = ms ?? 300 + Math.floor(Math.random() * 301);
  return new Promise((resolve) => setTimeout(resolve, duration));
}
