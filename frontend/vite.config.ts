import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Keep the Lovable sandbox target unchanged, but emit a Vercel-compatible
  // Nitro bundle when this repository is built by Vercel.
  nitro: process.env.VERCEL ? { preset: "vercel" } : undefined,
  tanstackStart: {
    server: { entry: "server" },
  },
});
