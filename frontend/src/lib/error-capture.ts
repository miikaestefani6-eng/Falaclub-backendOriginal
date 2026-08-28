let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;
export function describeError(error: unknown) { return error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error); }
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => { const error = args.find((arg) => arg instanceof Error); if (error) lastCapturedError = { error, at: Date.now() }; originalConsoleError(...args.map((arg) => arg instanceof Error ? describeError(arg) : arg)); };
export function consumeLastCapturedError() { if (!lastCapturedError || Date.now() - lastCapturedError.at > TTL_MS) { lastCapturedError = undefined; return undefined; } const error = lastCapturedError.error; lastCapturedError = undefined; return error; }
