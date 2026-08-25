import {
  defineConfig,
} from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",

    setupFiles: [
      "./tests/setup.ts",
    ],

    globals: true,

    css: true,

    include: [
      "tests/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
    ],
  },
});
