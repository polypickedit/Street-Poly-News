import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

const envTestPath = path.resolve(__dirname, ".env.test");
if (fs.existsSync(envTestPath)) {
  const contents = fs.readFileSync(envTestPath, "utf-8");
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...rest] = trimmed.split("=");
    process.env[key.trim()] = rest.join("=").trim();
  });
}

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
