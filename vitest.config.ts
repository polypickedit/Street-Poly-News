import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "tests/setup.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["dist", "node_modules", "tests/e2e"],
    coverage: {
      reporter: ["text", "html"],
    },
    deps: {
      inline: ["@radix-ui/react-dialog", "@radix-ui/react-slot", "@radix-ui/react-toast"],
    },
  },
});
