import { defineConfig } from "vite";
import swc from "unplugin-swc";

export default defineConfig({
  plugins: [swc.vite()],
  test: { include: ["./src/test/**/*.test.ts"], fileParallelism: false },
});
