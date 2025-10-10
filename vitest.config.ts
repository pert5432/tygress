import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ["./src/test/**/*.test.ts"],
    fileParallelism: false,
    setupFiles: ["dotenv/config"],
  },
});
