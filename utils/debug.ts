export const DEBUG = process.env.DEBUG === "true";

export function debugError(label: string, err: unknown): void {
  if (!DEBUG) return;
  console.error(`[DEBUG] [${label}]`, err);
}
