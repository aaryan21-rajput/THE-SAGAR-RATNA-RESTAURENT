import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["e2e-tests/**/*", "node_modules/**/*", "dist/**/*"],
    coverage: {
      provider: "v8",
      include: ["src/lib/db.ts", "server.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
