import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["engine/tests/**/*.test.ts"],
    environment: "node",
  },
});
